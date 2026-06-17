import api from './apiService';

export const loginUser = async (identifier, password) => {
    const payload = {
        email: String(identifier || '').trim(),
        password,
    };
    try {
        const res = await api.post('/api/auth/login', payload);
        return res.data;
    } catch (error) {
        return (
            error.response?.data || {
                success: false,
                statusCode: error.response?.status || 500,
                message: error.response?.data?.message || 'Login failed. Please try again.',
                data: null,
            }
        );
    }
};