import React, { useEffect, useMemo, useState } from "react";
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
    SafeAreaView,
    Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

// ⚠️ Adjust these import paths to match your actual service files
import { getAccountHierarchy, getVehicleDropdown, getTripReport } from "../services/tripMasterService";
import { downloadReportAsCsv, downloadReportAsXlsx } from "../utils/Reportexport";

// ---------- helpers ----------

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

const formatDateTime = (value) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatDistance = (metres) => {
    if (!metres) return "—";
    const km = metres / 1000;
    return `${km.toFixed(2)} KM`;
};

const toApiDateTime = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate(),
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const STATUS_COLORS = {
    InTransit: { bg: "#dbeafe", text: "#1d4ed8" },
    Completed: { bg: "#d1fae5", text: "#047857" },
    Planned: { bg: "#ede9fe", text: "#6d28d9" },
    Delayed: { bg: "#fee2e2", text: "#b91c1c" },
    Ready: { bg: "#fef3c7", text: "#b45309" },
};

const statusColors = (status) => STATUS_COLORS[status] || { bg: "#f1f5f9", text: "#475569" };

// ---------- small reusable pieces ----------

function MetricCard({ label, value, color }) {
    return (
        <View
            style={{
                flex: 1,
                minWidth: "31%",
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 12,
                marginBottom: 12,
                shadowColor: "#0f172a",
                shadowOpacity: 0.08,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 2,
            }}
        >
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                {label}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: color || "#0f172a", marginTop: 4 }}>
                {value}
            </Text>
        </View>
    );
}

