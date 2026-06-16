import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SEVERITY_COLORS = {
    CRITICAL: '#EF4444',
    HIGH: '#F97316',
    MEDIUM: '#F59E0B',
    LOW: '#9CA3AF',
};

export default function TripSecurityFeed({ items = [], isDark, title, emptyText = 'No alerts.' }) {
    return (
        <View style={[styles.card, isDark && styles.cardDark]}>
            <View style={styles.headerRow}>
                <Text style={styles.shieldIcon}>🛡️</Text>
                <Text style={[styles.title, isDark && styles.textWhite]}>{title}</Text>
            </View>

            {items.length > 0 ? (
                items.map((item, idx) => {
                    const color = SEVERITY_COLORS[item.severity] || '#9CA3AF';
                    return (
                        <View key={idx} style={[styles.item, isDark && styles.itemDark]}>
                            <View style={[styles.dot, { backgroundColor: color }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemTitle, isDark && styles.textWhite]}>{item.title}</Text>
                                <Text style={[styles.itemMeta, isDark && styles.textGray]}>
                                    {item.location} · {item.timestamp}
                                </Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: color + '20' }]}>
                                <Text style={[styles.badgeText, { color }]}>{item.severity}</Text>
                            </View>
                        </View>
                    );
                })
            ) : (
                <Text style={[styles.empty, isDark && styles.textGray]}>{emptyText}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    shieldIcon: { fontSize: 16 },
    title: { fontSize: 14, fontWeight: '700', color: '#111827' },
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
    },
    itemDark: { backgroundColor: '#111827' },
    dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
    itemTitle: { fontSize: 12, fontWeight: '600', color: '#111827' },
    itemMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    badge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    badgeText: { fontSize: 10, fontWeight: '700' },
    empty: { fontSize: 12, color: '#9CA3AF' },
    textWhite: { color: '#fff' },
    textGray: { color: '#9CA3AF' },
});