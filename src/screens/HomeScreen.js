import React ,{useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';
import { Colors } from '../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const stats = [
  { label: 'Total Fleets', value: '24', icon: '🚛', color: '#1A73E8' },
  { label: 'Active', value: '18', icon: '✅', color: '#10B981' },
  { label: 'In Transit', value: '6', icon: '🔄', color: '#F59E0B' },
  { label: 'Maintenance', value: '2', icon: '🔧', color: '#EF4444' },
];

const recentTrips = [
  { id: '1', vehicle: 'TRK-001', driver: 'Rajesh Kumar', from: 'Delhi', to: 'Mumbai', status: 'In Transit', statusColor: '#F59E0B' },
  { id: '2', vehicle: 'TRK-002', driver: 'Suresh Singh', from: 'Bangalore', to: 'Chennai', status: 'Completed', statusColor: '#10B981' },
  { id: '3', vehicle: 'TRK-003', driver: 'Amit Sharma', from: 'Kolkata', to: 'Hyderabad', status: 'Pending', statusColor: '#6B7280' },
  { id: '4', vehicle: 'TRK-004', driver: 'Vijay Patel', from: 'Pune', to: 'Ahmedabad', status: 'In Transit', statusColor: '#F59E0B' },
];

export default function HomeScreen({ navigation }) {
  useEffect(() => {
    const showStorage = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const data = await AsyncStorage.multiGet(keys);
      } catch (error) {
        console.log('Storage Error:', error);
      }
    };

    showStorage();
  }, []);
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning 👋</Text>
          <Text style={styles.headerTitle}>Fleet-Bharat</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Text style={styles.notifIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Stats */}
        <Text style={styles.sectionTitle}>Fleet Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, { borderLeftColor: s.color }]}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Fleet')}>
            <Text style={styles.actionIcon}>🚛</Text>
            <Text style={styles.actionText}>Manage Fleet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Trips')}>
            <Text style={styles.actionIcon}>📍</Text>
            <Text style={styles.actionText}>Track Trips</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Trips */}
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        {recentTrips.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            <View style={styles.tripLeft}>
              <Text style={styles.tripVehicle}>{trip.vehicle}</Text>
              <Text style={styles.tripDriver}>👨‍✈️ {trip.driver}</Text>
              <Text style={styles.tripRoute}>📍 {trip.from} → {trip.to}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: trip.statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: trip.statusColor }]}>{trip.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  notifBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 },
  notifIcon: { fontSize: 18 },
  scroll: { padding: 16, paddingBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 16, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    width: '47%',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    marginBottom: 10, marginRight: '2%'
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 26, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  actionsRow: { flexDirection: 'row' },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    marginRight: 10
  },
  actionIcon: { fontSize: 26, marginBottom: 6 },
  actionText: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', fontWeight: '600' },
  tripCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  tripLeft: { flex: 1 },
  tripVehicle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  tripDriver: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  tripRoute: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
});