function SingleSelectModal({ visible, title, options, selectedValue, onClose, onSelect }) {
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (visible) setQuery("");
    }, [visible]);

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
                        style={{ maxHeight: 400 }}
                        renderItem={({ item }) => {
                            const isSelected = item.value === selectedValue;
                            return (
                                <TouchableOpacity
                                    onPress={() => onSelect(item)}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        borderBottomWidth: 1,
                                        borderBottomColor: "#f1f5f9",
                                        backgroundColor: isSelected ? "#f5f3ff" : "#fff",
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: 10,
                                            borderWidth: 2,
                                            borderColor: isSelected ? "#7c3aed" : "#cbd5e1",
                                            marginRight: 12,
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {isSelected && (
                                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#7c3aed" }} />
                                        )}
                                    </View>
                                    <Text style={{ fontSize: 14, color: "#0f172a" }}>{item.label}</Text>
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <Text style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>No options</Text>
                        }
                    />

                    <View style={{ padding: 16 }}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{ paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" }}
                        >
                            <Text style={{ fontWeight: "700", color: "#475569" }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
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

function DetailRow({ label, value }) {
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
            <Text style={{ fontSize: 12, color: "#94a3b8", fontWeight: "600" }}>{label}</Text>
            <Text style={{ fontSize: 13, color: "#0f172a", fontWeight: "700", flexShrink: 1, textAlign: "right", marginLeft: 12 }}>
                {value || "—"}
            </Text>
        </View>
    );
}

function TripDetailModal({ trip, onClose }) {
    if (!trip) return null;
    const colors = statusColors(trip.status);

    return (
        <Modal visible={!!trip} animationType="slide" transparent onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.5)", justifyContent: "flex-end" }}>
                <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" }}>
                    <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>{trip.tripNo}</Text>
                                <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{trip.organization}</Text>
                            </View>
                            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.bg }}>
                                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text }}>{trip.status}</Text>
                            </View>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        <View style={{ marginBottom: 16 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10b981", marginRight: 8 }} />
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a", flex: 1 }}>{trip.origin}</Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", marginRight: 8 }} />
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0f172a", flex: 1 }}>{trip.destination}</Text>
                            </View>
                        </View>

                        <DetailRow label="Driver" value={trip.driverName} />
                        <DetailRow label="Vehicle" value={trip.vehicleNo} />
                        <DetailRow label="Device" value={`${trip.deviceType || ""} ${trip.deviceNumber || ""}`.trim()} />
                        {trip.lockStatus ? <DetailRow label="Lock Status" value={trip.lockStatus} /> : null}
                        <DetailRow label="Trip Type" value={trip.type} />
                        <DetailRow label="ETD" value={trip.startTime || formatDateTime(trip.etd)} />
                        <DetailRow label="ETA" value={trip.eta || formatDateTime(trip.rta)} />
                        <DetailRow label="Distance" value={formatDistance(trip.totalDistance)} />
                        <DetailRow
                            label="Segments"
                            value={
                                trip.segmentCount !== undefined
                                    ? `${trip.segmentCount} ${Number(trip.segmentCount) !== 1 ? "segments" : "segment"}`
                                    : "—"
                            }
                        />
                    </ScrollView>

                    <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: "#e2e8f0" }}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={{ paddingVertical: 12, borderRadius: 14, backgroundColor: "#7c3aed", alignItems: "center" }}
                        >
                            <Text style={{ fontWeight: "700", color: "#fff" }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ---------- main screen ----------

export default function TripReportScreen() {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicles, setSelectedVehicles] = useState([]);

    const [fromDate, setFromDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [toDate, setToDate] = useState(() => {
        const d = new Date();
        d.setHours(23, 59, 0, 0);
        return d;
    });

    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);

    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Android has no native "datetime" mode — chain a date dialog into a time
    // dialog there; iOS keeps the declarative combined spinner.
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

    const openFromPicker = () => {
        if (Platform.OS === "android") {
            openAndroidDateTimePicker(fromDate, setFromDate);
        } else {
            setShowFromPicker(true);
        }
    };

    const openToPicker = () => {
        if (Platform.OS === "android") {
            openAndroidDateTimePicker(toDate, setToDate);
        } else {
            setShowToPicker(true);
        }
    };

    useEffect(() => {
        const initAccounts = async () => {
            try {
                const response = await getAccountHierarchy();
                if (response?.statusCode === 200 && Array.isArray(response?.data)) {
                    const accountOptions = response.data.map((account) => ({
                        label: toOptionLabel(account),
                        value: toAccountOptionValue(account),
                    }));
                    setAccounts(accountOptions);
                }
            } catch (error) {
                Alert.alert("Error", error?.response?.data?.message || "Failed to load organizations");
            }
        };
        initAccounts();
    }, []);

    useEffect(() => {
        const fetchVehicles = async () => {
            if (!selectedAccount) {
                setVehicles([]);
                setSelectedVehicles([]);
                return;
            }
            try {
                const res = await getVehicleDropdown(String(selectedAccount.value));
                const list = Array.isArray(res?.data) ? res.data : [];
                const seen = new Set();
                const vehicleOptions = list
                    .map((vehicle) => ({
                        label: toOptionLabel(vehicle),
                        value: toVehicleOptionValue(vehicle),
                    }))
                    .filter((vehicle) => {
                        if (!vehicle.value || seen.has(vehicle.value)) return false;
                        seen.add(vehicle.value);
                        return true;
                    });
                setVehicles(vehicleOptions);
                setSelectedVehicles((previous) =>
                    previous.filter((vehicle) => vehicleOptions.some((option) => option.value === vehicle.value)),
                );
            } catch (error) {
                Alert.alert("Error", error?.response?.data?.message || "Failed to load vehicles");
            }
        };
        fetchVehicles();
        setReportData(null);
    }, [selectedAccount]);

    const handleViewReport = async () => {
        if (!selectedAccount) {
            Alert.alert("Missing selection", "Please select an organization");
            return;
        }
        if (fromDate.getTime() > toDate.getTime()) {
            Alert.alert("Invalid date", "From date cannot be after To date");
            return;
        }

        const params = {
            accountId: String(selectedAccount.value),
            fromDate: toApiDateTime(fromDate),
            toDate: toApiDateTime(toDate),
        };
        if (selectedVehicles.length === 1) {
            params.vehicleNo = String(
                vehicles.find((v) => v.value === selectedVehicles[0].value)?.label ?? "",
            );
        }

        try {
            setLoading(true);
            const res = await getTripReport(params);
            if (res?.success === false) {
                Alert.alert("Error", res.message || "Failed to load trip report");
                setReportData(null);
                return;
            }
            const payload = res?.data ?? res;
            if (!Array.isArray(payload?.data) || payload.data.length === 0) {
                setReportData({
                    summary: payload?.summary ?? {
                        totalTrips: 0,
                        inTransitTrips: 0,
                        completedTrips: 0,
                        plannedTrips: 0,
                        delayedTrips: 0,
                        readyTrips: 0,
                    },
                    totalRecords: 0,
                    data: [],
                });
                return;
            }
            setReportData(payload);
        } catch (error) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to load trip report");
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    const rows = reportData?.data ?? [];
    const summary = reportData?.summary;

    const filteredRows = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) =>
            [
                r.tripNo,
                r.organization,
                r.driverName,
                r.vehicleNo,
                r.deviceType,
                r.deviceNumber,
                r.origin,
                r.destination,
                r.type,
                r.status,
                r.startTime,
                r.eta,
            ]
                .join(" ")
                .toLowerCase()
                .includes(q),
        );
    }, [rows, searchQuery]);

    const getExportRows = () =>
        filteredRows.map((r) => ({
            "Trip No": r.tripNo,
            Organization: r.organization,
            Driver: r.driverName,
            Vehicle: r.vehicleNo,
            "Device Type": r.deviceType,
            "Device No": r.deviceNumber,
            Origin: r.origin,
            Destination: r.destination,
            "Trip Type": r.type,
            Status: r.status,
            ETD: formatDateTime(r.etd),
            RTA: formatDateTime(r.rta),
            "Start Time": r.startTime,
            ETA: r.eta,
            Segments: r.segmentCount,
            Distance: formatDistance(r.totalDistance),
        }));

    const handleExport = async (format) => {
        if (!filteredRows.length) {
            Alert.alert("No record found");
            return;
        }
        const rowsToExport = getExportRows();
        const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");

        try {
            setExporting(true);
            if (format === "csv") {
                await downloadReportAsCsv(rowsToExport, `trip-report-${stamp}.csv`);
            } else {
                await downloadReportAsXlsx(rowsToExport, `trip-report-${stamp}.xlsx`);
            }
        } catch (error) {
            Alert.alert("Export failed", error?.message || "Could not export the report");
        } finally {
            setExporting(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 4 }}>
                    Trip Report
                </Text>
                <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
                    Fleet / Trip Report
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
                        valueText={selectedAccount?.label}
                        onPress={() => setShowAccountModal(true)}
                    />
                    <SelectField
                        label="Vehicle"
                        placeholder="All Vehicles"
                        valueText={selectedVehicles.map((v) => v.label).join(", ")}
                        onPress={() => setShowVehicleModal(true)}
                        disabled={!selectedAccount}
                    />

                    <View style={{ flexDirection: "row", gap: 12 }}>
                        <SelectField
                            label="From Date"
                            placeholder="Start date & time"
                            valueText={formatDateTime(fromDate)}
                            onPress={openFromPicker}
                        />
                        <SelectField
                            label="To Date"
                            placeholder="End date & time"
                            valueText={formatDateTime(toDate)}
                            onPress={openToPicker}
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
                            disabled={exporting || !filteredRows.length}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 14,
                                borderWidth: 1,
                                borderColor: "#7c3aed",
                                alignItems: "center",
                                opacity: exporting || !filteredRows.length ? 0.5 : 1,
                            }}
                        >
                            <Text style={{ color: "#7c3aed", fontWeight: "700" }}>Export Excel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleExport("csv")}
                            disabled={exporting || !filteredRows.length}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 14,
                                borderWidth: 1,
                                borderColor: "#7c3aed",
                                alignItems: "center",
                                opacity: exporting || !filteredRows.length ? 0.5 : 1,
                            }}
                        >
                            <Text style={{ color: "#7c3aed", fontWeight: "700" }}>Export CSV</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Summary */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
                    <MetricCard label="Total Trips" value={summary?.totalTrips ?? "—"} color="#7c3aed" />
                    <MetricCard label="In Transit" value={summary?.inTransitTrips ?? "—"} color="#1d4ed8" />
                    <MetricCard label="Completed" value={summary?.completedTrips ?? "—"} color="#047857" />
                    <MetricCard label="Planned" value={summary?.plannedTrips ?? "—"} color="#4f46e5" />
                    <MetricCard label="Delayed" value={summary?.delayedTrips ?? "—"} color="#b91c1c" />
                    <MetricCard label="Ready" value={summary?.readyTrips ?? "—"} color="#b45309" />
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
                    Showing {filteredRows.length} of {rows.length} records
                </Text>

                {/* Results */}
                {filteredRows.length === 0 ? (
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 16,
                            padding: 24,
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ color: "#94a3b8", fontWeight: "600" }}>
                            {reportData ? "No matching results" : "Select filters and tap View Report"}
                        </Text>
                    </View>
                ) : (
                    filteredRows.map((row) => {
                        const colors = statusColors(row.status);
                        return (
                            <TouchableOpacity
                                key={row.tripId}
                                onPress={() => setSelectedTrip(row)}
                                activeOpacity={0.7}
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
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={{ fontSize: 15, fontWeight: "800", color: "#7c3aed" }}>{row.tripNo}</Text>
                                        <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }} numberOfLines={1}>
                                            {row.organization}
                                        </Text>
                                    </View>
                                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.bg, alignSelf: "flex-start" }}>
                                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text }}>{row.status}</Text>
                                    </View>
                                </View>

                                <View style={{ marginBottom: 8 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#10b981", marginRight: 8 }} />
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", flex: 1 }} numberOfLines={1}>
                                            {row.origin}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#ef4444", marginRight: 8 }} />
                                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#0f172a", flex: 1 }} numberOfLines={1}>
                                            {row.destination}
                                        </Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                                    <View>
                                        <Text style={{ fontSize: 10, color: "#94a3b8" }}>Vehicle</Text>
                                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#475569" }}>{row.vehicleNo || "—"}</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 10, color: "#94a3b8" }}>Driver</Text>
                                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#475569" }}>{row.driverName || "—"}</Text>
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 10, color: "#94a3b8" }}>Distance</Text>
                                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#475569" }}>
                                            {formatDistance(row.totalDistance)}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* Date pickers — iOS only; Android uses the imperative API above */}
            {Platform.OS === "ios" && showFromPicker && (
                <DateTimePicker
                    value={fromDate}
                    mode="datetime"
                    maximumDate={new Date()}
                    display="spinner"
                    onChange={(event, selected) => {
                        setShowFromPicker(false);
                        if (event.type === "set" && selected) setFromDate(selected);
                    }}
                />
            )}
            {Platform.OS === "ios" && showToPicker && (
                <DateTimePicker
                    value={toDate}
                    mode="datetime"
                    maximumDate={new Date()}
                    display="spinner"
                    onChange={(event, selected) => {
                        setShowToPicker(false);
                        if (event.type === "set" && selected) setToDate(selected);
                    }}
                />
            )}

            <SingleSelectModal
                visible={showAccountModal}
                title="Select Organization"
                options={accounts}
                selectedValue={selectedAccount?.value}
                onClose={() => setShowAccountModal(false)}
                onSelect={(item) => {
                    setSelectedAccount(item);
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

            <TripDetailModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
        </SafeAreaView>
    );
}