import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    View, Text, TextInput, ScrollView, TouchableOpacity,
    StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TripSummaryCard from '../components/TripSummaryCard';
import TripMonitorRow from '../components/TripMonitorRow';
import TripSecurityFeed from '../components/TripSecurityFeed';
import { Colors } from '../constants/colors';
import {
    getTripDashboard,
    getTripMonitorItems,
    getStoredAccountId,
    getAccountHierarchy
} from '../services/tripMasterService';
import AccountDropdown from '../components/AccountDropdown';

export default function TripDashboardScreen({ navigation }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [accountId, setAccountId] = useState(0);
    const isDark = false;

    const [accountOptions, setAccountOptions] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);

    useEffect(() => {
        getAccountHierarchy().then(async (res) => {
            if (res?.data && Array.isArray(res.data)) {
                const opts = res.data.map((a) => ({
                    label: a.value || a.name,
                    value: a.id,
                }));
                setAccountOptions(opts);

                if (opts.length > 0) {
                    try {
                        const storedId = await AsyncStorage.getItem('selectedAccountId');
                        const match = opts.find(o => o.value === Number(storedId));
                        setSelectedAccount(match?.value || opts[0].value);
                    } catch {
                        setSelectedAccount(opts[0].value);
                    }
                }
            }
        });
    }, []);

    // Load accountId from storage on mount
    useEffect(() => {
        getStoredAccountId().then(setAccountId);
    }, []);

    const fetchDashboard = useCallback(async (isRefresh = false) => {
        if (!selectedAccount) {
            setLoading(false);
            return;
        }
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const [dashRes, monitorRes] = await Promise.all([
                getTripDashboard(selectedAccount),
                getTripMonitorItems(selectedAccount),
            ]);

            if (dashRes?.success || dashRes?.statusCode === 200) {
                const dashData = dashRes.data || {};
                const monitorItems = Array.isArray(dashData?.tripMonitor) && dashData.tripMonitor.length > 0
                    ? dashData.tripMonitor
                    : Array.isArray(monitorRes?.data) ? monitorRes.data : [];

                setData({ ...dashData, tripMonitor: monitorItems });
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedAccount]);

    useEffect(() => {
        if (selectedAccount) fetchDashboard();
    }, [selectedAccount, fetchDashboard]);

    // Auto-refresh every 30s
    useEffect(() => {
        if (!selectedAccount) return;
        const interval = setInterval(() => fetchDashboard(), 30000);
        return () => clearInterval(interval);
    }, [selectedAccount, fetchDashboard]);

    const tripMonitor = data?.tripMonitor ?? [];
    const summaryCards = data?.summaryCards ?? [];
    const securityFeed = data?.securityFeed ?? [];

    const tripStatuses = useMemo(() => {
        const statuses = tripMonitor.map((t) => {
            const derived =
                t.progressPercent === 100 ? 'Completed' :
                    t.progressPercent === 0 ? 'Pending' : 'Running';
            return t.status || derived;
        });
        return ['ALL', ...Array.from(new Set(statuses))];
    }, [tripMonitor]);

    const filteredTrips = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return tripMonitor.filter((trip) => {
            const matchesSearch =
                !q ||
                trip.tripCode?.toLowerCase().includes(q) ||
                trip.vehicleCode?.toLowerCase().includes(q) ||
                trip.driverName?.toLowerCase().includes(q) ||
                trip.from?.toLowerCase().includes(q) ||
                trip.to?.toLowerCase().includes(q);
            const derivedStatus =
                trip.progressPercent === 100 ? 'Completed' :
                    trip.progressPercent === 0 ? 'Pending' : 'Running';
            const tripDisplayStatus = trip.status || derivedStatus;
            const matchesStatus = statusFilter === 'ALL' || tripDisplayStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tripMonitor, searchQuery, statusFilter]);

    if (loading && !data) {
        return (
            <SafeAreaView style={[styles.safe, styles.centerContent]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchDashboard(true)} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <View>
                        <Text style={styles.title}>📊 Trip Dashboard</Text>
                        <Text style={styles.subtitle}>Real-time monitoring of active trips & alerts</Text>
                    </View>
                    {refreshing && (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    )}
                </View>

                {/* Account Dropdown Section */}
                <View style={styles.accountSection}>
                    <AccountDropdown
                        items={accountOptions}
                        value={selectedAccount}
                        onChangeValue={async (val) => {
                            setSelectedAccount(val);
                            try {
                                await AsyncStorage.setItem('selectedAccountId', String(val));
                            } catch (error) {
                                console.error('Failed to save account:', error);
                            }
                        }}
                        loading={loading && !data}
                    />
                </View>

                {!accountId ? (
                    <View style={styles.emptyStateCard}>
                        <Text style={styles.emptyIcon}>⚠️</Text>
                        <Text style={styles.emptyTitle}>No account selected</Text>
                        <Text style={styles.emptySubtitle}>Please log in again to load your account</Text>
                    </View>
                ) : (
                    <>
                        {/* Summary Cards Section */}
                        {summaryCards.length > 0 && (
                            <View style={styles.cardsSection}>
                                <Text style={styles.sectionTitle}>📈 Key Metrics</Text>
                                <View style={styles.cardsGrid}>
                                    {summaryCards.map((card) => (
                                        <TripSummaryCard
                                            key={card.key}
                                            card={card}
                                            isDark={isDark}
                                            accentColor={Colors.primary}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Trip Monitor Section */}
                        <View style={styles.monitorSection}>
                            <View style={styles.monitorCard}>
                                {/* Monitor Header */}
                                <View style={styles.monitorHeaderTop}>
                                    <View>
                                        <View style={styles.monitorTitleRow}>
                                            <Text style={styles.monitorTitle}>🚛 Trip Monitor</Text>
                                            <View style={styles.liveRow}>
                                                <View style={styles.liveDot} />
                                                <Text style={styles.liveText}>Live</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.monitorSubtitle}>
                                            <Text style={styles.highlightText}>{filteredTrips.length}</Text>
                                            {' '} / {tripMonitor.length} trips
                                        </Text>
                                    </View>
                                </View>

                                {/* Search Input */}
                                <View style={styles.searchContainer}>
                                    <Text style={styles.searchIcon}>🔍</Text>
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Search by trip, vehicle, driver..."
                                        placeholderTextColor="#9CA3AF"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />
                                </View>

                                {/* Filter Chips */}
                                {tripStatuses.length > 1 && (
                                    <View style={styles.filterContainer}>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            style={styles.filterScroll}
                                        >
                                            {tripStatuses.map((status) => (
                                                <TouchableOpacity
                                                    key={status}
                                                    onPress={() => setStatusFilter(status)}
                                                    style={[
                                                        styles.filterChip,
                                                        statusFilter === status && [
                                                            styles.filterChipActive,
                                                            { backgroundColor: Colors.primary },
                                                        ],
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.filterChipText,
                                                            statusFilter === status && styles.filterChipTextActive,
                                                        ]}
                                                    >
                                                        {status}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}

                                {/* Trip Rows */}
                                <View style={styles.tripListContainer}>
                                    {filteredTrips.length > 0 ? (
                                        filteredTrips.map((trip) => (
                                            <TripMonitorRow
                                                key={trip.tripCode}
                                                trip={trip}
                                                isDark={isDark}
                                                accentColor={Colors.primary}
                                                progressLabel="Progress"
                                                accountId={accountId}
                                                onRefresh={() => fetchDashboard(true)}
                                            />
                                        ))
                                    ) : (
                                        <View style={styles.emptyList}>
                                            <Text style={styles.emptyIcon}>🔍</Text>
                                            <Text style={styles.emptyTitle}>No trips found</Text>
                                            <Text style={styles.emptySubtitle}>
                                                Try adjusting your search or filter
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Security Feed */}
                        {securityFeed.length > 0 && (
                            <View style={styles.feedSection}>
                                <TripSecurityFeed
                                    items={securityFeed}
                                    isDark={isDark}
                                    title="🔒 Security Feed"
                                />
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F9FAFB' },
    centerContent: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#6B7280', fontSize: 13, fontWeight: '500' },
    scroll: { paddingBottom: 32 },

    /* Header */
    headerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
    },
    title: { fontSize: 28, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, fontWeight: '500' },

    /* Account Section */
    accountSection: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },

    /* Cards Section */
    cardsSection: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
    },

    /* Monitor Section */
    monitorSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    monitorCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    monitorHeaderTop: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    monitorTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    monitorTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
    monitorSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 6,
        fontWeight: '500',
    },
    highlightText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
    liveText: { fontSize: 11, color: '#6B7280', fontWeight: '700' },

    /* Search */
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F9FAFB',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchIcon: {
        fontSize: 14,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: '#111827',
        fontWeight: '500',
    },

    /* Filters */
    filterContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    filterScroll: {
        flex: 1,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 22,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterChipActive: {
        borderColor: Colors.primary,
        borderWidth: 1.5,
    },
    filterChipText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
    filterChipTextActive: { color: '#fff' },

    /* Trip List */
    tripListContainer: {
        paddingVertical: 8,
    },
    emptyList: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyIcon: { fontSize: 32, marginBottom: 8 },
    emptyTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
    emptySubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

    /* Empty State Card */
    emptyStateCard: {
        marginHorizontal: 16,
        marginTop: 20,
        paddingVertical: 40,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    /* Feed Section */
    feedSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
});