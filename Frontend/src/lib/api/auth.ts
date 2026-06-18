import apiClient from './client';
import { User } from '@/types';

export interface LoginResponse {
    token: string;
    user: User;
}

export const authApi = {
    login: async (login: string, password: string): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/auth/login', {
            login,
            password,
        });
        return response.data;
    },

    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
        localStorage.removeItem('token');
        localStorage.removeItem('eduTask_user');
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await apiClient.get<User>('/auth/me');
        return response.data;
    },

    generateCredentials: async (role: 'ADMIN' | 'STUDENT'): Promise<{ login: string; password: string }> => {
        const response = await apiClient.post<{ login: string; password: string }>('/auth/generate-credentials', { role });
        return response.data;
    },

    generatePassword: async (): Promise<{ password: string }> => {
        const response = await apiClient.post<{ password: string }>('/auth/generate-password');
        return response.data;
    },
};
