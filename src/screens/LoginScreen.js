import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
    Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../services/authService';

const COLORS = {
    primary: '#1F2937',
    secondary: '#10B981',
    accent: '#059669',
    background: '#f9fafb',
    surface: '#FFFFFF',
    text: '#111827',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
};

export default function LoginScreen({ navigation }) {
    const [credential, setCredential] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [credentialType, setCredentialType] = useState(''); // 'email', 'phone', 'username'

    // Detect credential type
    const detectCredentialType = (value) => {
        if (!value.trim()) return '';
        
        // Check if email
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'email';
        }
        
        // Check if phone (10 digits)
        if (/^[0-9]{10}$/.test(value)) {
            return 'phone';
        }
        
        // Otherwise username
        if (value.length >= 3 && /^[a-zA-Z0-9_.-]+$/.test(value)) {
            return 'username';
        }
        
        return '';
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!credential.trim()) {
            newErrors.credential = 'Email, phone, or username required';
        } else {
            const type = detectCredentialType(credential);
            if (!type) {
                newErrors.credential = 'Enter valid email, 10-digit phone, or username';
            }
        }
        
        if (!password) {
            newErrors.password = 'Password required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const type = detectCredentialType(credential);
            
            // Call login with credential (backend handles any format)
            const response = await loginUser(credential, password);
            const token = response?.data?.token;

            if (!token?.accessToken) {
                Alert.alert('Login Failed', response?.message || 'Invalid credentials.');
                return;
            }

            // Store auth data
            await AsyncStorage.setItem('authToken', token.accessToken);
            await AsyncStorage.setItem('user', JSON.stringify(response.data));

            if (Array.isArray(response.data.formRights)) {
                await AsyncStorage.setItem('permissions', JSON.stringify(response.data.formRights));
            }

            // Remember credential if checked
            if (remember) {
                await AsyncStorage.setItem('rememberedCredential', credential);
                await AsyncStorage.setItem('credentialType', type);
            } else {
                await AsyncStorage.removeItem('rememberedCredential');
                await AsyncStorage.removeItem('credentialType');
            }

            navigation.replace('Main');
        } catch (err) {
            console.error('Login error:', err);
            Alert.alert('Error', err?.message || 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCredentialChange = (value) => {
        setCredential(value);
        const type = detectCredentialType(value);
        setCredentialType(type);
        
        if (errors.credential) {
            setErrors(e => ({ ...e, credential: undefined }));
        }
    };

    const getCredentialLabel = () => {
        if (!credentialType) return 'Email, Phone, or Username';
        if (credentialType === 'email') return '📧 Email';
        if (credentialType === 'phone') return '📱 Phone';
        return '👤 Username';
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView 
                    contentContainerStyle={{ flexGrow: 1 }} 
                    keyboardShouldPersistTaps="handled" 
                    showsVerticalScrollIndicator={false}
                >
                    
                    {/* Header Section */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <View style={styles.logoBg}>
                                <Text style={styles.logoText}>🚛</Text>
                            </View>
                        </View>
                        <Text style={styles.brandName}>FleetBharat</Text>
                        <Text style={styles.brandTagline}>Smart Fleet Management</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        
                        {/* Title */}
                        <Text style={styles.formTitle}>Welcome Back</Text>
                        <Text style={styles.formSubtitle}>Sign in to your account</Text>

                        {/* Credential Input (Email/Phone/Username) */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>Email, Mobile, or Username</Text>
                                {credentialType && (
                                    <Text style={styles.credentialTypeHint}>{getCredentialLabel()}</Text>
                                )}
                            </View>
                            <View style={[
                                styles.inputBox,
                                errors.credential && styles.inputBoxError,
                                credential && !errors.credential && credentialType && styles.inputBoxSuccess,
                            ]}>
                                <TextInput
                                    style={styles.inputField}
                                    placeholderTextColor={COLORS.textMuted}
                                    value={credential}
                                    onChangeText={handleCredentialChange}
                                    autoCapitalize="none"
                                    autoComplete="off"
                                    editable={!loading}
                                />
                                {credential && !errors.credential && credentialType && (
                                    <Text style={styles.inputIcon}>✓</Text>
                                )}
                            </View>
                            {errors.credential && (
                                <Text style={styles.errorMsg}>{errors.credential}</Text>
                            )}
                            
                            {/* Hint Text */}
                            {!credentialType && credential && (
                                <Text style={styles.hintText}>
                                    💡 Use email (user@example.com), phone (10 digits), or username
                                </Text>
                            )}
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>Password</Text>
                                <TouchableOpacity activeOpacity={0.6}>
                                    <Text style={styles.forgotBtn}>Forgot?</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={[
                                styles.inputBox,
                                errors.password && styles.inputBoxError,
                                password && !errors.password && styles.inputBoxSuccess,
                            ]}>
                                <TextInput
                                    style={styles.inputField}
                                    placeholderTextColor={COLORS.textMuted}
                                    value={password}
                                    onChangeText={(v) => {
                                        setPassword(v);
                                        if (errors.password) setErrors(e => ({ ...e, password: undefined }));
                                    }}
                                    secureTextEntry={!showPassword}
                                    editable={!loading}
                                    onSubmitEditing={handleLogin}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                >
                                    <Text style={styles.eyeIcon}>
                                        {showPassword ? '👁' : '👁‍🗨'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {errors.password && (
                                <Text style={styles.errorMsg}>{errors.password}</Text>
                            )}
                        </View>

                        {/* Remember Me */}
                        <TouchableOpacity
                            style={styles.rememberBox}
                            onPress={() => setRemember(!remember)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, remember && styles.checkboxActive]}>
                                {remember && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.rememberText}>Remember me for 30 days</Text>
                        </TouchableOpacity>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            style={[styles.signInBtn, loading && styles.signInBtnLoading]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.surface} size="small" />
                            ) : (
                                <Text style={styles.signInText}>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        {/* OR Divider */}
                        {/* <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.divider} />
                        </View> */}

                        {/* Social Buttons */}
                        {/* <View style={styles.socialContainer}>
                            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
                                <Text style={styles.socialBtnText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
                                <Text style={styles.socialBtnText}>Apple</Text>
                            </TouchableOpacity>
                        </View> */}

                        {/* Sign Up Link */}
                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Don't have an account? </Text>
                            <TouchableOpacity activeOpacity={0.6}>
                                <Text style={styles.signupLink}>Sign up free</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <Text style={styles.versionText}>v2.0 • India</Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    /* Header */
    header: {
        paddingVertical: 48,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        marginBottom: 24,
    },
    logoBg: {
        width: 72,
        height: 72,
        borderRadius: 18,
        backgroundColor: COLORS.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    logoText: {
        fontSize: 36,
    },
    brandName: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    brandTagline: {
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: '500',
    },

    /* Form Container */
    formContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 32,
        justifyContent: 'center',
    },
    formTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 8,
    },
    formSubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: '500',
        marginBottom: 32,
    },

    /* Input Group */
    inputGroup: {
        marginBottom: 24,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    credentialTypeHint: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    forgotBtn: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
    },
    inputBoxError: {
        borderColor: COLORS.error,
        backgroundColor: 'rgba(239, 68, 68, 0.03)',
    },
    inputBoxSuccess: {
        borderColor: COLORS.success,
    },
    inputField: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        fontWeight: '500',
        paddingVertical: 0,
    },
    inputIcon: {
        fontSize: 16,
        color: COLORS.success,
        marginLeft: 8,
    },
    eyeIcon: {
        fontSize: 18,
        marginLeft: 8,
    },
    errorMsg: {
        fontSize: 12,
        color: COLORS.error,
        fontWeight: '600',
        marginTop: 8,
    },
    hintText: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontStyle: 'italic',
        marginTop: 8,
    },

    /* Remember Me */
    rememberBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 28,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: COLORS.surface,
    },
    checkboxActive: {
        borderColor: COLORS.secondary,
        backgroundColor: COLORS.secondary,
    },
    checkmark: {
        color: COLORS.surface,
        fontSize: 12,
        fontWeight: '800',
    },
    rememberText: {
        fontSize: 13,
        color: COLORS.textMuted,
        fontWeight: '500',
    },

    /* Sign In Button */
    signInBtn: {
        height: 56,
        borderRadius: 12,
        backgroundColor: COLORS.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    signInBtnLoading: {
        opacity: 0.9,
    },
    signInText: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.surface,
        letterSpacing: 0.3,
    },

    /* Divider */
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: '700',
        marginHorizontal: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    /* Social Buttons */
    socialContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 28,
    },
    socialBtn: {
        flex: 1,
        height: 50,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
    },
    socialBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    /* Sign Up */
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    signupText: {
        fontSize: 13,
        color: COLORS.textMuted,
    },
    signupLink: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.secondary,
    },

    /* Footer */
    versionText: {
        fontSize: 11,
        color: COLORS.textMuted,
        textAlign: 'center',
        fontWeight: '500',
    },
});