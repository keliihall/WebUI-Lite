import { createChatStore } from './store/chat.js';
import DarkModeToggle from './components/shared/DarkModeToggle.js';
import LoadingIndicator from './components/shared/LoadingIndicator.js';
import ChatMessage from './components/Chat/ChatMessage.js';
import ChatInput from './components/Chat/ChatInput.js';
import ModelSelector from './components/Sidebar/ModelSelector.js';

// Register components
window.Components = {
    DarkModeToggle,
    LoadingIndicator,
    ChatMessage,
    ChatInput,
    ModelSelector
};

// Initialize Alpine.js data
export const initializeAlpine = () => ({
    ...createChatStore(),
    sidebarOpen: true,
    darkMode: localStorage.getItem('darkMode') === 'true' || (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches),
    sidebarWidth: 256,
    isDragging: false,
    modelSelectorOpen: false,
    selectedModel: localStorage.getItem('selectedModel') || 'DeepSeek-rl：1.5b',
    models: ['DeepSeek-rl：1.5b', 'Claude 3', 'GPT-4', 'Gemini Pro'],
    showScrollButtons: false,
    error: null,
    config: {
        apiUrl: 'http://localhost:8080'
    },

    async handleApiError(error, context) {
        console.error(`Error in ${context}:`, error);
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            this.error = '无法连接到服务器，请确保后端服务已启动';
        } else {
            this.error = `操作失败: ${error.message}`;
        }
        // 5秒后清除错误信息
        setTimeout(() => {
            this.error = null;
        }, 5000);
    },

    init() {
        this.$watch('darkMode', value => {
            if (value) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        });
        
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
        }

        this.loadInitialData();
    },

    async loadInitialData() {
        try {
            await this.loadModels();
            await this.loadChats();
            
            if (this.chats.length === 0) {
                await this.createNewChat();
            } else {
                this.currentChatId = this.chats[0].id;
                await this.loadChatMessages(this.currentChatId);
            }
        } catch (error) {
            await this.handleApiError(error, 'initialization');
        }
    }
}); 