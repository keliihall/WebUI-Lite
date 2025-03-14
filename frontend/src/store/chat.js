import { fetchChats, createChat, sendMessage, deleteChat, renameChat } from '../utils/api.js';
import { handleApiError, handleNetworkError } from '../utils/error.js';
import { createSidebarResizer } from '../utils/sidebar.js';
import { renderMarkdown } from '../utils/markdown.js';
import config from '../config/index.js';
import { logout } from '../utils/auth';

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
        roles: [],
        selectedRole: null,

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

            // 先加载角色
            await this.loadRoles();
            // 再加载其他数据
            await this.loadInitialData();
            
            // 监听selectedRole的变化
            this.$watch('selectedRole', value => {
                if (value) {
                    safeSetLocalStorage(config.storage.keys.selectedRoleId, value.id);
                } else {
                    safeSetLocalStorage(config.storage.keys.selectedRoleId, '');
                }
            });
            
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
                // 先获取后端配置的已启用模型列表
                const settingsResponse = await fetch(`${config.api.baseUrl}/api/settings`);
                const settingsData = await settingsResponse.json();
                
                // 获取所有可用模型
                const response = await fetch(`${config.api.baseUrl}/api/models`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                // 只使用已启用的模型
                this.models = (data.models || []).filter(model => 
                    settingsData.models.available.includes(model)
                );
                
                // 如果当前选择的模型不在已启用列表中，选择第一个已启用的模型
                if (this.models.length > 0) {
                    if (!this.models.includes(this.selectedModel)) {
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
                    const chat = await this.createNewChat();
                    if (!chat) {
                        throw new Error('创建新对话失败');
                    }
                }

                // 提前清空消息文本框
                this.message = '';

                const currentChat = this.chats.find(chat => chat.id === this.currentChatId);
                const isDefaultTitle = currentChat && currentChat.title === config.chat.defaultTitle;
                const isFirstMessage = this.messages.length === 0;

                this.messages = [...this.messages, { 
                    role: 'user',
                    content: messageText,
                    created_at: new Date().toISOString(),
                    showCopySuccess: false
                }];
                
                if (isFirstMessage && isDefaultTitle) {
                    const newTitle = messageText.slice(0, 20) + (messageText.length > 20 ? '...' : '');
                    await this.renameChat(this.currentChatId, newTitle);
                }
                
                this.isThinking = true;

                this.messages = [...this.messages, { 
                    role: 'assistant', 
                    content: '',
                    created_at: new Date().toISOString(),
                    showCopySuccess: false
                }];
                
                const lastMessageIndex = this.messages.length - 1;
                
                const requestBody = {
                role: 'user',
                    content: messageText,
                    model: this.selectedModel || (currentChat ? currentChat.model : 'deepseek-r1:1.5b')
                };

                if (this.selectedRole) {
                    requestBody.system_prompt = this.selectedRole.system_prompt;
                }

                const response = await fetch(`${config.api.baseUrl}/api/chat/${this.currentChatId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || `发送消息失败 (${response.status})`);
                }

            this.message = '';

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { value, done } = await reader.read();
                    
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;
                    
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        
                        try {
                            const data = JSON.parse(line);
                            
                            if (data.error) {
                                console.error('Error from server:', data.error);
                                this.messages[lastMessageIndex].content = `Error: ${data.error}`;
                                this.isThinking = false;
                                break;
                            }

                            if (data.done) {
                                this.isThinking = false;
                                break;
                            }
                            
                            if (data.response) {
                                this.messages[lastMessageIndex].content += data.response;
                                this.messages = [...this.messages];
                            }
                        } catch (e) {
                            console.error('Error parsing response:', e);
                            this.messages[lastMessageIndex].content = `Error: Failed to parse server response`;
                            this.isThinking = false;
                        }
                    }
                }

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

                this.$nextTick(() => {
                    const chatContainer = this.$refs.chatContainer;
                    if (chatContainer) {
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                });

            } catch (error) {
                console.error('Error in sendMessage:', error);
                this.messages = this.messages.slice(0, -1);
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
                
                const messageIndex = this.messages.findIndex(m => m.content === content);
                if (messageIndex !== -1) {
                    this.messages[messageIndex].showCopySuccess = true;
                    
                    setTimeout(() => {
                        this.messages[messageIndex].showCopySuccess = false;
                        this.messages = [...this.messages];
                    }, 2000);
                    
                    this.messages = [...this.messages];
                }
            } catch (error) {
                console.error('Failed to copy message:', error);
                this.error = '复制失败，请重试';
                setTimeout(() => {
                    this.error = null;
                }, 2000);
            }
        },

        async loadRoles() {
            try {
                const response = await fetch(`${config.api.baseUrl}/api/roles`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                this.roles = Array.isArray(data) ? data : [];
                this.roles = this.roles.map(role => ({
                    id: role.id || crypto.randomUUID(),
                    name: role.name || '',
                    description: role.description || '',
                    system_prompt: role.system_prompt || '',
                    category: role.category || '其他',
                    is_built_in: role.is_built_in || false,
                    created_at: role.created_at || new Date().toISOString()
                }));

                // 不自动恢复选中的角色
                this.selectedRole = null;
                safeSetLocalStorage(config.storage.keys.selectedRoleId, '');
            } catch (error) {
                console.error('Error loading roles:', error);
                this.error = '加载角色列表失败';
                setTimeout(() => {
                    this.error = null;
                }, 3000);
                this.roles = [];
                this.selectedRole = null;
            }
        },

        toggleRole(role) {
            if (!role) {
                this.selectedRole = null;
                safeSetLocalStorage(config.storage.keys.selectedRoleId, '');
                return;
            }
            
            if (this.selectedRole?.id === role.id) {
                this.selectedRole = null;
                safeSetLocalStorage(config.storage.keys.selectedRoleId, '');
            } else {
                this.selectedRole = role;
                safeSetLocalStorage(config.storage.keys.selectedRoleId, role.id);
            }
        },

        logout() {
            logout();
        }
    };
} 