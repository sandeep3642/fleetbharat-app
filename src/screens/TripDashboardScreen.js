import React, { useState, useMemo } from 'react';
import {
    View, Text, TextInput, ScrollView, TouchableOpacity,
    StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import TripSummaryCard from '../components/TripSummaryCard';
import TripMonitorRow from '../components/TripMonitorRow';
import TripSecurityFeed from '../components/TripSecurityFeed';
import { Colors } from '../constants/colors';

// Mock data — replace with API calls later
const summaryCards = [
    { key: 'totalTrips', label: 'Total Trips', count: 24, trendText: '+12%', trendDirection: 'positive', status: 'This week' },
    { key: 'activeTrips', label: 'Active Trips', count: 8, trendText: '+3', trendDirection: 'positive', status: 'Live now' },
    { key: 'inTransit', label: 'In Transit', count: 5, trendText: '-1', trendDirection: 'negative', status: 'On road' },
    { key: 'completed', label: 'Completed', count: 11, trendText: '0', trendDirection: 'neutral', status: 'Today' },
];

const tripMonitor = [
    {
        tripCode: 'TRP-1001', vehicleCode: 'TRK-001', driverName: 'Rajesh Kumar',
        from: 'Delhi', to: 'Mumbai',
        originLat: 28.7041, originLng: 77.1025,        // Delhi
        destinationLat: 19.0760, destinationLng: 72.8777, // Mumbai
        currentLat: 23.0, currentLng: 75.5,             // current truck position
        progressPercent: 65, progressColor: 'blue',
        statusLabel: 'In Transit', status: 'Running', isELock: true, lockState: 'Locked', lockReceivedAt: '10:32 AM',
    },
    {
        tripCode: 'TRP-1002', vehicleCode: 'TRK-002', driverName: 'Suresh Singh',
        from: 'Bangalore', to: 'Chennai',
        originLat: 12.9716, originLng: 77.5946,        // Bangalore
        destinationLat: 13.0827, destinationLng: 80.2707, // Chennai
        progressPercent: 100, progressColor: 'green',
        statusLabel: 'Delivered', status: 'Completed', isELock: false, lockState: '',
    },
    {
        tripCode: 'TRP-1003', vehicleCode: 'TRK-003', driverName: 'Amit Sharma',
        from: 'Kolkata', to: 'Hyderabad',
        originLat: 22.5726, originLng: 88.3639,        // Kolkata
        destinationLat: 17.3850, destinationLng: 78.4867, // Hyderabad
        progressPercent: 0, progressColor: 'neutral',
        statusLabel: 'Not started', status: 'Pending', isELock: false, lockState: '',
    },
];

const securityFeed = [
    { severity: 'CRITICAL', title: 'Unauthorized stop detected', location: 'NH-48, Gujarat', timestamp: '2 min ago' },
    { severity: 'MEDIUM', title: 'Speed limit exceeded', location: 'Outer Ring Road, Bangalore', timestamp: '15 min ago' },
];

export default function TripDashboardScreen({ navigation }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const isDark = false; // Wire up to your ThemeContext if you have one

    const tripStatuses = useMemo(() => {
        const statuses = tripMonitor.map((t) => t.status);
        return ['ALL', ...Array.from(new Set(statuses))];
    }, []);

    const filteredTrips = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return tripMonitor.filter((trip) => {
            const matchesSearch =
                !q ||
                trip.tripCode.toLowerCase().includes(q) ||
                trip.vehicleCode.toLowerCase().includes(q) ||
                trip.driverName.toLowerCase().includes(q) ||
                trip.from.toLowerCase().includes(q) ||
                trip.to.toLowerCase().includes(q);
            const matchesStatus = statusFilter === 'ALL' || trip.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, statusFilter]);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Header */}
                <Text style={styles.title}>Trip Dashboard</Text>
                <Text style={styles.subtitle}>Real-time monitoring of active trips & alerts</Text>

                {/* Summary cards */}
                <View style={styles.cardsGrid}>
                    {summaryCards.map((card) => (
                        <TripSummaryCard key={card.key} card={card} isDark={isDark} accentColor={Colors.primary} />
                    ))}
                </View>

                {/* Trip Monitor */}
                <View style={[styles.monitorCard, isDark && styles.monitorCardDark]}>
                    <View style={styles.monitorHeader}>
                        <View style={styles.monitorTitleRow}>
                            <Text style={[styles.monitorTitle, isDark && styles.textWhite]}>Trip Monitor</Text>
                            <View style={styles.liveRow}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>Live</Text>
                            </View>
                        </View>
                        <Text style={[styles.monitorSubtitle, isDark && styles.textGray]}>
                            {filteredTrips.length} / {tripMonitor.length} trips
                        </Text>

                        {/* Search */}
                        <TextInput
                            style={[styles.searchInput, isDark && styles.searchInputDark]}
                            placeholder="Search by trip, vehicle, driver or route..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        {/* Status filter chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                            {tripStatuses.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => setStatusFilter(status)}
                                    style={[
                                        styles.filterChip,
                                        statusFilter === status && { backgroundColor: Colors.primary },
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

                    {/* Trip rows */}
                    {filteredTrips.map((trip) => (
                        <TripMonitorRow
                            key={trip.tripCode}
                            trip={trip}
                            isDark={isDark}
                            accentColor={Colors.primary}
                            progressLabel="Progress"
                        />
                    ))}

                    {filteredTrips.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🔍</Text>
                            <Text style={[styles.emptyTitle, isDark && styles.textWhite]}>No trips found</Text>
                            <Text style={[styles.emptySubtitle, isDark && styles.textGray]}>
                                Try adjusting your search or filter
                            </Text>
                        </View>
                    )}
                </View>

                {/* Security feed */}
                <TripSecurityFeed items={securityFeed} isDark={isDark} title="Security Feed" />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F9FAFB' },
    scroll: { padding: 16, paddingBottom: 32 },
    title: { fontSize: 24, fontWeight: '800', color: '#111827' },
    subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16 },
    cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    monitorCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
        marginBottom: 16,
    },
    monitorCardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
    monitorHeader: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    monitorTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    monitorTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
    monitorSubtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 2, marginBottom: 10 },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
    liveText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
    searchInput: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        marginBottom: 10,
    },
    searchInputDark: { backgroundColor: '#111827', color: '#fff' },
    filterRow: { flexDirection: 'row' },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
    },
    filterChipText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
    filterChipTextActive: { color: '#fff' },
    emptyState: { padding: 30, alignItems: 'center' },
    emptyIcon: { fontSize: 28, marginBottom: 8 },
    emptyTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
    emptySubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
    textWhite: { color: '#fff' },
    textGray: { color: '#9CA3AF' },
});