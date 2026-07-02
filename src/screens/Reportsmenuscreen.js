import React from "react";
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";

const REPORTS = [
  {
    key: "RunReport",
    title: "Run Report",
    description: "Daily trip summary — distance, moving/idle time, efficiency per vehicle.",
    icon: "📋",
    color: "#7c3aed",
    enabled: true,
  },
  {
    key: "MovementReport",
    title: "Movement Report",
    description: "Vehicle movement breakdown with ignition and AC usage per journey.",
    icon: "🧭",
    color: "#0284c7",
    enabled: true,
  },
  {
    key: "TripReport",
    title: "Trip Report",
    description: "Detailed trip history with start/end locations, duration, distance, and travel time.",
    icon: "🛣️",
    color: "#d97706",
    enabled: true,
  },
];
function ReportCard({ report, onPress }) {
  return (
    <TouchableOpacity
      onPress={report.enabled ? onPress : undefined}
      activeOpacity={report.enabled ? 0.7 : 1}
      style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        flexDirection: "row",
        alignItems: "center",
        opacity: report.enabled ? 1 : 0.5,
        shadowColor: "#0f172a",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: `${report.color}1A`,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Text style={{ fontSize: 22 }}>{report.icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>
          {report.title}
        </Text>
        <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          {report.description}
        </Text>
      </View>

      {report.enabled ? (
        <Text style={{ fontSize: 20, color: "#cbd5e1", marginLeft: 8 }}>›</Text>
      ) : (
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
            backgroundColor: "#f1f5f9",
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8" }}>SOON</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ReportsMenuScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 4 }}>
          Reports
        </Text>
        <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>
          Advanced Reports
        </Text>

        {REPORTS.map((report) => (
          <ReportCard
            key={report.key}
            report={report}
            onPress={() => navigation.navigate(report.key)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}