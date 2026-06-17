import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
    Alert, Modal, ScrollView,
} from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
import MapView, { Marker, Polyline, Circle, Polygon } from 'react-native-maps';
import {
    getTripMonitorDetail,
    sendLockUnlockCommand,
    getHistoryTracking,
    parseTripDateTimeForAPI,
    nowForAPI,
} from '../services/tripMasterService';
import { getLiveTrackingData } from '../services/liveTrackingService';
import { decodePolylineToPath } from '../utils/polyline';
// import { buildTripRouteCentersPath } from '../utils/tripRouteMap';
import { buildTripRouteCentersPath, buildTripRouteOverlays } from '../utils/tripRouteMapNative';
import RouteTimeline from './RouteTimeline';
import ManualStatusModal from './ManualStatusModal';
import TripAdditionalDetailsModal from './TripAdditionalDetailsModal';

export default function TripMonitorRow({ trip, isDark, accentColor, progressLabel, accountId, onRefresh }) {
    const [expanded, setExpanded] = useState(false);
    const [detailTrip, setDetailTrip] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState('');
    const [historyPath, setHistoryPath] = useState([]);
    const [livePos, setLivePos] = useState(null);
    const [lockCmdLoading, setLockCmdLoading] = useState({});
    const [manualModal, setManualModal] = useState(null);
    const [additionalDetailsOpen, setAdditionalDetailsOpen] = useState(false);
    const [mapFullscreen, setMapFullscreen] = useState(false);

    const detailRefreshRef = useRef(null);
    const livePollRef = useRef(null);
    const requestedKeyRef = useRef('');
    const historyKeyRef = useRef('');

    const pct = Math.min(100, Math.max(0, trip.progressPercent));

    const barColor =
        trip.progressColor === 'purple' ? '#8B5CF6' :
            trip.progressColor === 'red' ? '#EF4444' :
                trip.progressColor === 'green' ? '#10B981' :
                    accentColor;

    const derivedStatus = pct === 100 ? 'Completed' : pct === 0 ? 'Pending' : 'Running';
    const displayStatus = trip.status || detailTrip?.status || derivedStatus;

    const statusColors = {
        Completed: '#10B981',
        Running: '#3B82F6',
        Pending: '#F59E0B',
        Delayed: '#EF4444',
    };

    // ── Fetch trip detail when expanded ──────────────────────────
    useEffect(() => {
        if (!expanded || !accountId) {
            if (!accountId && expanded) setDetailError('Account not selected');
            return;
        }
        const requestKey = `${accountId}:${trip.tripCode}`;
        if (requestedKeyRef.current === requestKey && detailTrip) return;
        requestedKeyRef.current = requestKey;

        let cancelled = false;
        (async () => {
            setDetailLoading(true);
            setDetailError('');
            try {
                const res = await getTripMonitorDetail(accountId, trip.tripCode);
                if (!cancelled && (res?.success || res?.statusCode === 200)) {
                    setDetailTrip(res?.data ?? null);
                } else if (!cancelled) {
                    setDetailError('Unable to load route detail');
                }
            } catch {
                if (!cancelled) setDetailError('Unable to load route detail');
            } finally {
                if (!cancelled) setDetailLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [expanded, accountId, trip.tripCode]);

    // ── Fetch actual driven route (history) ─────────────────────────
    useEffect(() => {
        if (!expanded) return;

        const resolvedVehicleNo = String(detailTrip?.vehicleCode ?? trip.vehicleCode ?? '');
        if (!resolvedVehicleNo) return;

        // Only fetch history once the trip has actually departed
        const sortedPoints = (detailTrip?.routePoints ?? [])
            .slice()
            .sort((a, b) => a.sequence - b.sequence);
        const firstActualEntry = sortedPoints[0]?.actualEntryTime?.trim() ?? '';
        if (!firstActualEntry) return; // Trip hasn't started yet — skip

        const rawStart =
            sortedPoints[0]?.actualEntryTime ||
            detailTrip?.startOutDatetime ||
            detailTrip?.atd ||
            trip.startOutDatetime ||
            trip.atd ||
            '';

        const startStr = rawStart
            ? parseTripDateTimeForAPI(rawStart)
            : (() => {
                const d = new Date();
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00`;
            })();
        if (!startStr) return;

        const rawEnd =
            detailTrip?.endOutDatetime ||
            detailTrip?.ata ||
            trip.endOutDatetime ||
            trip.ata ||
            '';
        const endStr = rawEnd ? parseTripDateTimeForAPI(rawEnd) : nowForAPI();

        // Dedup key — fetch history exactly once per expansion for running trips
        const histKey = `${resolvedVehicleNo}:${startStr}`;
        if (historyKeyRef.current === histKey) return;
        historyKeyRef.current = histKey;

        let cancelled = false;
        (async () => {
            const res = await getHistoryTracking(resolvedVehicleNo, startStr, endStr);
            if (cancelled || !res.success) return;
            const points = res.data;
            if (points.length > 0) {
                setHistoryPath(
                    points.map((p) => ({
                        latitude: p.latitude,
                        longitude: p.longitude,
                    }))
                );
            }
        })();

        return () => { cancelled = true; };
    }, [expanded, detailTrip, trip]);

    // ── Auto-refresh detail every 20s while expanded ─────────────
    useEffect(() => {
        if (!expanded || !accountId) {
            if (detailRefreshRef.current) clearInterval(detailRefreshRef.current);
            return;
        }
        detailRefreshRef.current = setInterval(async () => {
            try {
                const res = await getTripMonitorDetail(accountId, trip.tripCode);
                if (res?.success || res?.statusCode === 200) {
                    setDetailTrip(res?.data ?? null);
                }
            } catch { /* non-fatal */ }
        }, 20000);
        return () => { if (detailRefreshRef.current) clearInterval(detailRefreshRef.current); };
    }, [expanded, accountId, trip.tripCode]);

    // ── Live position polling every 5s ────────────────────────────
    useEffect(() => {
        if (!expanded) {
            if (livePollRef.current) clearInterval(livePollRef.current);
            return;
        }

        const vehicleId = detailTrip?.vehicleId ?? trip.vehicleId;
        const useVehicleId = vehicleId != null && Number(vehicleId) > 0;
        const redisKey = useVehicleId ? `dashboard::${vehicleId}` : `dashboard::${trip.tripCode}`;

        const pollOnce = async () => {
            try {
                const raw = await getLiveTrackingData(redisKey);
                const payload =
                    typeof raw?.value === 'string' ? JSON.parse(raw.value) :
                        (raw?.data && typeof raw.data === 'object' ? raw.data : raw);
                const lat = Number(payload?.latitude ?? payload?.lat);
                const lng = Number(payload?.longitude ?? payload?.lng ?? payload?.lon);
                const direction = Number(payload?.direction ?? payload?.heading ?? 0);
                if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
                    setLivePos({ latitude: lat, longitude: lng, direction });
                    return;
                }
            } catch { /* non-fatal */ }
            const dLat = detailTrip?.currentLatitude ?? null;
            const dLng = detailTrip?.currentLongitude ?? null;
            if (dLat != null && dLng != null && !(dLat === 0 && dLng === 0)) {
                setLivePos({ latitude: Number(dLat), longitude: Number(dLng) });
            }
        };

        pollOnce();
        livePollRef.current = setInterval(pollOnce, 5000);
        return () => { if (livePollRef.current) clearInterval(livePollRef.current); };
    }, [expanded, detailTrip?.vehicleId, detailTrip?.currentLatitude, detailTrip?.currentLongitude, trip.vehicleId, trip.tripCode]);

    // ── Reset state on collapse ──────────────────────────────────
    useEffect(() => {
        if (expanded) return;
        setDetailLoading(false);
        setDetailError('');
        requestedKeyRef.current = '';
        historyKeyRef.current = '';
        setHistoryPath([]);
    }, [expanded]);

    const executeLockUnlock = useCallback(async (deviceNo, cmd) => {
        if (!deviceNo) return;
        setLockCmdLoading((prev) => ({ ...prev, [deviceNo]: cmd }));
        try {
            const res = await sendLockUnlockCommand(deviceNo, cmd);
            const ok = res?.success !== false;
            const msg = res?.message || (ok ? `${cmd === 'lock' ? 'Lock' : 'Unlock'} command sent` : 'Command failed');
            if (ok) {
                Alert.alert('Success', msg);
                const detail = await getTripMonitorDetail(accountId, trip.tripCode);
                if (detail?.data) setDetailTrip(detail.data);
                onRefresh?.();
                setTimeout(async () => {
                    const d = await getTripMonitorDetail(accountId, trip.tripCode);
                    if (d?.data) setDetailTrip(d.data);
                    onRefresh?.();
                }, 5000);
            } else {
                Alert.alert('Error', msg);
            }
        } catch {
            Alert.alert('Error', 'Command failed');
        } finally {
            setLockCmdLoading((prev) => { const n = { ...prev }; delete n[deviceNo]; return n; });
        }
    }, [accountId, trip.tripCode, onRefresh]);

    const handleLockUnlock = (deviceNo, cmd) => {
        if (trip.isPasswordProtected) {
            Alert.alert(
                'OTP Required',
                'This trip requires OTP verification for lock/unlock. OTP flow not yet wired in this build.',
            );
            return;
        }
        executeLockUnlock(deviceNo, cmd);
    };

    const handleSync = useCallback(async () => {
        try {
            const res = await getTripMonitorDetail(accountId, trip.tripCode);
            if (res?.data) setDetailTrip(res.data);
        } catch { /* non-fatal */ }
    }, [accountId, trip.tripCode]);

    // ── Map data ──────────────────────────────────────────────────
    const routePath = (() => {
        try { return decodePolylineToPath(detailTrip?.encodedRoute ?? ''); }
        catch { return []; }
    })();
    const routePointsPath = buildTripRouteCentersPath(detailTrip?.routePoints);
    const hasDetailMapData = routePointsPath.length > 0 || routePath.length > 0;

    const hasOrigin = trip.originLat != null && trip.originLng != null;
    const hasDest = trip.destinationLat != null && trip.destinationLng != null;
    const hasCurrent = trip.currentLat != null && trip.currentLng != null;
    const hasMapData = hasOrigin || hasDest || hasCurrent || hasDetailMapData || historyPath.length > 0;

    const mapCenter = livePos
        || historyPath[0]
        || routePath[0]
        || (hasCurrent ? { latitude: trip.currentLat, longitude: trip.currentLng } : null)
        || (hasOrigin ? { latitude: trip.originLat, longitude: trip.originLng } : null)
        || { latitude: 20.5937, longitude: 78.9629 };

    const routeLine = [
        ...(hasOrigin ? [{ latitude: trip.originLat, longitude: trip.originLng }] : []),
        ...(hasCurrent ? [{ latitude: trip.currentLat, longitude: trip.currentLng }] : []),
        ...(hasDest ? [{ latitude: trip.destinationLat, longitude: trip.destinationLng }] : []),
    ];
    const renderRouteOverlays = (routePoints) => {
        if (!routePoints || routePoints.length === 0) return [];

        const overlays = buildTripRouteOverlays(routePoints);
        return overlays.map((overlay) => {
            if (overlay.geometry === 'circle') {
                return (
                    <Circle
                        key={overlay.key}
                        center={overlay.center}
                        radius={overlay.radiusM}
                        strokeColor="#2563eb"
                        strokeWidth={2}
                        fillColor="rgba(96, 165, 250, 0.18)"
                    />
                );
            } else if (overlay.geometry === 'polygon') {
                return (
                    <Polygon
                        key={overlay.key}
                        coordinates={overlay.paths}
                        strokeColor="#2563eb"
                        strokeWidth={2}
                        fillColor="rgba(96, 165, 250, 0.18)"
                    />
                );
            }
            return null;
        });
    };
    const renderMap = (height) => (
        <View style={[styles.mapContainer, { height }]}>
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
                    {/* Planned/detail route */}
                    {routePath.length > 1 && (
                        <Polyline coordinates={routePath} strokeColor="#4F46E5" strokeWidth={4} />
                    )}
                    {routePath.length <= 1 && routePointsPath.length > 1 && (
                        <Polyline coordinates={routePointsPath} strokeColor="#F97316" strokeWidth={4} />
                    )}

                    {/* Driven history trail */}
                    {historyPath.length > 1 && (
                        <Polyline coordinates={historyPath} strokeColor="#10B981" strokeWidth={5} />
                    )}

                    {detailTrip?.routePoints && renderRouteOverlays(detailTrip.routePoints)}


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

                    {/* Live vehicle position takes priority over static current */}
                    {livePos ? (
                        <Marker coordinate={livePos} title={`Vehicle: ${trip.vehicleCode} — Live`}>
                            <Text style={{ fontSize: 24 }}>🚛</Text>
                        </Marker>
                    ) : hasCurrent ? (
                        <Marker
                            coordinate={{ latitude: trip.currentLat, longitude: trip.currentLng }}
                            title={`Vehicle: ${trip.vehicleCode}`}
                        >
                            <Text style={{ fontSize: 24 }}>🚛</Text>
                        </Marker>
                    ) : null}

                    {!hasDetailMapData && historyPath.length === 0 && routeLine.length >= 2 && (
                        <Polyline coordinates={routeLine} strokeColor={accentColor} strokeWidth={3} />
                    )}
                </MapView>
            ) : detailLoading ? (
                <View style={styles.mapPlaceholder}>
                    <ActivityIndicator color={accentColor} />
                    <Text style={styles.mapPlaceholderText}>Loading route...</Text>
                </View>
            ) : (
                <View style={styles.mapPlaceholder}>
                    <Text style={styles.mapPlaceholderText}>📍 No location data available</Text>
                </View>
            )}

            <TouchableOpacity style={styles.expandMapBtn} onPress={() => setMapFullscreen(true)}>
                <Text style={styles.expandMapBtnText}>⤢</Text>
            </TouchableOpacity>
        </View>
    );

    const devices = detailTrip?.devices ?? [];
    const routePoints = detailTrip?.routePoints ?? [];

    return (
        <>
            <View style={[styles.container, isDark && styles.containerDark]}>
                <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.row}>
                    <View style={styles.topRow}>
                        <Text style={[styles.tripCode, { color: accentColor }]}>{trip.tripCode}</Text>
                        {trip.isELock && (
                            <View style={[styles.lockBadge, { backgroundColor: trip.lockStatus === 'LOCKED' ? '#EDE9FE' : '#FEE2E2' }]}>
                                <Text style={[styles.lockBadgeText, { color: trip.lockStatus === 'LOCKED' ? '#7C3AED' : '#DC2626' }]}>
                                    {trip.lockStatus === 'LOCKED' ? '🔒' : '🔓'} {trip.lockState}
                                </Text>
                            </View>
                        )}
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
                        {renderMap(220)}

                        {detailError ? (
                            <Text style={styles.errorText}>{detailError}</Text>
                        ) : null}

                        <Text style={[styles.detailTitle, isDark && styles.textWhite]}>Route Details</Text>
                        <DetailRow label="From" value={trip.from} isDark={isDark} />
                        <DetailRow label="To" value={trip.to} isDark={isDark} />
                        <DetailRow label="Vehicle" value={trip.vehicleCode} isDark={isDark} />
                        <DetailRow label="Driver" value={trip.driverName} isDark={isDark} />
                        {(detailTrip?.tripType || trip.tripType) && (
                            <DetailRow label="Trip Type" value={String(detailTrip?.tripType || trip.tripType)} isDark={isDark} />
                        )}
                        {trip.isELock && (
                            <DetailRow
                                label="Lock"
                                value={`${trip.lockState}${trip.lockReceivedAt ? ' · ' + trip.lockReceivedAt : ''}`}
                                isDark={isDark}
                            />
                        )}

                        {/* Devices */}
                        {devices.length > 0 && (
                            <View style={styles.devicesSection}>
                                <Text style={styles.devicesTitle}>Devices</Text>
                                {devices.map((device) => {
                                    const devNo = device.deviceNumber;
                                    const rawStatus = (device.status ?? '').toLowerCase();
                                    const isLocked = rawStatus === 'lock' || rawStatus === 'locked';
                                    const isUnknown = rawStatus === 'unknown' || rawStatus === '';
                                    const isBusy = devNo in lockCmdLoading;
                                    return (
                                        <View key={devNo} style={styles.deviceRow}>
                                            <View style={[styles.deviceDot, { backgroundColor: isLocked ? '#8B5CF6' : isUnknown ? '#FBBF24' : '#F87171' }]} />
                                            <Text style={styles.deviceNo}>{devNo}</Text>
                                            <Text style={styles.deviceStatus}>{isLocked ? 'Locked' : isUnknown ? 'Unknown' : 'Unlocked'}</Text>
                                            {(isLocked || isUnknown) && (
                                                <TouchableOpacity
                                                    disabled={isBusy}
                                                    style={styles.unlockBtn}
                                                    onPress={() => handleLockUnlock(devNo, 'unlock')}
                                                >
                                                    {isBusy ? <ActivityIndicator size="small" color="#DC2626" /> : <Text style={styles.unlockBtnText}>Unlock</Text>}
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* Action buttons */}
                        <View style={styles.actionsRow}>
                            {trip.status !== 'Completed' && trip.tripStatus !== 'TS' && trip.tripStatus !== 'TE' && (
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setManualModal({ action: 'TC', actionLabel: 'Trip Cancel', isCancel: true })}
                                >
                                    <Text style={styles.cancelBtnText}>⚠️ Cancel Trip</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.detailsBtn} onPress={() => setAdditionalDetailsOpen(true)}>
                                <Text style={styles.detailsBtnText}>📋 Additional Details</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Route timeline */}
                        <View style={styles.timelineSection}>
                            <Text style={styles.devicesTitle}>Route Points</Text>
                            {detailLoading && <Text style={styles.loadingText}>Loading route points…</Text>}
                            {!detailLoading && routePoints.length === 0 && (
                                <Text style={styles.loadingText}>No route points available</Text>
                            )}
                            {!detailLoading && routePoints.length > 0 && (
                                <RouteTimeline
                                    routePoints={routePoints}
                                    isDark={isDark}
                                    onAction={(action, label, actualEntry, actualExit) =>
                                        setManualModal({ action, actionLabel: label, existingInDateTime: actualEntry, existingOutDateTime: actualExit })
                                    }
                                />
                            )}
                        </View>
                    </View>
                )}
            </View>

            {/* Fullscreen map modal */}
            <Modal visible={mapFullscreen} animationType="slide" onRequestClose={() => setMapFullscreen(false)}>
                <View style={{ flex: 1 }}>
                    <TouchableOpacity style={styles.closeFullscreenBtn} onPress={() => setMapFullscreen(false)}>
                        <Text style={styles.closeFullscreenText}>✕ Close</Text>
                    </TouchableOpacity>
                    {renderMap('100%')}
                </View>
            </Modal>

            {manualModal && (
                <ManualStatusModal
                    visible
                    onClose={() => setManualModal(null)}
                    tripId={trip.tripId || Number(trip.tripCode?.replace(/\D/g, '')) || 0}
                    action={manualModal.action}
                    actionLabel={manualModal.actionLabel}
                    isCancel={manualModal.isCancel}
                    existingInDateTime={manualModal.existingInDateTime}
                    existingOutDateTime={manualModal.existingOutDateTime}
                    isDark={isDark}
                    onSuccess={() => {
                        if (manualModal?.isCancel) onRefresh?.();
                        else handleSync();
                    }}
                />
            )}

            <TripAdditionalDetailsModal
                visible={additionalDetailsOpen}
                tripId={trip.tripId || 0}
                tripLabel={trip.tripCode || `Trip #${trip.tripId || ''}`}
                onClose={() => setAdditionalDetailsOpen(false)}
                isDark={isDark}
            />
        </>
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
    container: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    containerDark: { borderBottomColor: '#1F2937' },
    row: { paddingVertical: 14, paddingHorizontal: 16 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
    tripCode: { fontWeight: '800', fontSize: 14 },
    badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    lockBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
    lockBadgeText: { fontSize: 10, fontWeight: '700' },
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
    detailBox: { backgroundColor: '#F9FAFB', margin: 12, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    detailBoxDark: { backgroundColor: '#111827', borderColor: '#374151' },
    detailTitle: { fontSize: 12, fontWeight: '800', color: '#111827', marginBottom: 8, marginTop: 4, textTransform: 'uppercase' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    detailLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
    detailValue: { fontSize: 12, color: '#374151', fontWeight: '700' },
    errorText: { color: '#EF4444', fontSize: 11, marginBottom: 8, fontWeight: '600' },
    textWhite: { color: '#fff' },
    textGray: { color: '#9CA3AF' },

    mapContainer: { borderRadius: 12, overflow: 'hidden', marginBottom: 12, position: 'relative' },
    map: { flex: 1 },
    mapPlaceholder: { flex: 1, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', borderRadius: 12, gap: 6 },
    mapPlaceholderText: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
    expandMapBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    expandMapBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    closeFullscreenBtn: { padding: 16, backgroundColor: '#111827' },
    closeFullscreenText: { color: '#fff', fontWeight: '700' },

    devicesSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    devicesTitle: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 },
    deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#E5E7EB' },
    deviceDot: { width: 8, height: 8, borderRadius: 4 },
    deviceNo: { flex: 1, fontSize: 12, fontWeight: '700', color: '#374151' },
    deviceStatus: { fontSize: 10, color: '#9CA3AF', fontWeight: '700' },
    unlockBtn: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    unlockBtnText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },

    actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
    cancelBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
    cancelBtnText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
    detailsBtn: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
    detailsBtnText: { fontSize: 11, fontWeight: '700', color: '#4338CA' },

    timelineSection: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    loadingText: { fontSize: 11, color: '#9CA3AF' },
});