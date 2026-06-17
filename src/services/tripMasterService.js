import { flattenAccountHierarchyOptions } from '../utils/accountUtils';
import { tmsApi } from './apiService';
import api from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const buildErrorResponse = (error, fallbackMessage = 'Network or server error') =>
    error.response?.data || {
        success: false,
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || fallbackMessage,
        data: null,
    };

// Add near the top of the file
const JAVA_API_BASE_URL = 'http://fleetbharat.com:8083/api/v1/';

const pad = (n) => String(n).padStart(2, '0');

export function parseTripDateTimeForAPI(dtStr) {
    if (!dtStr || !dtStr.trim()) return '';
    const s = dtStr.trim();

    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const base = s.replace(/\.\d+Z?$/, '').replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
        return base.length === 16 ? `${base}:00` : base;
    }

    const parts = s.split(' ');
    const datePart = parts[0];
    const timePart = parts[1] ?? '00:00';
    const [dd, mm, yyyy] = (datePart ?? '').split('/');
    if (!dd || !mm || !yyyy) return '';
    const time = timePart.length === 5 ? `${timePart}:00` : timePart;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T${time}`;
}

export function nowForAPI() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const getHistoryTracking = async (vehicleNo, start, end) => {
    try {
        const res = await fetch(`${JAVA_API_BASE_URL}history/history-tracking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vehicleNo, start, end }),
        });
        if (!res.ok) return { success: false, data: [] };
        const data = await res.json();
        const points = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
                ? data.data
                : [];
        return { success: true, data: points };
    } catch (error) {
        return { success: false, data: [] };
    }
};

// ── Get stored accountId from AsyncStorage (set this after login) ──
export const getStoredAccountId = async () => {
    try {
        const userStr = await AsyncStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        return Number(user?.accountId || 0);
    } catch {
        return 0;
    }
};

export const getTripDashboard = async (accountId) => {
    try {
        const params = {};
        const resolvedId = accountId ? Number(accountId) : 0;
        if (resolvedId > 0) params.accountId = resolvedId;
        const res = await tmsApi.get('/api/dashboard/trip', { params });
        return res?.data || {};
    } catch (error) {
        return buildErrorResponse(error, 'Failed to fetch trip dashboard');
    }
};

/**
 * Fetch live/active trip monitor items.
 * Primary: /api/dashboard/trip-monitor?accountId=N
 * Fallback: /api/trip-plans/all/{accountId} mapped to TripMonitorItem shape
 */
export const getTripMonitorItems = async (accountId) => {
    const resolvedId = accountId ? Number(accountId) : 0;
    if (resolvedId <= 0) return { success: false, data: [] };

    // 1. Try dedicated monitor endpoint first
    try {
        const res = await tmsApi.get('/api/dashboard/trip-monitor', {
            params: { accountId: resolvedId },
        });
        const payload = res?.data || {};
        const items = Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload)
                ? payload
                : [];
        if (items.length > 0) return { success: true, data: items };
    } catch {
        // fall through to fallback
    }

    // 2. Fallback: fetch all trip plans and map to TripMonitorItem
    try {
        const res = await tmsApi.get(`/api/trip-plans/all/${resolvedId}`, {
            params: { page: 1, pageSize: 100 },
        });
        const payload = res?.data || {};
        const rawItems = Array.isArray(payload?.data?.items) ? payload.data.items : [];

        const mapped = rawItems.map((item) => {
            const isActive = Boolean(item?.isActive ?? true);
            const progressPercent = isActive ? 0 : 100;
            const rawTripCode =
                item?.tripCode || item?.tripNo || item?.trip_code || item?.code || null;
            const tripCode = rawTripCode
                ? String(rawTripCode)
                : item?.planId
                    ? `trip-${item.planId}`
                    : '';
            return {
                tripCode,
                vehicleCode: String(item?.vehicleNo || item?.vehicleCode || ''),
                vehicleId: item?.vehicleId || null,
                driverName: String(item?.driverName || '—'),
                from: String(item?.startGeoName || item?.from || ''),
                to: String(item?.endGeoName || item?.to || ''),
                lockStatus: 'UNLOCKED',
                lockState: 'Unlocked',
                isELock: false,
                progressPercent,
                progressColor: progressPercent === 100 ? 'green' : 'neutral',
                statusLabel: progressPercent === 100 ? 'Completed' : 'Pending',
                status: progressPercent === 100 ? 'Completed' : 'Pending',
                atd: String(item?.plannedStartTime || item?.startTime || ''),
                ata: '',
            };
        });

        return { success: true, data: mapped };
    } catch (error) {
        return buildErrorResponse(error, 'Failed to fetch trip monitor items');
    }
};

export const getTripMonitorDetail = async (accountId, tripNo) => {
    try {
        const res = await tmsApi.get('/api/dashboard/trip-monitor-detail', {
            params: { accountId: Number(accountId), tripNo },
        });
        const payload = res?.data || {};
        if (payload?.data && !payload.data.tripId) {
            const code = String(payload.data.tripCode || '');
            const numeric = Number(code.replace(/\D/g, ''));
            if (numeric > 0) payload.data.tripId = numeric;
        }
        return payload;
    } catch (error) {
        return buildErrorResponse(error, 'Failed to fetch trip monitor detail');
    }
};

export const sendLockUnlockCommand = async (deviceNo, command) => {
    try {
        const res = await api.get('/api/v1/commands/lock-unlock', {
            params: { deviceNo, command },
        });
        return res?.data || {};
    } catch (error) {
        return buildErrorResponse(error, `Failed to ${command} device`);
    }
};

export const postManualTripStatus = async (payload) => {
    try {
        const res = await tmsApi.post('/api/trip/manual-status', payload);
        return res?.data || {};
    } catch (error) {
        return buildErrorResponse(error, 'Failed to update trip status');
    }
};

export const getTripAdditionalDetails = async (tripId) => {
    try {
        const resolvedTripId = Number(tripId || 0);
        if (resolvedTripId <= 0) {
            return { success: false, statusCode: 400, message: 'Invalid trip id', data: null };
        }
        const res = await tmsApi.get(`/api/common/trips/${resolvedTripId}/additional-details`);
        const payload = res?.data || {};
        return {
            success: payload?.success ?? true,
            statusCode: Number(payload?.statusCode || 200),
            message: payload?.message || 'Additional details fetched successfully',
            data: {
                tripId: Number(payload?.data?.tripId || resolvedTripId),
                additionalDetails:
                    payload?.data?.additionalDetails && typeof payload.data.additionalDetails === 'object'
                        ? payload.data.additionalDetails
                        : {},
            },
        };
    } catch (error) {
        return buildErrorResponse(error, 'Failed to fetch trip additional details');
    }
};

export const getAccountHierarchy = async () => {
    try {
        const res = await api.get('/api/accounts/hierarchy');
        const raw = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.data)
                ? res.data.data
                : [];

        // Use the flattened version for dropdown options
        const flattened = flattenAccountHierarchyOptions(raw);

        return {
            success: true,
            statusCode: 200,
            data: flattened,  // Already formatted with id & value
            rawHierarchy: raw,
        };
    } catch (error) {
        console.error('API Error in getAccountHierarchy:', error);
        return buildErrorResponse(error, 'Failed to fetch accounts');
    }
};