import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

// Define the baseURL. In dev, Vite proxies /api. In prod, env variable.
export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401, request hasn't been retried yet, and isn't the login request itself
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/login')
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = useAuthStore.getState().refreshToken;
                if (!refreshToken) throw new Error('No refresh token available');

                // Attempt to refresh token
                const res = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
                    refreshToken
                });

                const { accessToken } = res.data;

                // Update store with new token
                useAuthStore.getState().login(useAuthStore.getState().user!, accessToken, refreshToken);

                // Update header for original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                // Retry the original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, log out and redirect to login
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
