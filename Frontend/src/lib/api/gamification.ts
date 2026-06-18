import apiClient from './client';
import { User } from '@/types';

export const gamificationApi = {
    getLeaderboard: async (scope: 'GROUP' | 'GLOBAL' = 'GROUP'): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/gamification/leaderboard', {
            params: { scope }
        });
        return response.data;
    },
};
