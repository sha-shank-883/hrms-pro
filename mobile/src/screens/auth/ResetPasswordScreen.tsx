import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, Key, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { authService } from '../../api';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const [form, setForm] = useState({ email: '', password: '', token: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async () => {
    if (!form.email || !form.password || !form.token) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword({ 
        email: form.email, 
        password: form.password, 
        token: form.token 
      });
      Alert.alert('Success', 'Password reset successfully');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', 'Invalid token or system error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#1e293b" size={24} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Key color="#4f46e5" size={64} />
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your reset token and new password
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrap}>
                <Mail size={20} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="you@company.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(v) => setForm(p => ({ ...p, email: v }))}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reset Token</Text>
              <View style={styles.inputWrap}>
                <Key size={20} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="6-digit token"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  value={form.token}
                  onChangeText={(v) => setForm(p => ({ ...p, token: v }))}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrap}>
                <Lock size={20} color="#94a3b8" />
                <TextInput
                  style={styles.input}
                  placeholder="New password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={form.password}
                  onChangeText={(v) => setForm(p => ({ ...p, password: v }))}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.resetBtn}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.resetBtnText}>RESET PASSWORD</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.secondaryBtnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 30 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginBottom: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 16 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#1e293b',
  },
  resetBtn: {
    backgroundColor: '#4f46e5',
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  resetBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { marginTop: 24, alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, color: '#4f46e5', fontWeight: '600' },
});

