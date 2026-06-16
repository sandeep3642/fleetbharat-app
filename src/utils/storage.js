import AsyncStorage from '@react-native-async-storage/async-storage';

export const getStoredUserRole = async () => {
    try {
        const userStr = await AsyncStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        return String(user?.roleName || user?.roleCode || user?.role || '').trim().toLowerCase();
    } catch {
        return '';
    }
};

export const getStoredAccountId = async (fallbackAccountId) => {
    const resolved = Number(fallbackAccountId || 0);
    if (Number.isFinite(resolved) && resolved > 0) return resolved;
    try {
        const userStr = await AsyncStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        const userAccountId = Number(user?.accountId || user?.AccountId || 0);
        if (Number.isFinite(userAccountId) && userAccountId > 0) return userAccountId;
    } catch {
        // ignore
    }
    return 0;
};