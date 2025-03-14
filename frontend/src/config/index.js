export default {
    api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    },
    models: {
        default: 'deepseek-coder:1.3b',
        available: []  // 默认为空，从后端获取
    },
    ui: {
        defaultSidebarWidth: 256,
        maxMessageLength: 4000,
        maxTitleLength: 50,
        defaultDarkMode: true
    },
    chat: {
        maxExampleQuestions: 5,
        defaultTitle: '新对话',
        messageTypes: {
            user: 'user',
            assistant: 'assistant',
            system: 'system'
        }
    },
    storage: {
        keys: {
            darkMode: 'darkMode',
            selectedModel: 'selectedModel',
            sidebarWidth: 'sidebarWidth',
            selectedRoleId: 'selectedRoleId'
        }
    }
}; 