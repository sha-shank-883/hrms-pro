import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Mail, ArrowLeft, Shield } from 'lucide-react-native';
import { authService } from '../../api';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordReset({ email });
      Alert.alert('Success', 'Recovery link sent to your email');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', 'Email not found or system error');
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
            <Shield color="#4f46e5" size={64} />
            <Text style={styles.title}>Recovery</Text>
            <Text style={styles.subtitle}>
              Enter your email to reset your password
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
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.resetBtn}
              onPress={requestReset}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.resetBtnText}>SEND LINK</Text>}
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
  inputGroup: { marginBottom: 24 },
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

