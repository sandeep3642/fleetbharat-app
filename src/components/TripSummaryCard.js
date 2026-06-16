import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ICON_MAP = {
  totalTrips: '🚚',
  activeTrips: '⚡',
  inTransit: '🚛',
  delayedTrips: '⏱️',
  completed: '✅',
  tamperEvents: '⚠️',
};

const COLOR_MAP = {
  totalTrips: '#3B82F6',
  activeTrips: '#8B5CF6',
  inTransit: '#06B6D4',
  delayedTrips: '#F59E0B',
  completed: '#10B981',
  tamperEvents: '#F97316',
};

export default function TripSummaryCard({ card, isDark }) {
  const color = COLOR_MAP[card.key] || '#3B82F6';
  const icon = ICON_MAP[card.key] || '📊';

  const trendIcon =
    card.trendDirection === 'positive' ? '▲' :
    card.trendDirection === 'negative' ? '▼' : '—';

  const trendColor =
    card.trendDirection === 'positive' ? '#10B981' :
    card.trendDirection === 'negative' ? '#EF4444' : '#9CA3AF';

  return (
    <View style={[styles.card, isDark && styles.cardDark, { borderTopColor: color }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <Text style={[styles.trend, { color: trendColor }]}>
          {trendIcon} {card.trendText}
        </Text>
      </View>

      <Text style={[styles.count, isDark && styles.textWhite]}>{card.count}</Text>
      <Text style={[styles.label, isDark && styles.textGray]}>{card.label}</Text>
      <Text style={[styles.status, { color }]}>{card.status}</Text>
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
    borderTopWidth: 3,
    width: '48%',
    marginBottom: 12,
  },
  cardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18 },
  trend: { fontSize: 11, fontWeight: '700' },
  count: { fontSize: 24, fontWeight: '800', color: '#111827' },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 2 },
  status: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  textWhite: { color: '#fff' },
  textGray: { color: '#D1D5DB' },
});