import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://fleetbharat.com:8080';

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request automatically
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-logout on 401/403
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const statusCode = error?.response?.status;
        if (statusCode === 401 || statusCode === 403) {
            await clearAuthState();
        }
        return Promise.reject(error);
    }
);

export const clearAuthState = async () => {
    await AsyncStorage.multiRemove(['authToken', 'user', 'permissions']);
};

export default api;