import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff, Lock, Mail, Building2, Shield, ChevronRight, Fingerprint } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();

  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!tenantId.trim() || !email.trim() || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await login(tenantId.trim(), email.trim().toLowerCase(), password);
      if (res?.requires2FA) {
        navigation.navigate('TwoFactor', { userId: res.userId, tenantId: tenantId.trim() });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary + '15' }]}>
              <Shield size={48} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Unified Access</Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>Authenticate to enter the enterprise core</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Organization Domain</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Building2 size={20} color={colors.primary} strokeWidth={2} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="domain-name"
                  placeholderTextColor={colors.subtext + '80'}
                  value={tenantId}
                  onChangeText={setTenantId}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Identity Identifier</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Mail size={20} color={colors.primary} strokeWidth={2} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="user@enterprise.com"
                  placeholderTextColor={colors.subtext + '80'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Security Key</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                   <Text style={[styles.forgotText, { color: colors.primary }]}>Recovery?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Lock size={20} color={colors.primary} strokeWidth={2} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.subtext + '80'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff size={20} color={colors.subtext} /> : <Eye size={20} color={colors.subtext} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Initialize Session</Text>
                  <ChevronRight size={20} color="#fff" strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.subtext }]}>SECURE BIOMETRICS</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity style={[styles.bioBtn, { borderColor: colors.border }]} activeOpacity={0.7}>
               <Fingerprint size={28} color={colors.primary} />
               <Text style={[styles.bioText, { color: colors.text }]}>Use Passkey</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.subtext }]}>
                New personnel? <Text style={[styles.footerLink, { color: colors.primary }]} onPress={() => navigation.navigate('Register')}>Request Uplink</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 32, paddingVertical: 40, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  logoContainer: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', textAlign: 'center', letterSpacing: -1 },
  subtitle: { fontSize: 16, textAlign: 'center', marginTop: 10, fontWeight: '600', paddingHorizontal: 20 },
  
  form: { width: '100%' },
  inputGroup: { marginBottom: 24 },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 13, fontWeight: '800', marginBottom: 12, letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 64,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
  },
  eyeBtn: { padding: 4 },
  forgotText: { fontSize: 13, fontWeight: '800', marginBottom: 12 },
  
  loginBtn: {
    height: 64,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
  },
  loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 32 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  
  bioBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 64, borderRadius: 24, borderWidth: 1 },
  bioText: { fontSize: 16, fontWeight: '800' },

  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 14, fontWeight: '600' },
  footerLink: { fontWeight: '800' },
});
