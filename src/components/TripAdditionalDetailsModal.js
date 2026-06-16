import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { getTripAdditionalDetails } from '../services/tripMasterService';

function formatFieldKey(key, index) {
    if (!key) return `Field ${index + 1}`;
    const stripped = key.replace(/^fld_/, '');
    if (/^[a-z0-9]{6,}_[a-z0-9]{6,}$/.test(stripped)) return `Field ${index + 1}`;
    return stripped.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TripAdditionalDetailsModal({ visible, tripId, tripLabel, onClose, isDark }) {
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!visible || tripId <= 0) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            setDetails({});
            try {
                const res = await getTripAdditionalDetails(tripId);
                if (cancelled) return;
                if (res?.success) {
                    const raw = res.data?.additionalDetails ?? {};
                    const normalized = {};
                    for (const [k, v] of Object.entries(raw)) normalized[k] = String(v ?? '');
                    setDetails(normalized);
                } else {
                    setError(res?.message || 'Failed to load additional details');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [visible, tripId]);

    const entries = Object.entries(details);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.card, isDark && styles.cardDark]}>
                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.title, isDark && styles.textWhite]}>📋 Additional Details</Text>
                            {tripLabel ? <Text style={styles.subtitle}>{tripLabel}</Text> : null}
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 400 }}>
                        {loading && <ActivityIndicator style={{ marginVertical: 24 }} />}
                        {!loading && error && <Text style={styles.emptyText}>{error}</Text>}
                        {!loading && !error && entries.length === 0 && (
                            <Text style={styles.emptyText}>No additional details available for this trip.</Text>
                        )}
                        {!loading && !error && entries.map(([key, value], idx) => (
                            <View key={key} style={styles.entryCard}>
                                <Text style={styles.entryLabel}>{formatFieldKey(key, idx)}</Text>
                                <Text style={[styles.entryValue, isDark && styles.textWhite]}>{value || '—'}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
                        <Text style={styles.closeFooterBtnText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, maxHeight: '80%' },
    cardDark: { backgroundColor: '#111827' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    title: { fontSize: 15, fontWeight: '800', color: '#111827' },
    subtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    closeBtn: { fontSize: 18, color: '#9CA3AF' },
    emptyText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginVertical: 24 },
    entryCard: { backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 8 },
    entryLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 4 },
    entryValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
    closeFooterBtn: { backgroundColor: '#6366F1', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
    closeFooterBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    textWhite: { color: '#fff' },
});