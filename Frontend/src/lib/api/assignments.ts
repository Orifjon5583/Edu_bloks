import apiClient from './client';
import { Assignment, AssignmentType, AssignmentStatus } from '@/types';

export interface CreateAssignmentData {
    title: string;
    description?: string;
    type: AssignmentType;
    content: any;
    dueAt: Date | string;
    groupIds?: string[];
    studentIds?: string[];
    status?: AssignmentStatus;
}

export interface UpdateAssignmentData {
    title?: string;
    description?: string;
    type?: AssignmentType;
    content?: any;
    dueAt?: Date | string;
}

export const assignmentApi = {
    getAll: async (status?: AssignmentStatus): Promise<Assignment[]> => {
        const params = status ? { status } : {};
        const response = await apiClient.get<Assignment[]>('/assignments', { params });
        return response.data;
    },

    getById: async (id: string): Promise<Assignment> => {
        const response = await apiClient.get<Assignment>(`/assignments/${id}`);
        return response.data;
    },

    create: async (data: CreateAssignmentData): Promise<Assignment> => {
        const response = await apiClient.post<Assignment>('/assignments', data);
        return response.data;
    },

    update: async (id: string, data: UpdateAssignmentData): Promise<Assignment> => {
        const response = await apiClient.put<Assignment>(`/assignments/${id}`, data);
        return response.data;
    },

    publish: async (id: string, groupIds: string[] = [], studentIds: string[] = []): Promise<Assignment> => {
        const response = await apiClient.post<Assignment>(`/assignments/${id}/publish`, { groupIds, studentIds });
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/assignments/${id}`);
    },

    duplicate: async (id: string): Promise<Assignment> => {
        const response = await apiClient.post<Assignment>(`/assignments/${id}/duplicate`);
        return response.data;
    },

    getResults: async (id: string): Promise<any[]> => {
        const response = await apiClient.get<any[]>(`/assignments/${id}/results`);
        return response.data;
    },

    getLibrary: async (params?: { type?: string; search?: string; page?: number; limit?: number }): Promise<any> => {
        const response = await apiClient.get<any>('/assignments/library', { params });
        return response.data;
    },
};
