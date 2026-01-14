import axios from 'axios';
import { baseURL } from '../config/AxiosHelper';

// Create axios instance
const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API calls
export const authAPI = {
    register: async (name, email, password) => {
        const response = await api.post('/api/auth/register', { name, email, password });
        return response.data;
    },

    login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/api/auth/me');
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/api/auth/logout');
        return response.data;
    },
};

// Users API calls
export const usersAPI = {
    getAllUsers: async () => {
        const response = await api.get('/api/users');
        return response.data;
    },

    getUserById: async (userId) => {
        const response = await api.get(`/api/users/${userId}`);
        return response.data;
    },

    searchUsers: async (query) => {
        const response = await api.get('/api/users/search', { params: { q: query } });
        return response.data;
    },

    uploadAvatar: async (formData) => {
        const response = await api.post('/api/users/upload-avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// Private chat API calls
export const privateChatAPI = {
    getMessages: async (userId, page = 0, size = 50) => {
        const response = await api.get(`/api/private/${userId}/messages`, {
            params: { page, size },
        });
        return response.data;
    },

    markAsRead: async (senderId) => {
        const response = await api.post(`/api/private/${senderId}/read`);
        return response.data;
    },

    getConversations: async () => {
        const response = await api.get('/api/private/conversations');
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await api.get('/api/private/unread-count');
        return response.data;
    },

    sendFile: async (formData) => {
        const response = await api.post('/api/private/send-file', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// Files API calls
export const filesAPI = {
    upload: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/api/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// Profile API calls
export const profileAPI = {
    updateProfile: async (data) => {
        const response = await api.put('/api/users/profile', data);
        return response.data;
    },
};

export default api;
