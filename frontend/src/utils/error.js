/**
 * 统一的错误处理工具
 */

/**
 * 处理API错误
 * @param {Error} error - 错误对象
 * @param {string} context - 错误发生的上下文
 * @returns {{message: string, timeout: number}} 错误信息和显示时间
 */
export function handleApiError(error, context) {
    console.error(`Error in ${context}:`, error);
    
    let message;
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        message = '无法连接到服务器，请确保后端服务已启动';
    } else if (error.status === 401) {
        message = '会话已过期，请重新登录';
        // 可以在这里添加重定向到登录页面的逻辑
    } else if (error.status === 403) {
        message = '没有权限执行此操作';
    } else if (error.status === 404) {
        message = '请求的资源不存在';
    } else if (error.status >= 500) {
        message = '服务器错误，请稍后重试';
    } else {
        message = `操作失败: ${error.message}`;
    }

    return {
        message,
        timeout: 5000
    };
}

/**
 * 处理验证错误
 * @param {Object} errors - 验证错误对象
 * @returns {string} 格式化的错误消息
 */
export function handleValidationError(errors) {
    return Object.entries(errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join('\n');
}

/**
 * 处理网络错误
 * @param {Error} error - 错误对象
 * @returns {string} 错误消息
 */
export function handleNetworkError(error) {
    if (!navigator.onLine) {
        return '网络连接已断开，请检查网络设置';
    }
    return '网络请求失败，请稍后重试';
} 