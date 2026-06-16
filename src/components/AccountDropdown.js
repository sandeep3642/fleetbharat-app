// components/AccountDropdown.js
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Colors } from '../constants/colors';

export default function AccountDropdown({
    items,
    value,
    onChangeValue,
    loading = false,
    isDark = false
}) {
    const [open, setOpen] = React.useState(false);

    return (
        <View style={styles.container}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Select Account</Text>
            <DropDownPicker
                open={open}
                value={value}
                items={items}
                setOpen={setOpen}
                setValue={onChangeValue}
                disabled={loading || items.length === 0}
                style={[styles.picker, isDark && styles.pickerDark]}
                textStyle={[styles.text, isDark && styles.textDark]}
                dropDownContainerStyle={[styles.dropdown, isDark && styles.dropdownDark]}
                labelStyle={styles.label}
                placeholderStyle={styles.placeholder}
                searchable={true}
                searchPlaceholder="Search accounts..."
                listMode="SCROLLVIEW"
                scrollViewProps={{ nestedScrollEnabled: true }}
                zIndex={1000}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 16, zIndex: 1000 },
    label: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
    labelDark: { color: '#D1D5DB' },
    picker: {
        backgroundColor: '#fff',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 10,
    },
    pickerDark: {
        backgroundColor: '#1F2937',
        borderColor: '#374151'
    },
    text: { color: '#111827', fontSize: 13, fontWeight: '600' },
    textDark: { color: '#fff' },
    dropdown: {
        backgroundColor: '#fff',
        borderColor: '#E5E7EB',
    },
    dropdownDark: {
        backgroundColor: '#1F2937',
        borderColor: '#374151'
    },
    placeholder: { color: '#9CA3AF', fontSize: 13 },
});