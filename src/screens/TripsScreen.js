import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';
import { Colors } from '../constants/colors';

const trips = [
  { id: '1', vehicle: 'TRK-001', driver: 'Rajesh Kumar', from: 'Delhi', to: 'Mumbai', date: '13 Jun 2026', distance: '1,400 km', status: 'In Transit', eta: '15 Jun' },
  { id: '2', vehicle: 'TRK-002', driver: 'Suresh Singh', from: 'Bangalore', to: 'Chennai', date: '12 Jun 2026', distance: '350 km', status: 'Completed', eta: 'Done' },
  { id: '3', vehicle: 'TRK-003', driver: 'Amit Sharma', from: 'Kolkata', to: 'Hyderabad', date: '14 Jun 2026', distance: '1,200 km', status: 'Pending', eta: '16 Jun' },
  { id: '4', vehicle: 'TRK-004', driver: 'Vijay Patel', from: 'Pune', to: 'Ahmedabad', date: '13 Jun 2026', distance: '650 km', status: 'In Transit', eta: '14 Jun' },
  { id: '5', vehicle: 'TRK-005', driver: 'Deepak Yadav', from: 'Jaipur', to: 'Lucknow', date: '11 Jun 2026', distance: '520 km', status: 'Completed', eta: 'Done' },
];

const filters = ['All', 'In Transit', 'Completed', 'Pending'];
const statusColors = { 'In Transit': '#F59E0B', Completed: '#10B981', Pending: '#6B7280' };
const statusIcons = { 'In Transit': '🔄', Completed: '✅', Pending: '⏳' };

export default function TripsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const filtered = activeFilter === 'All' ? trips : trips.filter(t => t.status === activeFilter);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip Tracker</Text>
        <Text style={styles.headerSub}>{trips.length} total trips</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('TripDashboard')}>
        <Text>View Trip Dashboard</Text>
      </TouchableOpacity>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.vehicle}>{item.vehicle}</Text>
                <Text style={styles.driver}>👨‍✈️ {item.driver}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: statusColors[item.status] + '20' }]}>
                <Text style={styles.badgeIcon}>{statusIcons[item.status]}</Text>
                <Text style={[styles.badgeText, { color: statusColors[item.status] }]}>{item.status}</Text>
              </View>
            </View>

            <View style={styles.routeRow}>
              <View style={styles.routePoint}>
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.routeCity}>{item.from}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.routeCity}>{item.to}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.meta}>📅 {item.date}</Text>
              <Text style={styles.meta}>📏 {item.distance}</Text>
              <Text style={styles.meta}>🎯 ETA: {item.eta}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, padding: 20, paddingTop: 10 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  filterRow: { flexDirection: 'row', padding: 14 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.lightGray, marginRight: 8 },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: Colors.white },
  list: { paddingHorizontal: 16, paddingBottom: 30 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vehicle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  driver: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeIcon: { fontSize: 11, marginRight: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  routePoint: { alignItems: 'center', },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 4 },
  routeCity: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  routeLine: { flex: 1, height: 2, backgroundColor: Colors.lightGray, marginHorizontal: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.lightGray, paddingTop: 10 },
  meta: { fontSize: 11, color: Colors.textSecondary },
});
