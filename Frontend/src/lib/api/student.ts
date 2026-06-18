import apiClient from './client';
import { StudentAssignment, Submission } from '@/types';

export interface SubmitAssignmentData {
    assignmentId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answers: any;
    cheatWarnings?: number;
}

export const studentApi = {
    getMyAssignments: async (): Promise<StudentAssignment[]> => {
        const response = await apiClient.get<StudentAssignment[]>('/student/assignments');
        return response.data;
    },

    getAssignment: async (id: string): Promise<StudentAssignment> => {
        const response = await apiClient.get<StudentAssignment>(`/student/assignments/${id}`);
        return response.data;
    },

    submitAssignment: async (data: SubmitAssignmentData): Promise<Submission> => {
        const response = await apiClient.post<Submission>('/student/submissions', data);
        return response.data;
    },

    getSubmissions: async (assignmentId?: string): Promise<Submission[]> => {
        const params = assignmentId ? { assignmentId } : {};
        const response = await apiClient.get<Submission[]>('/student/submissions', { params });
        return response.data;
    },

    giveFeedback: async (studentAssignmentId: string, feedback: string): Promise<StudentAssignment> => {
        const response = await apiClient.post<StudentAssignment>(`/student/assignments/${studentAssignmentId}/feedback`, { feedback });
        return response.data;
    },
};
