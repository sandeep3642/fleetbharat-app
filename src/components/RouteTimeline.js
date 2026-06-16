import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function format12hr(dtStr) {
    if (!dtStr || !dtStr.trim()) return '—';
    const parts = dtStr.trim().split(' ');
    const timePart = parts.length >= 2 ? parts[parts.length - 1] : parts[0];
    const datePart = parts.length >= 2 ? parts.slice(0, parts.length - 1).join(' ') : null;
    const [hStr, mStr] = (timePart ?? '').split(':');
    const h = parseInt(hStr ?? '0', 10);
    if (Number.isNaN(h)) return dtStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const formatted = `${String(h12).padStart(2, '0')}:${mStr ?? '00'} ${period}`;
    return datePart ? `${datePart} ${formatted}` : formatted;
}

export default function RouteTimeline({ routePoints, isDark, onAction }) {
    const [viaExpanded, setViaExpanded] = useState(false);

    const sorted = [...routePoints].sort((a, b) => a.sequence - b.sequence);
    const startPoint = sorted.find((rp) => rp.pointType === 'START') ?? sorted[0];
    const endPoint = sorted.find((rp) => rp.pointType === 'END') ?? sorted[sorted.length - 1];
    const viaPoints = sorted.filter((rp) => rp !== startPoint && rp !== endPoint);

    const VIA_THRESHOLD = 2;
    const visibleVia = viaExpanded || viaPoints.length <= VIA_THRESHOLD ? viaPoints : viaPoints.slice(0, VIA_THRESHOLD);
    const hiddenCount = viaPoints.length - VIA_THRESHOLD;

    const PointCard = ({ rp, variant }) => {
        const isLast = variant === 'end';
        const label =
            variant === 'start' ? 'Starting Point' :
                variant === 'end' ? 'Last Destination' :
                    `Stop ${rp.sequence - 1}`;

        const badgeColors = {
            start: { bg: '#D1FAE5', text: '#047857' },
            end: { bg: '#FEE2E2', text: '#B91C1C' },
            via: { bg: '#F3F4F6', text: '#6B7280' },
        };
        const dotColors = { start: '#10B981', end: '#EF4444', via: '#9CA3AF' };

        const actionButtons =
            variant === 'start' ? [{ action: 'TS', label: 'Trip Start', color: '#10B981' }] :
                variant === 'end' ? [{ action: 'TE', label: 'Trip End', color: '#EF4444' }] :
                    [
                        { action: 'SS', label: 'Stop Start', color: '#3B82F6' },
                        { action: 'SE', label: 'Stop End', color: '#F59E0B' },
                    ];

        return (
            <View style={[styles.pointCard, isDark && styles.pointCardDark]}>
                <View style={styles.pointHeader}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.badgeRow}>
                            <View style={[styles.badge, { backgroundColor: badgeColors[variant].bg }]}>
                                <Text style={[styles.badgeText, { color: badgeColors[variant].text }]}>{label}</Text>
                            </View>
                            <Text style={styles.seqText}>#{rp.sequence}</Text>
                        </View>
                        <Text style={[styles.addressText, isDark && styles.textWhite]} numberOfLines={1}>
                            {rp.geofenceAddress || rp.pointType}
                        </Text>
                    </View>
                    <View style={[styles.dot, { backgroundColor: dotColors[variant] }]} />
                </View>

                <View style={[styles.timeGrid, isLast && styles.timeGridLast]}>
                    <View style={styles.timeCell}>
                        <Text style={styles.timeLabel}>Planned Entry</Text>
                        <Text style={[styles.timeValue, isDark && styles.textWhite]}>{format12hr(rp.plannedEntryTime)}</Text>
                    </View>
                    <View style={styles.timeCell}>
                        <Text style={styles.timeLabel}>Actual Entry</Text>
                        <Text style={[styles.timeValue, rp.actualEntryTime && styles.timeValueGreen]}>
                            {format12hr(rp.actualEntryTime)}
                        </Text>
                    </View>
                    {!isLast && (
                        <>
                            <View style={styles.timeCell}>
                                <Text style={styles.timeLabel}>Planned Exit</Text>
                                <Text style={[styles.timeValue, isDark && styles.textWhite]}>{format12hr(rp.plannedExitTime)}</Text>
                            </View>
                            <View style={styles.timeCell}>
                                <Text style={styles.timeLabel}>Actual Exit</Text>
                                <Text style={[styles.timeValue, rp.actualExitTime && styles.timeValueGreen]}>
                                    {format12hr(rp.actualExitTime)}
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.actionRow}>
                    {actionButtons.map((btn) => (
                        <TouchableOpacity
                            key={btn.action}
                            style={[styles.actionBtn, { borderColor: btn.color }]}
                            onPress={() => onAction(btn.action, btn.label, rp.actualEntryTime ?? '', rp.actualExitTime ?? '')}
                        >
                            <Text style={[styles.actionBtnText, { color: btn.color }]}>{btn.label} · {btn.action}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <View>
            {startPoint && <PointCard rp={startPoint} variant="start" />}
            {visibleVia.map((rp) => (
                <PointCard key={`${rp.sequence}-${rp.geofenceId}`} rp={rp} variant="via" />
            ))}
            {viaPoints.length > VIA_THRESHOLD && (
                <TouchableOpacity style={styles.moreBtn} onPress={() => setViaExpanded((e) => !e)}>
                    <Text style={styles.moreBtnText}>
                        {viaExpanded ? 'Show less' : `+${hiddenCount} more stop${hiddenCount !== 1 ? 's' : ''}`}
                    </Text>
                </TouchableOpacity>
            )}
            {endPoint && <PointCard rp={endPoint} variant="end" />}
        </View>
    );
}

const styles = StyleSheet.create({
    pointCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6' },
    pointCardDark: { backgroundColor: '#111827', borderColor: '#374151' },
    pointHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { fontSize: 9, fontWeight: '700' },
    seqText: { fontSize: 9, color: '#9CA3AF', fontFamily: 'monospace' },
    addressText: { fontSize: 12, fontWeight: '700', color: '#111827' },
    dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    timeGridLast: { flexWrap: 'nowrap' },
    timeCell: { width: '47%' },
    timeLabel: { fontSize: 9, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' },
    timeValue: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
    timeValueGreen: { color: '#059669', fontWeight: '700' },
    actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', borderStyle: 'dashed' },
    actionBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    actionBtnText: { fontSize: 10, fontWeight: '700' },
    moreBtn: { borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginBottom: 8 },
    moreBtnText: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' },
    textWhite: { color: '#fff' },
});