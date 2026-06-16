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

const GRADIENT_MAP = {
  totalTrips: { light: '#DBEAFE', dark: '#1E40AF' },
  activeTrips: { light: '#EDE9FE', dark: '#5B21B6' },
  inTransit: { light: '#CFFAFE', dark: '#0E7490' },
  delayedTrips: { light: '#FEF3C7', dark: '#92400E' },
  completed: { light: '#DCFCE7', dark: '#166534' },
  tamperEvents: { light: '#FFEDD5', dark: '#92400E' },
};

const COLOR_MAP = {
  totalTrips: '#3B82F6',
  activeTrips: '#8B5CF6',
  inTransit: '#06B6D4',
  delayedTrips: '#F59E0B',
  completed: '#10B981',
  tamperEvents: '#F97316',
};

export default function TripSummaryCard({ card, isDark, accentColor }) {
  const color = accentColor || COLOR_MAP[card.key] || '#3B82F6';
  const icon = ICON_MAP[card.key] || '📊';
  const gradient = GRADIENT_MAP[card.key] || { light: '#DBEAFE', dark: '#1E40AF' };

  const trendIcon =
    card.trendDirection === 'positive' ? '▲' :
    card.trendDirection === 'negative' ? '▼' : '—';

  const trendColor =
    card.trendDirection === 'positive' ? '#10B981' :
    card.trendDirection === 'negative' ? '#EF4444' : '#9CA3AF';

  const bgColor = isDark ? gradient.dark : gradient.light;

  return (
    <View
      style={[
        styles.card,
        isDark && styles.cardDark,
        { backgroundColor: bgColor },
      ]}
    >
      {/* Top accent bar */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: color },
        ]}
      />

      {/* Header: Icon + Trend */}
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: color + '25' }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.trendBadge}>
          <Text style={[styles.trendIcon, { color: trendColor }]}>
            {trendIcon}
          </Text>
          <Text style={[styles.trendText, { color: trendColor }]}>
            {card.trendText}
          </Text>
        </View>
      </View>

      {/* Main count */}
      <View style={styles.countSection}>
        <Text
          style={[
            styles.count,
            isDark ? styles.countDark : styles.countLight,
          ]}
        >
          {card.count}
        </Text>
      </View>

      {/* Label and status */}
      <View style={styles.footerRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.label,
              isDark ? styles.labelDark : styles.labelLight,
            ]}
            numberOfLines={1}
          >
            {card.label}
          </Text>
          <Text
            style={[styles.status, { color }]}
            numberOfLines={1}
          >
            {card.status}
          </Text>
        </View>
      </View>

      {/* Subtle bottom accent */}
      <View style={[styles.bottomAccent, { backgroundColor: color + '12' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDark: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  trendIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countSection: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  count: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  countLight: {
    color: '#111827',
  },
  countDark: {
    color: '#F9FAFB',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
  },
  labelLight: {
    color: '#374151',
  },
  labelDark: {
    color: '#D1D5DB',
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomAccent: {
    height: 1,
    marginTop: 2,
  },
});