import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
    Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';
import { loginUser } from '../services/authService';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validateForm = () => {
        const newErrors = {};
        if (!email.trim()) {
            newErrors.email = 'Email or phone is required';
        }
        if (!password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);

            const response = await loginUser(email, password);
            const token = response?.data?.token;

            if (!token?.accessToken) {
                Alert.alert(
                    'Login Failed',
                    response?.message || 'Invalid email or password.'
                );
                return;
            }

            // Store auth data
            await AsyncStorage.setItem('authToken', token.accessToken);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));

            if (Array.isArray(response.data.formRights)) {
                await AsyncStorage.setItem('permissions', JSON.stringify(response.data.formRights));
            }

            // Remember email for next time
            if (remember) {
                await AsyncStorage.setItem('rememberedEmail', email);
            } else {
                await AsyncStorage.removeItem('rememberedEmail');
            }

            // Navigate to main app
            navigation.replace('Main');
        } catch (err) {
            console.error('Login error:', err);
            Alert.alert('Error', 'Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            {/* Green Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.badge}><Text style={styles.badgeText}>V2.0 INDIA</Text></View>
                    <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                </View>

                <View style={styles.logoBox}>
                    <Text style={styles.logoIcon}>🚛</Text>
                </View>
                <Text style={styles.appName}>FleetBharat</Text>
                <Text style={styles.tagline}>Powering India's fleet revolution</Text>
            </View>

            {/* White Card */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.card} keyboardShouldPersistTaps="handled">
                    <Text style={styles.welcome}>Welcome back</Text>
                    <Text style={styles.subtitle}>Sign in to manage your fleet</Text>

                    {/* Email */}
                    <Text style={styles.label}>Email, Mobile, or Username</Text>
                    <View style={[styles.inputRow, errors.email && styles.inputError]}>
                        <Text style={styles.inputIcon}>✉️</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="name@company.com"
                            placeholderTextColor="#aaa"
                            value={email}
                            onChangeText={(v) => { setEmail(v); setErrors(e => ({ ...e, email: undefined })); }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!loading}
                        />
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                    {/* Password */}
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>Password</Text>
                        <TouchableOpacity>
                            <Text style={styles.forgot}>FORGOT PASSWORD?</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.inputRow, errors.password && styles.inputError]}>
                        <Text style={styles.inputIcon}>🔒</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#aaa"
                            value={password}
                            onChangeText={(v) => { setPassword(v); setErrors(e => ({ ...e, password: undefined })); }}
                            secureTextEntry
                            editable={!loading}
                            onSubmitEditing={handleLogin}
                        />
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                    {/* Remember me */}
                    <TouchableOpacity style={styles.rememberRow} onPress={() => setRemember(!remember)}>
                        <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                            {remember && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.rememberText}>Remember for 30 days</Text>
                    </TouchableOpacity>

                    {/* Sign In Button */}
                    <TouchableOpacity
                        style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.signInText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Social Buttons */}
                    <View style={styles.socialRow}>
                        <TouchableOpacity style={styles.socialBtn}>
                            <Text style={styles.socialIcon}>G</Text>
                            <Text style={styles.socialText}>Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialBtn}>
                            <Text style={[styles.socialIcon, { color: '#1877F2' }]}>f</Text>
                            <Text style={styles.socialText}>Facebook</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Sign Up */}
                    <View style={styles.signupRow}>
                        <Text style={styles.signupText}>Don't have an account? </Text>
                        <TouchableOpacity>
                            <Text style={styles.signupLink}>Sign up for free</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.primary },

    header: { backgroundColor: Colors.primary, alignItems: 'center', paddingBottom: 30, paddingTop: 10 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, marginBottom: 20 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80', marginRight: 5 },
    liveText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    logoBox: { width: 70, height: 70, backgroundColor: '#fff', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    logoIcon: { fontSize: 36 },
    appName: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
    tagline: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },

    card: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingTop: 32, flexGrow: 1 },
    welcome: { fontSize: 24, fontWeight: '800', color: '#111', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },

    label: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1, marginBottom: 8 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    forgot: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 14, marginBottom: 6, height: 52 },
    inputError: { borderWidth: 1.5, borderColor: '#EF4444' },
    inputIcon: { fontSize: 16, marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: '#333' },
    errorText: { color: '#EF4444', fontSize: 11, marginBottom: 12, fontWeight: '600' },

    rememberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 24 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', marginRight: 10, alignItems: 'center', justifyContent: 'center' },
    checkboxOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    checkmark: { color: '#fff', fontSize: 13, fontWeight: '800' },
    rememberText: { fontSize: 14, color: '#444' },

    signInBtn: { backgroundColor: '#111', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    signInBtnDisabled: { opacity: 0.6 },
    signInText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#eee' },
    dividerText: { fontSize: 11, color: '#aaa', marginHorizontal: 12, fontWeight: '600' },

    socialRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
    socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e5e5e5', borderRadius: 12, height: 50, gap: 8 },
    socialIcon: { fontSize: 18, fontWeight: '800', color: '#DB4437' },
    socialText: { fontSize: 15, fontWeight: '600', color: '#333' },

    signupRow: { flexDirection: 'row', justifyContent: 'center' },
    signupText: { fontSize: 14, color: '#666' },
    signupLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
});