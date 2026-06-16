import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView, TextInput, StatusBar,
} from 'react-native';
import { Colors } from '../constants/colors';

const fleetData = [
  { id: '1', vehicle: 'TRK-001', type: 'Heavy Truck', driver: 'Rajesh Kumar', plate: 'DL 01 AB 1234', status: 'Active', fuel: 80 },
  { id: '2', vehicle: 'TRK-002', type: 'Mini Truck', driver: 'Suresh Singh', plate: 'MH 02 CD 5678', status: 'In Transit', fuel: 55 },
  { id: '3', vehicle: 'TRK-003', type: 'Heavy Truck', driver: 'Amit Sharma', plate: 'KA 03 EF 9012', status: 'Maintenance', fuel: 20 },
  { id: '4', vehicle: 'TRK-004', type: 'Tempo', driver: 'Vijay Patel', plate: 'GJ 04 GH 3456', status: 'Active', fuel: 90 },
  { id: '5', vehicle: 'TRK-005', type: 'Mini Truck', driver: 'Deepak Yadav', plate: 'RJ 05 IJ 7890', status: 'Active', fuel: 65 },
  { id: '6', vehicle: 'TRK-006', type: 'Heavy Truck', driver: 'Sanjay Gupta', plate: 'UP 06 KL 2345', status: 'In Transit', fuel: 45 },
];

const statusColors = {
  Active: '#10B981',
  'In Transit': '#F59E0B',
  Maintenance: '#EF4444',
};

export default function FleetScreen() {
  const [search, setSearch] = useState('');
  const filtered = fleetData.filter(f =>
    f.vehicle.toLowerCase().includes(search.toLowerCase()) ||
    f.driver.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>{item.vehicle}</Text>
          <Text style={styles.vehicleType}>{item.type}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColors[item.status] + '20' }]}>
          <Text style={[styles.badgeText, { color: statusColors[item.status] }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👨‍✈️</Text>
          <Text style={styles.infoText}>{item.driver}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🪪</Text>
          <Text style={styles.infoText}>{item.plate}</Text>
        </View>
      </View>

      <View style={styles.fuelRow}>
        <Text style={styles.fuelLabel}>⛽ Fuel Level</Text>
        <Text style={styles.fuelPercent}>{item.fuel}%</Text>
      </View>
      <View style={styles.fuelBarBg}>
        <View style={[
          styles.fuelBar,
          { width: `${item.fuel}%`, backgroundColor: item.fuel > 50 ? '#10B981' : item.fuel > 20 ? '#F59E0B' : '#EF4444' }
        ]} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fleet Management</Text>
        <Text style={styles.headerSub}>{fleetData.length} vehicles registered</Text>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search vehicle or driver..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={Colors.gray}
        />
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, padding: 20, paddingTop: 10 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 46, fontSize: 14, color: Colors.textPrimary },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleInfo: {},
  vehicleName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  vehicleType: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.lightGray, marginVertical: 10 },
  cardBody: { marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoIcon: {  fontSize: 13, marginRight: 6  },
  infoText: { fontSize: 13, color: Colors.textSecondary },
  fuelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  fuelLabel: { fontSize: 12, color: Colors.textSecondary },
  fuelPercent: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  fuelBarBg: { height: 6, backgroundColor: Colors.lightGray, borderRadius: 10, marginTop: 4 },
  fuelBar: { height: 6, borderRadius: 10 },
});
