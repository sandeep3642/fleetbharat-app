import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';
import { Colors } from '../constants/colors';

const menuItems = [
  { icon: '🏢', label: 'Company Details', sub: 'AppFleetBharat Pvt. Ltd.' },
  { icon: '👥', label: 'Manage Drivers', sub: '18 drivers registered' },
  { icon: '📊', label: 'Reports & Analytics', sub: 'View performance reports' },
  { icon: '🔔', label: 'Notifications', sub: 'Manage alerts & reminders' },
  { icon: '🔒', label: 'Privacy & Security', sub: 'Password, 2FA settings' },
  { icon: '🆘', label: 'Support', sub: 'Help center & contact us' },
  { icon: '📋', label: 'Terms & Policies', sub: 'Legal documents' },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AF</Text>
          </View>
          <Text style={styles.name}>AppFleetBharat Admin</Text>
          <Text style={styles.email}>admin@appfleetbharat.in</Text>
          <Text style={styles.role}>Fleet Manager • India</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>24</Text>
              <Text style={styles.statLbl}>Vehicles</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>18</Text>
              <Text style={styles.statLbl}>Drivers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>142</Text>
              <Text style={styles.statLbl}>Trips</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AppFleetBharat v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, padding: 20, paddingTop: 10 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  profileCard: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { color: Colors.white, fontSize: 26, fontWeight: 'bold' },
  name: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  role: { fontSize: 12, color: Colors.primary, marginTop: 4, fontWeight: '600' },
  statsRow: { flexDirection: 'row', marginTop: 16, width: '100%', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  statLbl: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.lightGray },
  menuSection: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  menuSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  menuArrow: { fontSize: 20, color: Colors.gray },
  logoutBtn: {
    margin: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: Colors.textSecondary, fontSize: 12, marginBottom: 20 },
});
