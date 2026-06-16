import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://fleetbharat.com:8080';
const TMS_BASE_URL = 'http://fleetbharat.com:8081';

const createApiInstance = (baseURL) => {
    const instance = axios.create({
        baseURL,
        headers: { 'Content-Type': 'application/json' },
    });

    instance.interceptors.request.use(async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const statusCode = error?.response?.status;
            if (statusCode === 401 || statusCode === 403) {
                await clearAuthState();
            }
            return Promise.reject(error);
        }
    );

    return instance;
};

const api = createApiInstance(BASE_URL);
export const tmsApi = createApiInstance(TMS_BASE_URL);
export const vtsApi = createApiInstance('http://fleetbharat.com:8080');

export const clearAuthState = async () => {
    await AsyncStorage.multiRemove(['authToken', 'user', 'permissions']);
};

export default api;