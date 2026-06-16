import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function TripMonitorRow({ trip, isDark, accentColor, progressLabel }) {
    const [expanded, setExpanded] = useState(false);

    const pct = Math.min(100, Math.max(0, trip.progressPercent));

    const barColor =
        trip.progressColor === 'purple' ? '#8B5CF6' :
            trip.progressColor === 'red' ? '#EF4444' :
                trip.progressColor === 'green' ? '#10B981' :
                    accentColor;

    const derivedStatus =
        pct === 100 ? 'Completed' : pct === 0 ? 'Pending' : 'Running';
    const displayStatus = trip.status || derivedStatus;

    const statusColors = {
        Completed: '#10B981',
        Running: '#3B82F6',
        Pending: '#F59E0B',
        Delayed: '#EF4444',
    };

    // ── Map helpers ──────────────────────────────────────────────
    const hasOrigin = trip.originLat != null && trip.originLng != null;
    const hasDest = trip.destinationLat != null && trip.destinationLng != null;
    const hasCurrent = trip.currentLat != null && trip.currentLng != null;
    const hasMapData = hasOrigin || hasDest || hasCurrent;

    // Center map on whatever data is available
    const mapCenter = hasCurrent
        ? { latitude: trip.currentLat, longitude: trip.currentLng }
        : hasOrigin
            ? { latitude: trip.originLat, longitude: trip.originLng }
            : hasDest
                ? { latitude: trip.destinationLat, longitude: trip.destinationLng }
                : { latitude: 20.5937, longitude: 78.9629 }; // India default

    const routeLine = [
        ...(hasOrigin ? [{ latitude: trip.originLat, longitude: trip.originLng }] : []),
        ...(hasCurrent ? [{ latitude: trip.currentLat, longitude: trip.currentLng }] : []),
        ...(hasDest ? [{ latitude: trip.destinationLat, longitude: trip.destinationLng }] : []),
    ];

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.row}>
                <View style={styles.topRow}>
                    <Text style={[styles.tripCode, { color: accentColor }]}>{trip.tripCode}</Text>
                    <View style={[styles.badge, { backgroundColor: (statusColors[displayStatus] || '#9CA3AF') + '20' }]}>
                        <Text style={[styles.badgeText, { color: statusColors[displayStatus] || '#9CA3AF' }]}>
                            {displayStatus}
                        </Text>
                    </View>
                </View>

                <View style={styles.routeRow}>
                    <Text style={[styles.routeText, isDark && styles.textWhite]}>📍 {trip.from}</Text>
                    <Text style={styles.arrow}>→</Text>
                    <Text style={[styles.routeText, isDark && styles.textWhite]}>📍 {trip.to}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={[styles.infoText, isDark && styles.textGray]}>🚛 {trip.vehicleCode}</Text>
                    <Text style={[styles.infoText, isDark && styles.textGray]}>👤 {trip.driverName}</Text>
                </View>

                <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, isDark && styles.textGray]}>{progressLabel}</Text>
                    <Text style={[styles.progressValue, { color: barColor }]}>{trip.statusLabel}</Text>
                </View>
                <View style={[styles.progressTrack, isDark && styles.progressTrackDark]}>
                    <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                </View>

                <Text style={[styles.expandHint, isDark && styles.textGray]}>
                    {expanded ? '▲ Hide details' : '▼ Show details'}
                </Text>
            </TouchableOpacity>

            {expanded && (
                <View style={[styles.detailBox, isDark && styles.detailBoxDark]}>

                    {/* ── Map ── */}
                    <View style={styles.mapContainer}>
                        {hasMapData ? (
                            <MapView
                                style={styles.map}
                                initialRegion={{
                                    latitude: mapCenter.latitude,
                                    longitude: mapCenter.longitude,
                                    latitudeDelta: 5,
                                    longitudeDelta: 5,
                                }}
                            >
                                {hasOrigin && (
                                    <Marker
                                        coordinate={{ latitude: trip.originLat, longitude: trip.originLng }}
                                        title={`Origin: ${trip.from}`}
                                        pinColor="green"
                                    />
                                )}

                                {hasDest && (
                                    <Marker
                                        coordinate={{ latitude: trip.destinationLat, longitude: trip.destinationLng }}
                                        title={`Destination: ${trip.to}`}
                                        pinColor="red"
                                    />
                                )}

                                {hasCurrent && (
                                    <Marker
                                        coordinate={{ latitude: trip.currentLat, longitude: trip.currentLng }}
                                        title={`Vehicle: ${trip.vehicleCode}`}
                                    >
                                        <Text style={{ fontSize: 24 }}>🚛</Text>
                                    </Marker>
                                )}

                                {routeLine.length >= 2 && (
                                    <Polyline
                                        coordinates={routeLine}
                                        strokeColor={accentColor}
                                        strokeWidth={3}
                                    />
                                )}
                            </MapView>
                        ) : (
                            <View style={styles.mapPlaceholder}>
                                <Text style={styles.mapPlaceholderText}>📍 No location data available</Text>
                            </View>
                        )}
                    </View>

                    {/* ── Route details ── */}
                    <Text style={[styles.detailTitle, isDark && styles.textWhite]}>Route Details</Text>
                    <DetailRow label="From" value={trip.from} isDark={isDark} />
                    <DetailRow label="To" value={trip.to} isDark={isDark} />
                    <DetailRow label="Vehicle" value={trip.vehicleCode} isDark={isDark} />
                    <DetailRow label="Driver" value={trip.driverName} isDark={isDark} />
                    {trip.tripType && <DetailRow label="Trip Type" value={trip.tripType} isDark={isDark} />}
                    {trip.isELock && (
                        <DetailRow
                            label="Lock"
                            value={`${trip.lockState}${trip.lockReceivedAt ? ' · ' + trip.lockReceivedAt : ''}`}
                            isDark={isDark}
                        />
                    )}
                </View>
            )}
        </View>
    );
}

function DetailRow({ label, value, isDark }) {
    return (
        <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, isDark && styles.textGray]}>{label}</Text>
            <Text style={[styles.detailValue, isDark && styles.textWhite]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    containerDark: { borderBottomColor: '#1F2937' },
    row: { paddingVertical: 14, paddingHorizontal: 16 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    tripCode: { fontWeight: '800', fontSize: 14 },
    badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    routeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
    arrow: { color: '#9CA3AF', fontSize: 12 },
    infoRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
    infoText: { fontSize: 12, color: '#6B7280' },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    progressLabel: { fontSize: 11, color: '#6B7280' },
    progressValue: { fontSize: 11, fontWeight: '700' },
    progressTrack: { height: 6, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden' },
    progressTrackDark: { backgroundColor: '#374151' },
    progressFill: { height: '100%', borderRadius: 4 },
    expandHint: { fontSize: 11, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
    detailBox: {
        backgroundColor: '#F9FAFB',
        margin: 12,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    detailBoxDark: { backgroundColor: '#111827', borderColor: '#374151' },
    detailTitle: { fontSize: 12, fontWeight: '800', color: '#111827', marginBottom: 8, textTransform: 'uppercase' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    detailLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
    detailValue: { fontSize: 12, color: '#374151', fontWeight: '700' },
    textWhite: { color: '#fff' },
    textGray: { color: '#9CA3AF' },

    // ── Map styles ──
    mapContainer: {
        height: 220,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    map: {
        flex: 1,
    },
    mapPlaceholder: {
        flex: 1,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    mapPlaceholderText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '600',
    },
});