import apiClient from './client';
import { Group } from '@/types';

export const groupApi = {
    getAll: async (): Promise<Group[]> => {
        const response = await apiClient.get<Group[]>('/groups');
        return response.data;
    },

    getTeacherGroups: async (): Promise<Group[]> => {
        const response = await apiClient.get<Group[]>('/groups');
        return response.data;
    },

    create: async (data: { name: string; teacherId?: string; branchId?: string }): Promise<Group> => {
        const response = await apiClient.post<Group>('/groups', data);
        return response.data;
    },

    update: async (id: string, data: Partial<{ name: string; teacherId: string; branchId: string }>): Promise<Group> => {
        const response = await apiClient.put<Group>(`/groups/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/groups/${id}`);
    },
};
