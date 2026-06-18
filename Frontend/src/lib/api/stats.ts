import apiClient from './client';
import { DashboardStats } from '@/types';

export const statsApi = {
    getSuperAdminStats: async (): Promise<DashboardStats> => {
        const response = await apiClient.get<DashboardStats>('/stats');
        return response.data;
    },

    getAdminStats: async (): Promise<DashboardStats> => {
        const response = await apiClient.get<DashboardStats>('/admin/stats');
        return response.data;
    },

    getStudentProgress: async (): Promise<any[]> => {
        const response = await apiClient.get<any[]>('/student/progress');
        return response.data;
    },

    getTeacherAnalytics: async (): Promise<any[]> => {
        const response = await apiClient.get<any[]>('/teacher/analytics');
        return response.data;
    },
};
