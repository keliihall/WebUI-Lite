import config from '../config';

/**
 * 检查认证状态
 * @returns {boolean} 是否已认证
 */
export function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login.html') {
            window.location.href = `/login.html?returnTo=${encodeURIComponent(currentPath)}`;
        }
        return false;
    }
    return true;
}

/**
 * 注销
 */
export function logout() {
    localStorage.removeItem('auth_token');
    window.location.href = '/login.html';
}

/**
 * 获取认证 token
 * @returns {string|null} token
 */
export function getToken() {
    return localStorage.getItem('auth_token');
} 