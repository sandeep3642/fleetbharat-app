import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import FleetScreen from '../screens/FleetScreen';
import TripsScreen from '../screens/TripsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import { Colors } from '../constants/colors';
import TripDashboardScreen from '../screens/TripDashboardScreen';
import RunReportScreen from '../screens/RunReportScreen';
import MovementReportScreen from '../screens/Movementreportscreen';
import ReportsMenuScreen from '../screens/Reportsmenuscreen';
import TripReportScreen from '../screens/Tripreportscreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ icon, focused }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
  );
}

function MainTabs() {

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.lightGray,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        sceneContainerStyle: { backgroundColor: '#f9fafb' },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }}
      />
      <Tab.Screen
        name="Fleet"
        component={FleetScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🚛" focused={focused} /> }}
      />
      <Tab.Screen
        name="Trips"
        component={TripDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📍" focused={focused} /> }}
      />
      {/* ✅ ADD THIS TAB */}
      <Tab.Screen
        name="Reports"
        component={ReportsMenuScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      {/* ✅ ONE Stack.Navigator with Login first, then Main */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="RunReport"
          component={RunReportScreen}
          options={{ headerShown: true, title: 'Run Report' }}
        />
        <Stack.Screen
          name="MovementReport"
          component={MovementReportScreen}
          options={{ headerShown: true, title: 'Movement Report' }}
        />
          <Stack.Screen
          name="TripReport"
          component={TripReportScreen}
          options={{ headerShown: true, title: 'Trip Report' }}
        />
        {/* <Stack.Screen name="TripDashboard" component={TripDashboardScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}