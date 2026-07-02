import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️ Adjust these import paths to match your actual service files
import { javaApi } from "../services/apiService";
import { getAccountHierarchy, getVehicleDropdown } from "../services/tripMasterService";
import { downloadReportAsCsv, downloadReportAsXlsx } from "../utils/Reportexport";

// ---------- helpers (ported from the web version) ----------

const toOptionLabel = (item) =>
  String(
    item.label ??
      item.name ??
      item.vehicleNo ??
      item.vehicleNumber ??
      item.registrationNo ??
      item.registrationNumber ??
      item.value ??
      item.id ??
      "Unknown",
  );

const toVehicleOptionValue = (item) =>
  String(item.vehicleId ?? item.id ?? item.value ?? "");

const toAccountOptionValue = (item) => String(item.id ?? item.value ?? "");

const formatMinutes = (value) => {
  const totalMinutes = Number(value || 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes}m`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

const formatDateTime = (value) => {
  if (!value) return "NA";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getGoogleMapsLink = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

const toApiDateTime = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}`;
};

const normalizeDisplayValue = (value) => {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized) return "";
  const lowerValue = normalized.toLowerCase();
  if (lowerValue === "undefined" || lowerValue === "null") return "";
  return normalized;
};

// ---------- small reusable pieces ----------

