// services/api.ts - Helper authFetch pour toutes les requêtes API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
/**
 * Helper authFetch - Ajoute automatiquement le token JWT
 */
export const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };
    // Si FormData, retirer Content-Type (navigateur le gère)
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }
    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });
    // Si 401 Unauthorized, rediriger vers login
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expirée');
    }
    return response;
};
/**
 * Helper pour requêtes GET avec gestion d'erreur
 */
export const apiGet = async (url) => {
    try {
        const response = await authFetch(url);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                error: errorData.detail || errorData.message || `Erreur ${response.status}`,
            };
        }
        const data = await response.json();
        return { data };
    }
    catch (error) {
        return { error: error.message || 'Erreur de connexion' };
    }
};
/**
 * Helper pour requêtes POST avec gestion d'erreur
 */
export const apiPost = async (url, body) => {
    try {
        const response = await authFetch(url, {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                error: errorData.detail || errorData.message || `Erreur ${response.status}`,
            };
        }
        const data = await response.json();
        return { data };
    }
    catch (error) {
        return { error: error.message || 'Erreur de connexion' };
    }
};
/**
 * Helper pour requêtes PUT avec gestion d'erreur
 */
export const apiPut = async (url, body) => {
    try {
        const response = await authFetch(url, {
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                error: errorData.detail || errorData.message || `Erreur ${response.status}`,
            };
        }
        const data = await response.json();
        return { data };
    }
    catch (error) {
        return { error: error.message || 'Erreur de connexion' };
    }
};
/**
 * Helper pour requêtes PATCH avec gestion d'erreur
 */
export const apiPatch = async (url, body) => {
    try {
        const response = await authFetch(url, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                error: errorData.detail || errorData.message || `Erreur ${response.status}`,
            };
        }
        const data = await response.json();
        return { data };
    }
    catch (error) {
        return { error: error.message || 'Erreur de connexion' };
    }
};
/**
 * Helper pour requêtes DELETE avec gestion d'erreur
 */
export const apiDelete = async (url) => {
    try {
        const response = await authFetch(url, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                error: errorData.detail || errorData.message || `Erreur ${response.status}`,
            };
        }
        // DELETE peut ne pas retourner de body
        if (response.status === 204) {
            return { data: {} };
        }
        const data = await response.json();
        return { data };
    }
    catch (error) {
        return { error: error.message || 'Erreur de connexion' };
    }
};
/**
 * Helper pour refresh token JWT
 */
export const refreshToken = async () => {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken)
            return false;
        const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });
        if (!response.ok)
            return false;
        const data = await response.json();
        localStorage.setItem('token', data.access);
        return true;
    }
    catch {
        return false;
    }
};
/**
 * Helper pour vérifier si token est expiré
 */
export const isTokenExpired = () => {
    const token = localStorage.getItem('token');
    if (!token)
        return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    }
    catch {
        return true;
    }
};
/**
 * Helper pour upload fichier avec progress
 */
export const apiUpload = async (url, formData, onProgress) => {
    return new Promise((resolve) => {
        const token = localStorage.getItem('token');
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const progress = Math.round((e.loaded / e.total) * 100);
                onProgress(progress);
            }
        });
        xhr.addEventListener('load', async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    resolve({ data });
                }
                catch {
                    resolve({ data: {} });
                }
            }
            else {
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    resolve({
                        error: errorData.detail || errorData.message || `Erreur ${xhr.status}`,
                    });
                }
                catch {
                    resolve({ error: `Erreur ${xhr.status}` });
                }
            }
        });
        xhr.addEventListener('error', () => {
            resolve({ error: 'Erreur de connexion' });
        });
        xhr.addEventListener('abort', () => {
            resolve({ error: 'Upload annulé' });
        });
        xhr.open('POST', `${API_BASE_URL}${url}`);
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
    });
};
/**
 * Export des constantes
 */
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login/',
        REGISTER: '/auth/register/',
        LOGOUT: '/auth/logout/',
        REFRESH: '/auth/token/refresh/',
    },
    ADMIN: {
        DASHBOARD: '/admin/dashboard/',
        USERS: '/admin/users/',
        ANALYTICS: '/admin/analytics/',
    },
    VALIDATION: {
        QUEUE: '/admin/validation/',
        DOCUMENTS: '/admin/documents/',
    },
    LEGISLATION: {
        LIST: '/admin/legislation/',
        UPLOAD: '/admin/legislation/upload/',
    },
    USER: {
        DASHBOARD: '/user/dashboard/',
        SCORE: '/user/score/',
        PROFILE: '/user/profile/',
    },
};
