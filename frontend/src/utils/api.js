import config from '../config';
import { handleApiError, handleNetworkError } from './error';
import { getToken } from './auth';

/**
 * 基础 API 请求函数
 * @param {string} endpoint - API 端点
 * @param {Object} options - 请求选项
 * @returns {Promise} 请求响应
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${config.api.baseUrl}/api${endpoint}`;
    const token = getToken();
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = `/login.html?returnTo=${encodeURIComponent(window.location.pathname)}`;
            return;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'API request failed');
        }

        return response;
    } catch (error) {
        if (!navigator.onLine) {
            throw new Error(handleNetworkError(error));
        }
        throw error;
    }
}

/**
 * 获取可用模型列表
 * @returns {Promise<Array>} 模型列表
 */
export async function fetchModels() {
    try {
        const response = await apiRequest('/models');
        const data = await response.json();
        return data.models;
    } catch (error) {
        console.error('Error fetching models:', error);
        return config.models.available;
    }
}

/**
 * 获取聊天列表
 * @returns {Promise<Array>} 聊天列表
 */
export async function fetchChats() {
    try {
        const response = await apiRequest('/chats');
        const data = await response.json();
        return data.chats;
    } catch (error) {
        throw handleApiError(error, 'fetching chats');
    }
}

/**
 * 创建新聊天
 * @param {Object} chat - 聊天信息
 * @returns {Promise<Object>} 创建的聊天
 */
export async function createChat(chat) {
    try {
        const response = await apiRequest('/chats', {
            method: 'POST',
            body: JSON.stringify(chat)
        });
        return await response.json();
    } catch (error) {
        throw handleApiError(error, 'creating chat');
    }
}

/**
 * 发送聊天消息
 * @param {string} chatId - 聊天 ID
 * @param {Object} message - 消息内容
 * @returns {Promise<Response>} 流式响应
 */
export async function sendMessage(chatId, message) {
    try {
        return await apiRequest(`/chat/${chatId}`, {
            method: 'POST',
            body: JSON.stringify(message)
        });
    } catch (error) {
        throw handleApiError(error, 'sending message');
    }
}

/**
 * 删除聊天
 * @param {string} chatId - 聊天 ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteChat(chatId) {
    try {
        const response = await apiRequest(`/chats/${chatId}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        throw handleApiError(error, 'deleting chat');
    }
}

/**
 * 重命名聊天
 * @param {string} chatId - 聊天 ID
 * @param {string} newTitle - 新标题
 * @returns {Promise<Object>} 更新后的聊天
 */
export async function renameChat(chatId, newTitle) {
    try {
        const response = await apiRequest(`/chats/${chatId}`, {
            method: 'PATCH',
            body: JSON.stringify({ title: newTitle })
        });
        return await response.json();
    } catch (error) {
        throw handleApiError(error, 'renaming chat');
    }
}

/**
 * 获取聊天消息历史
 * @param {string} chatId - 聊天 ID
 * @returns {Promise<Array>} 消息列表
 */
export async function fetchChatMessages(chatId) {
    try {
        const response = await apiRequest(`/chats/${chatId}/messages`);
        return await response.json();
    } catch (error) {
        throw handleApiError(error, 'fetching chat messages');
    }
}

/**
 * 获取示例问题
 * @returns {Promise<Array>} 示例问题列表
 */
export async function fetchExampleQuestions() {
    try {
        const response = await apiRequest('/example-questions');
        return await response.json();
    } catch (error) {
        console.error('Error fetching example questions:', error);
        return [];
    }
} 