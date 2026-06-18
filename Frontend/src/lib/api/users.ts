import apiClient from './client';
import { User, UserRole } from '@/types';

export interface CreateUserData {
    login: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    groupId?: string;
    branchId?: string;
}

export interface UpdateUserData {
    login?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    groupId?: string | null;
    branchId?: string | null;
}

export const userApi = {
    getAll: async (role?: UserRole): Promise<User[]> => {
        const params = role ? { role } : {};
        const response = await apiClient.get<User[]>('/users', { params });
        return response.data;
    },

    create: async (data: CreateUserData): Promise<User & { plainPassword?: string }> => {
        const response = await apiClient.post<User & { plainPassword?: string }>('/users', data);
        return response.data;
    },

    update: async (id: string, data: UpdateUserData): Promise<User> => {
        const response = await apiClient.put<User>(`/users/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    },

    resetPassword: async (id: string, password: string): Promise<{ message: string; plainPassword: string }> => {
        const response = await apiClient.post(`/users/${id}/reset-password`, { password });
        return response.data;
    },
};
