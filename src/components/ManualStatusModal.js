import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { postManualTripStatus } from '../services/tripMasterService';

export default function ManualStatusModal({
    visible, onClose, tripId, action, actionLabel, isCancel, isDark, onSuccess,
}) {
    const [inDateTime, setInDateTime] = useState('');
    const [outDateTime, setOutDateTime] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = { tripId, action };
            if (!isCancel) {
                if (!inDateTime || !outDateTime) {
                    Alert.alert('Missing info', 'Please fill in both date fields (DD-MM-YYYY HH:MM:SS AM/PM)');
                    setLoading(false);
                    return;
                }
                payload.inDateTime = inDateTime;
                payload.outDateTime = outDateTime;
            }
            const res = await postManualTripStatus(payload);
            if (res?.success !== false) {
                Alert.alert('Success', res?.message || `${actionLabel} updated successfully`);
                onSuccess?.();
                onClose();
            } else {
                Alert.alert('Error', res?.message || 'Failed to update status');
            }
        } catch {
            Alert.alert('Error', 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.card, isDark && styles.cardDark]}>
                    <Text style={[styles.title, isDark && styles.textWhite]}>
                        {isCancel ? 'Cancel Trip' : `Manual ${actionLabel}`}
                    </Text>
                    <Text style={styles.subtitle}>Trip ID: {tripId} · Action: {action}</Text>

                    {isCancel ? (
                        <View style={styles.warningBox}>
                            <Text style={styles.warningText}>Are you sure you want to cancel this trip?</Text>
                            <Text style={styles.warningSubtext}>This action cannot be undone.</Text>
                        </View>
                    ) : (
                        <View style={{ marginVertical: 12 }}>
                            <Text style={styles.label}>In Date & Time</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="DD-MM-YYYY HH:MM:SS AM/PM"
                                value={inDateTime}
                                onChangeText={setInDateTime}
                            />
                            <Text style={styles.label}>Out Date & Time</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="DD-MM-YYYY HH:MM:SS AM/PM"
                                value={outDateTime}
                                onChangeText={setOutDateTime}
                            />
                        </View>
                    )}

                    <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmButton, { backgroundColor: isCancel ? '#EF4444' : '#6366F1' }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : (
                                <Text style={styles.confirmButtonText}>{isCancel ? 'Yes, Cancel Trip' : 'Confirm'}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
    cardDark: { backgroundColor: '#111827' },
    title: { fontSize: 15, fontWeight: '800', color: '#111827' },
    subtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
    warningBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, marginVertical: 12 },
    warningText: { fontSize: 13, fontWeight: '700', color: '#B91C1C' },
    warningSubtext: { fontSize: 11, color: '#EF4444', marginTop: 4 },
    label: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginBottom: 6, marginTop: 10, textTransform: 'uppercase' },
    input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
    btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    cancelButton: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    cancelButtonText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
    confirmButton: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    confirmButtonText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    textWhite: { color: '#fff' },
});