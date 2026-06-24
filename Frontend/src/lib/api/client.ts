import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const isProd = import.meta.env.PROD;
const API_URL = import.meta.env.VITE_API_URL || (isProd ? '/api' : 'http://localhost:3001/api');

// Helper to get cookie value
function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Enable cookies for cross-origin requests
});

// Request interceptor to add CSRF token
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Add CSRF token from cookie to header
        const csrfToken = getCookie('csrf_token');
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
    (response) => {
        // Normalize user role if present in response
        if (response.data && response.data.user && response.data.user.role) {
            response.data.user.role = response.data.user.role.toLowerCase();
        }
        // Also handle direct user response (e.g. /me endpoint) or login response wrapper
        if (response.data && response.data.role) {
            response.data.role = response.data.role.toLowerCase();
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('eduTask_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
