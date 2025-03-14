import config from '../config';
import { handleApiError } from '../utils/error';

export function createSettingsStore() {
    return {
        currentSection: 'basic',
        ollamaConfig: {
            ip: 'localhost',
            port: '11434',
            isLoading: false,
            status: 'unknown',
            errorMessage: ''
        },
        models: [],
        editingModel: null,
        isLoading: false,
        successMessage: '',
        errorMessage: '',
        darkMode: localStorage.getItem('darkMode') === 'true' || (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches),
        sidebarOpen: true,
        sidebarWidth: parseInt(localStorage.getItem('sidebarWidth')) || 225,
        isDragging: false,
        startX: 0,
        startWidth: 0,

        sections: [
            { id: 'basic', name: '基础设置', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
            { id: 'chat', name: '角色管理', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
            { id: 'model', name: '模型设置', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
            { id: 'system', name: '系统设置', icon: 'M5.8 11.3L2 22l10.7-3.79M4 3h16a1 1 0 011 1v11a1 1 0 01-1 1h-2M4 3a1 1 0 00-1 1v11a1 1 0 001 1h2M4 3l8 6 8-6' },
            { id: 'about', name: '关于项目', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
        ],

        // Role management state
        roles: [],
        roleCategories: ['常用', '开发', '教育', '其他'],
        selectedRole: null,
        isRoleModalOpen: false,
        roleFormData: {
            name: '',
            description: '',
            system_prompt: '',
            category: '其他'
        },
        isEditingRole: false,

        async init() {
            this.$watch('darkMode', value => {
                localStorage.setItem('darkMode', value);
                if (value) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            });

            if (this.darkMode) {
                document.documentElement.classList.add('dark');
            }

            try {
                // Load Ollama settings
                const ollamaResponse = await fetch(`${config.api.baseUrl}/api/settings/ollama`);
                if (ollamaResponse.ok) {
                    const ollamaData = await ollamaResponse.json();
                    // Parse host URL into IP and port
                    try {
                        const url = new URL(ollamaData.host);
                        this.ollamaConfig.ip = url.hostname;
                        this.ollamaConfig.port = url.port || '11434';
                    } catch (e) {
                        // If URL parsing fails, use defaults
                        this.ollamaConfig.ip = 'localhost';
                        this.ollamaConfig.port = '11434';
                    }
                }
            } catch (error) {
                console.error('Error loading Ollama settings:', error);
            }

            await this.loadModels();
            await this.loadRoles();
        },

        async loadModels() {
            this.isLoading = true;
            try {
                // 获取后端配置的模型列表
                const settingsResponse = await fetch(`${config.api.baseUrl}/api/settings`);
                const settingsData = await settingsResponse.json();
                
                // 获取所有可用模型
                const response = await fetch(`${config.api.baseUrl}/api/models`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                // 使用后端配置来设置模型启用状态
                this.models = (data.models || []).map(modelName => ({
                    name: modelName,
                    enabled: settingsData.models.available.includes(modelName)
                }));

                // 如果是首次加载且没有启用的模型，则启用第一个
                const hasEnabledModels = this.models.some(model => model.enabled);
                if (!hasEnabledModels && this.models.length > 0) {
                    this.models[0].enabled = true;
                    // 立即保存这个初始状态到后端
                    await this.saveModelSettings();
                }

            } catch (error) {
                const { message } = handleApiError(error, 'loading models');
                this.errorMessage = message;
                setTimeout(() => this.errorMessage = '', 3000);
            } finally {
                this.isLoading = false;
            }
        },

        async checkOllamaStatus() {
            this.ollamaConfig.isLoading = true;
            try {
                const url = `http://${this.ollamaConfig.ip}:${this.ollamaConfig.port}/api/version`;
                const response = await fetch(url);
                if (response.ok) {
                    this.ollamaConfig.status = 'running';
                    this.successMessage = 'Ollama 服务连接成功';
                } else {
                    this.ollamaConfig.status = 'error';
                    this.errorMessage = '无法连接到 Ollama 服务';
                }
            } catch (error) {
                this.ollamaConfig.status = 'error';
                this.errorMessage = '连接 Ollama 服务失败';
            } finally {
                this.ollamaConfig.isLoading = false;
                setTimeout(() => {
                    this.successMessage = '';
                    this.errorMessage = '';
                }, 3000);
            }
        },

        async saveOllamaConfig() {
            try {
                // First, get the current configuration
                const currentConfigResponse = await fetch(`${config.api.baseUrl}/api/settings`);
                if (!currentConfigResponse.ok) {
                    throw new Error('Failed to fetch current configuration');
                }
                const currentConfig = await currentConfigResponse.json();

                // Update only the Ollama host in the current configuration
                const host = `http://${this.ollamaConfig.ip}:${this.ollamaConfig.port}`;
                currentConfig.ollama.host = host;

                // Save the complete configuration
                const response = await fetch(`${config.api.baseUrl}/api/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentConfig)
                });
                
                if (response.ok) {
                    this.successMessage = 'Ollama 设置已保存';
                } else {
                    this.errorMessage = '保存 Ollama 设置失败';
                }
            } catch (error) {
                console.error('Error saving Ollama config:', error);
                this.errorMessage = '保存设置时发生错误';
            }
            
            setTimeout(() => {
                this.successMessage = '';
                this.errorMessage = '';
            }, 3000);
        },

        async saveModelSettings() {
            try {
                // First, get the current configuration
                const currentConfigResponse = await fetch(`${config.api.baseUrl}/api/settings`);
                if (!currentConfigResponse.ok) {
                    throw new Error('Failed to fetch current configuration');
                }
                const currentConfig = await currentConfigResponse.json();

                // Update only the models configuration
                const enabledModels = this.models
                    .filter(model => model.enabled)
                    .map(model => model.name);

                // Ensure at least one model is enabled
                if (enabledModels.length === 0 && this.models.length > 0) {
                    enabledModels.push(this.models[0].name);
                }

                currentConfig.models.default = enabledModels[0] || currentConfig.models.default;
                currentConfig.models.available = enabledModels;

                // Save the complete configuration
                const response = await fetch(`${config.api.baseUrl}/api/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentConfig)
                });

                if (!response.ok) {
                    throw new Error('保存到服务器失败');
                }

                this.successMessage = '模型设置已保存';
                setTimeout(() => this.successMessage = '', 3000);
            } catch (error) {
                this.errorMessage = '保存模型设置失败';
                console.error('Error saving model settings:', error);
                setTimeout(() => this.errorMessage = '', 3000);
            }
        },

        toggleDarkMode() {
            this.darkMode = !this.darkMode;
        },

        startDrag(e) {
            this.isDragging = true;
            this.startX = e.pageX;
            this.startWidth = this.sidebarWidth;
            document.body.classList.add('user-select-none');
        },

        doDrag(e) {
            if (!this.isDragging) return;
            const delta = e.pageX - this.startX;
            const newWidth = Math.max(225, Math.min(480, this.startWidth + delta));
            this.sidebarWidth = newWidth;
            localStorage.setItem('sidebarWidth', newWidth);
        },

        stopDrag() {
            this.isDragging = false;
            document.body.classList.remove('user-select-none');
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
            } catch (error) {
                console.error('Error loading roles:', error);
                this.errorMessage = '加载角色列表失败';
                setTimeout(() => this.errorMessage = '', 3000);
                this.roles = [];
            }
        },

        openCreateRoleModal() {
            this.isEditingRole = false;
            this.roleFormData = {
                name: '',
                description: '',
                system_prompt: '',
                category: '其他'
            };
            this.isRoleModalOpen = true;
        },

        openEditRoleModal(role) {
            this.isEditingRole = true;
            this.roleFormData = {
                name: role.name,
                description: role.description,
                system_prompt: role.system_prompt,
                category: role.category || '其他'
            };
            this.selectedRole = role;
            this.isRoleModalOpen = true;
        },

        async saveRole() {
            try {
                const url = this.isEditingRole 
                    ? `${config.api.baseUrl}/api/roles/${this.selectedRole.id}`
                    : `${config.api.baseUrl}/api/roles`;
                
                const method = this.isEditingRole ? 'PUT' : 'POST';
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.roleFormData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                await this.loadRoles();
                this.isRoleModalOpen = false;
                this.successMessage = `${this.isEditingRole ? '更新' : '创建'}角色成功`;
            } catch (error) {
                console.error('Error saving role:', error);
                this.errorMessage = `${this.isEditingRole ? '更新' : '创建'}角色失败`;
            }
            setTimeout(() => {
                this.successMessage = '';
                this.errorMessage = '';
            }, 3000);
        },

        async deleteRole(roleId) {
            if (!confirm('确定要删除这个角色吗？此操作不可恢复。')) {
                return;
            }

            try {
                const response = await fetch(`${config.api.baseUrl}/api/roles/${roleId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                await this.loadRoles();
                this.successMessage = '删除角色成功';
            } catch (error) {
                console.error('Error deleting role:', error);
                this.errorMessage = '删除角色失败';
            }
            setTimeout(() => {
                this.successMessage = '';
                this.errorMessage = '';
            }, 3000);
        }
    };
} 