function MetricCard({ label, value, color }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: "47%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        shadowColor: "#0f172a",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{ fontSize: 20, fontWeight: "800", color: color || "#0f172a", marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}

function MultiSelectModal({ visible, title, options, selected, onClose, onApply }) {
  const [tempSelected, setTempSelected] = useState(selected);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (visible) {
      setTempSelected(selected);
      setQuery("");
    }
  }, [visible, selected]);

  const toggle = (option) => {
    const exists = tempSelected.some((item) => item.value === option.value);
    if (exists) {
      setTempSelected(tempSelected.filter((item) => item.value !== option.value));
    } else {
      setTempSelected([...tempSelected, option]);
    }
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "75%" }}>
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>{title}</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search..."
              style={{
                marginTop: 10,
                borderWidth: 1,
                borderColor: "#e2e8f0",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            />
          </View>

          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.value}
            style={{ maxHeight: 320 }}
            renderItem={({ item }) => {
              const isSelected = tempSelected.some((sel) => sel.value === item.value);
              return (
                <TouchableOpacity
                  onPress={() => toggle(item)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f1f5f9",
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: isSelected ? "#7c3aed" : "#cbd5e1",
                      backgroundColor: isSelected ? "#7c3aed" : "transparent",
                      marginRight: 12,
                    }}
                  />
                  <Text style={{ fontSize: 14, color: "#0f172a" }}>{item.label}</Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>No options</Text>
            }
          />

          <View style={{ flexDirection: "row", padding: 16, gap: 10 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" }}
            >
              <Text style={{ fontWeight: "700", color: "#475569" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onApply(tempSelected)}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: "#7c3aed", alignItems: "center" }}
            >
              <Text style={{ fontWeight: "700", color: "#fff" }}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SelectField({ label, placeholder, valueText, onPress, disabled }) {
  return (
    <View style={{ flex: 1, marginBottom: 12 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b", marginBottom: 6, textTransform: "uppercase" }}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        style={{
          borderWidth: 1,
          borderColor: "#e2e8f0",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: disabled ? "#f8fafc" : "#fff",
        }}
      >
        <Text style={{ color: valueText ? "#0f172a" : "#94a3b8", fontWeight: "600" }} numberOfLines={1}>
          {valueText || placeholder}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------- main screen ----------

export default function MovementReportScreen() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return d;
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // Android's native picker has no combined "datetime" mode — only "date" and
  // "time" exist. Using mode="datetime" there crashes with
  // "Cannot read property 'dismiss' of undefined". So on Android we use the
  // imperative DateTimePickerAndroid API and chain a date dialog into a time
  // dialog. iOS keeps the declarative <DateTimePicker mode="datetime"> below,
  // since iOS natively supports the combined mode.
  const openAndroidDateTimePicker = (currentValue, onPicked) => {
    DateTimePickerAndroid.open({
      value: currentValue,
      mode: "date",
      maximumDate: new Date(),
      onChange: (dateEvent, selectedDate) => {
        if (dateEvent.type !== "set" || !selectedDate) return;

        DateTimePickerAndroid.open({
          value: selectedDate,
          mode: "time",
          onChange: (timeEvent, selectedTime) => {
            if (timeEvent.type !== "set" || !selectedTime) return;
            const combined = new Date(selectedDate);
            combined.setHours(selectedTime.getHours());
            combined.setMinutes(selectedTime.getMinutes());
            onPicked(combined);
          },
        });
      },
    });
  };

  const openStartPicker = () => {
    if (Platform.OS === "android") {
      openAndroidDateTimePicker(startDate, setStartDate);
    } else {
      setShowStartPicker(true);
    }
  };

  const openEndPicker = () => {
    if (Platform.OS === "android") {
      openAndroidDateTimePicker(endDate, setEndDate);
    } else {
      setShowEndPicker(true);
    }
  };

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("No record found");

  const getUserAccountIdFromStorage = async () => {
    try {
      const raw = await AsyncStorage.getItem("user");
      const user = JSON.parse(raw || "{}");
      return Number(user?.accountId || 0);
    } catch (error) {
      console.error("Failed to parse user account:", error);
      return 0;
    }
  };

  useEffect(() => {
    const initAccounts = async () => {
      try {
        const userAccountId = await getUserAccountIdFromStorage();
        const response = await getAccountHierarchy();
        if (response?.statusCode === 200 && Array.isArray(response?.data)) {
          const accountOptions = response.data.map((account) => ({
            label: toOptionLabel(account),
            value: toAccountOptionValue(account),
          }));
          setAccounts(accountOptions);

          if (userAccountId > 0) {
            const defaultAccount = accountOptions.find(
              (account) => Number(account.value) === userAccountId,
            );
            setSelectedAccounts(defaultAccount ? [defaultAccount] : []);
          } else {
            setSelectedAccounts([]);
          }
        }
      } catch (error) {
        Alert.alert("Error", error?.response?.data?.message || "Failed to load organizations");
      }
    };
    initAccounts();
  }, []);

  const fetchVehiclesForOrganization = async (accountIds) => {
    try {
      if (!accountIds.length) {
        setVehicles([]);
        setSelectedVehicles([]);
        return;
      }

      const responses = await Promise.all(
        accountIds.map((accountId) => getVehicleDropdown(String(accountId))),
      );
      const seenVehicles = new Set();
      const vehicleOptions = responses.flatMap((res) => {
        const vehicleList = Array.isArray(res?.data) ? res.data : [];
        return vehicleList
          .map((vehicle) => ({
            label: toOptionLabel(vehicle),
            value: toVehicleOptionValue(vehicle),
          }))
          .filter((vehicle) => {
            if (!vehicle.value || seenVehicles.has(vehicle.value)) return false;
            seenVehicles.add(vehicle.value);
            return true;
          });
      });

      setVehicles(vehicleOptions);
      setSelectedVehicles((previous) =>
        previous.filter((vehicle) => vehicleOptions.some((option) => option.value === vehicle.value)),
      );
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to load vehicles");
    }
  };

  useEffect(() => {
    fetchVehiclesForOrganization(
      selectedAccounts.map((account) => Number(account.value)).filter((v) => Number.isFinite(v) && v > 0),
    );
    setData([]);
  }, [selectedAccounts]);

  const handleViewReport = async () => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 0, 0);

    if (startDate.getTime() > endOfToday.getTime() || endDate.getTime() > endOfToday.getTime()) {
      Alert.alert("Invalid date", "Future date cannot be selected");
      return;
    }
    if (startDate.getTime() > endDate.getTime()) {
      Alert.alert("Invalid date", "Start date cannot be after end date");
      return;
    }

    const orgIds = selectedAccounts.map((a) => Number(a.value)).filter((v) => Number.isFinite(v) && v > 0);
    const vehicleIds = selectedVehicles.map((v) => String(v.value)).filter(Boolean);

    if (!orgIds.length) {
      Alert.alert("Missing selection", "Please select at least one organization");
      return;
    }

    try {
      setLoading(true);
      const response = await javaApi.post("reports/movement-report", {
        orgIds,
        vehicleIds,
        start: toApiDateTime(startDate),
        end: toApiDateTime(endDate),
      });
      const payload = response?.data;
      const isValid = payload?.valid !== false;
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      const noDataMessage = String(payload?.message || "").trim() || "No record found";

      if (!isValid || !rows.length) {
        setData([]);
        setEmptyMessage(noDataMessage);
        return;
      }

      setEmptyMessage("No record found");
      setData(rows);
    } catch (error) {
      setData([]);
      Alert.alert("Error", error?.response?.data?.message || "Failed to load movement report");
    } finally {
      setLoading(false);
    }
  };

  const accountNameById = new Map(accounts.map((a) => [Number(a.value), a.label]));

  const getExportRows = () =>
    data.map((row) => ({
      Organization: row.orgId
        ? accountNameById.get(Number(row.orgId)) || `Org ${row.orgId}`
        : "Movement Report",
      Vehicle: row.vehicleNo || "NA",
      "Start Time": formatDateTime(row.startTime),
      "End Time": formatDateTime(row.endTime),
      "Distance (KM)": row.distanceKm !== undefined ? Number(row.distanceKm).toFixed(2) : "NA",
      "Moving Time": formatMinutes(row.movingTimeMinutes),
      "Idle Time": formatMinutes(row.idleTimeMinutes),
      "Ignition On": formatMinutes(row.ignitionOnMinutes),
      "AC On": formatMinutes(row.acOnMinutes),
      Efficiency: row.fleetEfficiency !== undefined ? `${row.fleetEfficiency}%` : "NA",
      "Start Address": row.startAddress || "NA",
      "End Address": row.endAddress || "NA",
    }));

  const handleExport = async (format) => {
    if (!data.length) {
      Alert.alert("No record found");
      return;
    }
    const rows = getExportRows();
    const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");

    try {
      setExporting(true);
      if (format === "csv") {
        await downloadReportAsCsv(rows, `movement-report-${stamp}.csv`);
      } else {
        await downloadReportAsXlsx(rows, `movement-report-${stamp}.xlsx`);
      }
    } catch (error) {
      Alert.alert("Export failed", error?.message || "Could not export the report");
    } finally {
      setExporting(false);
    }
  };

  const totalDistance = data.reduce((sum, row) => sum + Number(row.distanceKm || 0), 0);
  const avgMovingMinutes = data.length
    ? data.reduce((sum, row) => sum + Number(row.movingTimeMinutes || 0), 0) / data.length
    : 0;
  const avgIdleMinutes = data.length
    ? data.reduce((sum, row) => sum + Number(row.idleTimeMinutes || 0), 0) / data.length
    : 0;
  const avgFleetEfficiency = data.length
    ? data.reduce((sum, row) => sum + Number(row.fleetEfficiency || 0), 0) / data.length
    : 0;

  const filteredData = data.filter((row) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return true;

    const organizationName =
      normalizeDisplayValue(row.orgId ? accountNameById.get(Number(row.orgId)) : "") ||
      (row.orgId ? `Org ${row.orgId}` : "Movement Report");

    const haystack = [
      organizationName,
      row.vehicleNo,
      row.distanceKm !== undefined ? Number(row.distanceKm).toFixed(2) : "NA",
      formatMinutes(row.movingTimeMinutes),
      formatMinutes(row.idleTimeMinutes),
      formatMinutes(row.ignitionOnMinutes),
      formatMinutes(row.acOnMinutes),
      row.fleetEfficiency !== undefined ? `${row.fleetEfficiency}%` : "NA",
      row.startAddress,
      row.endAddress,
      formatDateTime(row.startTime),
      formatDateTime(row.endTime),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 4 }}>
          Movement Report
        </Text>
        <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
          Advanced Reports / Movement Report
        </Text>

        {/* Filters card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            shadowColor: "#0f172a",
            shadowOpacity: 0.08,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 2,
          }}
        >
          <SelectField
            label="Organization"
            placeholder="Select Account"
            valueText={selectedAccounts.map((a) => a.label).join(", ")}
            onPress={() => setShowAccountModal(true)}
          />
          <SelectField
            label="Vehicle Plate"
            placeholder="Select Vehicle"
            valueText={selectedVehicles.map((v) => v.label).join(", ")}
            onPress={() => setShowVehicleModal(true)}
            disabled={!selectedAccounts.length}
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <SelectField
              label="From Date"
              placeholder="Start date & time"
              valueText={formatDateTime(startDate)}
              onPress={openStartPicker}
            />
            <SelectField
              label="To Date"
              placeholder="End date & time"
              valueText={formatDateTime(endDate)}
              onPress={openEndPicker}
            />
          </View>

          <TouchableOpacity
            onPress={handleViewReport}
            disabled={loading}
            style={{
              marginTop: 4,
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: loading ? "#c4b5fd" : "#7c3aed",
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700" }}>View Report</Text>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => handleExport("excel")}
              disabled={exporting || !data.length}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#7c3aed",
                alignItems: "center",
                opacity: exporting || !data.length ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "#7c3aed", fontWeight: "700" }}>Export Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleExport("csv")}
              disabled={exporting || !data.length}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#7c3aed",
                alignItems: "center",
                opacity: exporting || !data.length ? 0.5 : 1,
              }}
            >
              <Text style={{ color: "#7c3aed", fontWeight: "700" }}>Export CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metrics */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 4 }}>
          <MetricCard label="Total Distance" value={`${totalDistance.toFixed(2)} KM`} color="#7c3aed" />
          <MetricCard label="Avg Moving Time" value={formatMinutes(Math.round(avgMovingMinutes))} color="#16a34a" />
          <MetricCard label="Avg Idle Time" value={formatMinutes(Math.round(avgIdleMinutes))} color="#d97706" />
          <MetricCard label="Avg Fleet Efficiency" value={`${avgFleetEfficiency.toFixed(0)}%`} color="#dc2626" />
        </View>

        {/* Search */}
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search across all fields..."
          style={{
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#e2e8f0",
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 10,
          }}
        />
        <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
          Showing {filteredData.length} of {data.length} records
        </Text>

        {/* Results */}
        {filteredData.length === 0 ? (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#94a3b8", fontWeight: "600" }}>{emptyMessage}</Text>
          </View>
        ) : (
          filteredData.map((row, index) => {
            const startLink = getGoogleMapsLink(row.startLatitude, row.startLongitude);
            const endLink = getGoogleMapsLink(row.endLatitude, row.endLongitude);
            return (
              <View
                key={`${row.vehicleId || row.vehicleNo || "row"}-${index}`}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 12,
                  shadowColor: "#0f172a",
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a" }}>
                      {row.vehicleNo || "NA"}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>
                      {row.orgId
                        ? accountNameById.get(Number(row.orgId)) || `Org ${row.orgId}`
                        : "Movement Report"}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
                  <View>
                    <Text style={{ fontSize: 10, color: "#94a3b8" }}>Distance</Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#7c3aed" }}>
                      {row.distanceKm !== undefined ? `${Number(row.distanceKm).toFixed(2)} km` : "NA"}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 10, color: "#94a3b8" }}>Moving</Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#16a34a" }}>
                      {formatMinutes(row.movingTimeMinutes)}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 10, color: "#94a3b8" }}>Idle</Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#d97706" }}>
                      {formatMinutes(row.idleTimeMinutes)}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 10, color: "#94a3b8" }}>Ignition</Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#475569" }}>
                      {formatMinutes(row.ignitionOnMinutes)}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 10, color: "#94a3b8" }}>AC On</Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#475569" }}>
                      {formatMinutes(row.acOnMinutes)}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 10, color: "#94a3b8" }}>Efficiency</Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#475569" }}>
                      {row.fleetEfficiency !== undefined ? `${row.fleetEfficiency}%` : "NA"}
                    </Text>
                  </View>
                </View>

                <View style={{ borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 8, gap: 4 }}>
                  <Text style={{ fontSize: 12, color: "#334155" }}>
                    <Text style={{ fontWeight: "700", color: "#16a34a" }}>Start: </Text>
                    {row.startAddress || formatDateTime(row.startTime)}
                    {startLink ? (
                      <Text style={{ color: "#0284c7", fontWeight: "700" }} onPress={() => Linking.openURL(startLink)}>
                        {"  Open map"}
                      </Text>
                    ) : null}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#334155" }}>
                    <Text style={{ fontWeight: "700", color: "#f43f5e" }}>End: </Text>
                    {row.endAddress || formatDateTime(row.endTime)}
                    {endLink ? (
                      <Text style={{ color: "#0284c7", fontWeight: "700" }} onPress={() => Linking.openURL(endLink)}>
                        {"  Open map"}
                      </Text>
                    ) : null}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Date pickers — iOS only now; Android uses the imperative
          DateTimePickerAndroid API via openStartPicker/openEndPicker above,
          since Android has no native "datetime" mode. */}
      {Platform.OS === "ios" && showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="datetime"
          maximumDate={new Date()}
          display="spinner"
          onChange={(event, selected) => {
            setShowStartPicker(false);
            if (event.type === "set" && selected) setStartDate(selected);
          }}
        />
      )}
      {Platform.OS === "ios" && showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="datetime"
          maximumDate={new Date()}
          display="spinner"
          onChange={(event, selected) => {
            setShowEndPicker(false);
            if (event.type === "set" && selected) setEndDate(selected);
          }}
        />
      )}

      {/* Multi-select modals */}
      <MultiSelectModal
        visible={showAccountModal}
        title="Select Organization"
        options={accounts}
        selected={selectedAccounts}
        onClose={() => setShowAccountModal(false)}
        onApply={(next) => {
          setSelectedAccounts(next);
          setShowAccountModal(false);
        }}
      />
      <MultiSelectModal
        visible={showVehicleModal}
        title="Select Vehicle"
        options={vehicles}
        selected={selectedVehicles}
        onClose={() => setShowVehicleModal(false)}
        onApply={(next) => {
          setSelectedVehicles(next);
          setShowVehicleModal(false);
        }}
      />
    </SafeAreaView>
  );
}