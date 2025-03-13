import { fetchChats, createChat, sendMessage, deleteChat, renameChat } from '../utils/api.js';
import { handleApiError, handleNetworkError } from '../utils/error.js';
import { createSidebarResizer } from '../utils/sidebar.js';
import { renderMarkdown } from '../utils/markdown.js';
import config from '../config/index.js';

export function createChatStore() {
    const safeGetLocalStorage = (key, defaultValue) => {
        if (typeof window === 'undefined' || !window.localStorage) {
            console.warn('LocalStorage is not available');
            return defaultValue;
        }
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (e) {
            console.warn(`Failed to access localStorage for key ${key}:`, e);
            return defaultValue;
        }
    };

    const safeSetLocalStorage = (key, value) => {
        if (typeof window === 'undefined' || !window.localStorage) {
            console.warn('LocalStorage is not available');
            return;
        }
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn(`Failed to set localStorage for key ${key}:`, e);
        }
    };

    return {
        messages: [],
        chats: [],
        currentChatId: null,
        isThinking: false,
        message: '',
        error: null,
        sidebarOpen: true,
        darkMode: (() => {
            try {
                return safeGetLocalStorage(config.storage.keys.darkMode, 'false') === 'true' || 
                       (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
            } catch (e) {
                console.warn('Failed to get dark mode preference:', e);
                return false;
            }
        })(),
        sidebarWidth: (() => {
            try {
                return parseInt(safeGetLocalStorage(config.storage.keys.sidebarWidth, config.ui.defaultSidebarWidth)) || config.ui.defaultSidebarWidth;
            } catch (e) {
                console.warn('Failed to get sidebar width:', e);
                return config.ui.defaultSidebarWidth;
            }
        })(),
        isDragging: false,
        modelSelectorOpen: false,
        selectedModel: (() => {
            try {
                return safeGetLocalStorage(config.storage.keys.selectedModel, config.models.default);
            } catch (e) {
                console.warn('Failed to get selected model:', e);
                return config.models.default;
            }
        })(),
        models: config.models.available,
        showScrollButtons: false,

        ...createSidebarResizer(),

        async init() {
            this.$watch('darkMode', value => {
                safeSetLocalStorage(config.storage.keys.darkMode, value);
                if (value) {
                    document.documentElement.classList.add('dark');
            } else {
                    document.documentElement.classList.remove('dark');
                }
            });
            
            if (this.darkMode) {
                document.documentElement.classList.add('dark');
            }

            await this.loadInitialData();
            
            this.$nextTick(() => {
                const chatContainer = this.$refs.chatContainer;
                if (chatContainer) {
                    chatContainer.addEventListener('scroll', () => this.checkScroll());
                    window.addEventListener('resize', () => this.checkScroll());
                    this.checkScroll();
                }
            });
        },

        renderMarkdown(text) {
            return renderMarkdown(text);
        },

        async loadInitialData() {
            try {
                await this.loadModels();
                await this.loadChats();
                
                // 初始化时不选中任何会话
                this.messages = [];
                this.currentChatId = null;
            } catch (error) {
                const { message, timeout } = handleApiError(error, 'initialization');
                this.error = message;
                setTimeout(() => {
                    this.error = null;
                }, timeout);
            }
        },

        async loadChatMessages(chatId) {
            try {
                const response = await fetch(`${config.api.baseUrl}/api/chats/${chatId}/messages`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const messages = await response.json();
                this.messages = messages;
                this.currentChatId = chatId;
            } catch (error) {
                const { message, timeout } = handleApiError(error, 'loading chat messages');
                this.error = message;
                setTimeout(() => {
                    this.error = null;
                }, timeout);
                this.messages = [];
            }
        },

        async loadModels() {
            try {
                const response = await fetch(`${config.api.baseUrl}/api/models`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                this.models = data.models || config.models.available;
                
                if (this.models.length > 0) {
                    if (!localStorage.getItem(config.storage.keys.selectedModel) || 
                        !this.models.includes(this.selectedModel)) {
                        this.selectedModel = this.models[0];
                        localStorage.setItem(config.storage.keys.selectedModel, this.models[0]);
                    }
                }
            } catch (error) {
                const { message } = handleApiError(error, 'loading models');
                console.error(message);
                this.models = config.models.available;
            }
        },

        async loadChats() {
            try {
                const response = await fetch(`${config.api.baseUrl}/api/chats`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const chats = await response.json();
                this.chats = Array.isArray(chats) ? chats : [];
            } catch (error) {
                const { message, timeout } = handleApiError(error, 'loading chats');
                this.error = message;
                setTimeout(() => {
                    this.error = null;
                }, timeout);
                this.chats = [];
            }
        },

        async createNewChat() {
            try {
                if (!this.selectedModel) {
                    throw new Error('未选择模型');
                }

                const response = await fetch(`${config.api.baseUrl}/api/chats`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: config.chat.defaultTitle,
                        model: this.selectedModel
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                if (data && data.chat) {
                    this.chats.unshift(data.chat);
                    this.currentChatId = data.chat.id;
                this.messages = [];
                    return data.chat;
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                const { message, timeout } = handleApiError(error, 'creating chat');
                this.error = message;
                setTimeout(() => {
                    this.error = null;
                }, timeout);
                return null;
            }
        },

        async sendMessage(messageText) {
            try {
                if (!messageText || !messageText.trim()) {
                    throw new Error('消息内容不能为空');
                }

                if (!this.currentChatId) {
                    // Create a new chat if none exists
                    const chat = await this.createNewChat();
                    if (!chat) {
                        throw new Error('创建新对话失败');
                    }
                }

                // Check if this is the first message and chat has default title
                const currentChat = this.chats.find(chat => chat.id === this.currentChatId);
                const isDefaultTitle = currentChat && currentChat.title === config.chat.defaultTitle;
                const isFirstMessage = this.messages.length === 0;

                // Add user message
                this.messages = [...this.messages, { 
                role: 'user',
                    content: messageText,
                    created_at: new Date().toISOString(),
                    showCopySuccess: false
                }];
                
                // Auto rename chat if it's the first message
                if (isFirstMessage && isDefaultTitle) {
                    const newTitle = messageText.slice(0, 20) + (messageText.length > 20 ? '...' : '');
                    await this.renameChat(this.currentChatId, newTitle);
                }
                
                // Set thinking state before adding empty message
            this.isThinking = true;

                // Add empty assistant message that will be updated
                this.messages = [...this.messages, { 
                    role: 'assistant', 
                    content: '',
                    created_at: new Date().toISOString(),
                    showCopySuccess: false
                }];
                
                // Get the last message (assistant's message)
                const lastMessageIndex = this.messages.length - 1;
                
                // Start streaming
                const response = await fetch(`${config.api.baseUrl}/api/chat/${this.currentChatId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        role: 'user',
                        content: messageText,
                        model: this.selectedModel || 'deepseek-r1:1.5b'
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || '发送消息失败');
                }

                // Clear the input after successful send
                this.message = '';

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { value, done } = await reader.read();
                    
                    if (done) break;

                    // Decode the chunk and split by newlines
                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;
                    
                    // Process complete lines
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer
                    
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        
                        try {
                            const data = JSON.parse(line);
                            
                            if (data.error) {
                                console.error('Error from server:', data.error);
                                this.messages[lastMessageIndex].content += `\nError: ${data.error}`;
                                break;
                            }

                            if (data.done) {
                                this.isThinking = false;
                                break;
                            }
                            
                            if (data.response) {
                                // Update the last message's content
                                this.messages[lastMessageIndex].content += data.response;
                                // Force Vue to recognize the change
                                this.messages = [...this.messages];
                            }
                        } catch (e) {
                            console.error('Error parsing response:', e);
                        }
                    }
                }

                // Process any remaining buffer
                if (buffer.trim()) {
                    try {
                        const data = JSON.parse(buffer);
                        if (data.response) {
                            this.messages[lastMessageIndex].content += data.response;
                            this.messages = [...this.messages];
                        }
                    } catch (e) {
                        console.error('Error parsing final buffer:', e);
                    }
                }

                this.isThinking = false;

                // Scroll to bottom after content is loaded
                this.$nextTick(() => {
                    const chatContainer = this.$refs.chatContainer;
                    if (chatContainer) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                });

            } catch (error) {
                console.error('Error in sendMessage:', error);
                // Remove the last (empty) assistant message
                this.messages = this.messages.slice(0, -1);
                // Add error message to chat
                this.messages = [...this.messages, {
                    role: 'system',
                    content: typeof error === 'string' ? error : error.message || '发送消息失败'
                }];
                this.error = typeof error === 'string' ? error : error.message || '发送消息失败';
                setTimeout(() => {
                    this.error = null;
                }, 5000);
            }
        },

        async renameChat(chatId, newTitle) {
            try {
                const response = await fetch(`${config.api.baseUrl}/api/chats/${chatId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: newTitle.trim()
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const chatIndex = this.chats.findIndex(c => c.id === chatId);
                if (chatIndex !== -1 && data && data.chat) {
                    this.chats[chatIndex] = data.chat;
                }
            } catch (error) {
                const { message, timeout } = handleApiError(error, 'renaming chat');
                this.error = message;
                setTimeout(() => {
                    this.error = null;
                }, timeout);
            }
        },

        async deleteChat(chatId) {
            try {
                const response = await fetch(`${config.api.baseUrl}/api/chats/${chatId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                this.chats = this.chats.filter(chat => chat.id !== chatId);
                if (this.currentChatId === chatId) {
                    this.currentChatId = this.chats.length > 0 ? this.chats[0].id : null;
                        this.messages = [];
                }
            } catch (error) {
                const { message, timeout } = handleApiError(error, 'deleting chat');
                this.error = message;
                setTimeout(() => {
                    this.error = null;
                }, timeout);
            }
        },

        toggleDarkMode() {
            this.darkMode = !this.darkMode;
            localStorage.setItem(config.storage.keys.darkMode, this.darkMode);
        },

        checkScroll() {
            const container = this.$refs.chatContainer;
            if (container) {
                const scrollTop = container.scrollTop;
                const scrollHeight = container.scrollHeight;
                const clientHeight = container.clientHeight;
                
                this.showScrollButtons = scrollHeight > clientHeight + 100;
            }
        },

        scrollToBottom() {
            const chatContainer = this.$refs.chatContainer;
            if (chatContainer) {
                chatContainer.scrollTo({
                    top: chatContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }
        },

        scrollToTop() {
            const chatContainer = this.$refs.chatContainer;
            if (chatContainer) {
                chatContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        },

        async copyMessage(content) {
            try {
                await navigator.clipboard.writeText(content);
                
                // Find the message and show success notification
                const messageIndex = this.messages.findIndex(m => m.content === content);
                if (messageIndex !== -1) {
                    this.messages[messageIndex].showCopySuccess = true;
                    
                    // Hide notification after 2 seconds
                    setTimeout(() => {
                        this.messages[messageIndex].showCopySuccess = false;
                        // Force Alpine to recognize the change
                        this.messages = [...this.messages];
                    }, 2000);
                    
                    // Force Alpine to recognize the change
                    this.messages = [...this.messages];
                }
            } catch (error) {
                console.error('Failed to copy message:', error);
                this.error = '复制失败，请重试';
                setTimeout(() => {
                    this.error = null;
                }, 2000);
            }
        }
    };
} 