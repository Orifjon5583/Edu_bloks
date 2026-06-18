import apiClient from './client';

export const uploadApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // The backend returns { url: '/uploads/filename.ext' }
    // We should return the full URL if we need it, but relative is fine if we use the backend URL
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${backendUrl}${response.data.url}`;
  },
};
