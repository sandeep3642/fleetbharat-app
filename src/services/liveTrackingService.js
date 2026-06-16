import { vtsApi } from './apiService';

export const getLiveTrackingData = async (key) => {
    if (!key) throw new Error('Redis key is required');
    const res = await vtsApi.get('/api/redis/get', { params: { key } });
    return res.data;
};