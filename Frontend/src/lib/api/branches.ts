import apiClient from './client';
import { Branch } from '@/types';

export const branchApi = {
    getAll: async (): Promise<Branch[]> => {
        const response = await apiClient.get<Branch[]>('/branches');
        return response.data;
    },

    create: async (data: { name: string }): Promise<Branch> => {
        const response = await apiClient.post<Branch>('/branches', data);
        return response.data;
    },

    update: async (id: string, data: { name: string }): Promise<Branch> => {
        const response = await apiClient.put<Branch>(`/branches/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/branches/${id}`);
    },
};
