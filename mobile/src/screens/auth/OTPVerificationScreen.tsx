import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Dimensions, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

type RouteParams = {
  params: {
    userId: string;
  };
};

export default function OTPVerificationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const { verify2FA } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 500);
  }, []);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const userId = route.params?.userId;
      if (!userId) throw new Error('Missing User ID');
      await verify2FA(userId, code.trim());
    } catch (error) {
      Alert.alert('Error', 'Verification failed');
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
            <Lock color="#4f46e5" size={64} />
            <Text style={styles.title}>Verification</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to your device
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputSection}>
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={() => inputRef.current?.focus()}
                style={styles.codeRow}
              >
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={[styles.codeBox, code.length === i && styles.codeBoxActive]}>
                    <Text style={styles.codeText}>{code[i] || ''}</Text>
                  </View>
                ))}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.verifyBtn}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyBtnText}>AUTHORIZE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.helpBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.helpText}>Back to Login</Text>
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
  inputSection: { marginBottom: 40 },
  hiddenInput: { position: 'absolute', width: 0, height: 0, opacity: 0 },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  codeBox: {
    width: (width - 60 - 50) / 6,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: { borderColor: '#4f46e5', borderWidth: 2 },
  codeText: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  verifyBtn: {
    backgroundColor: '#4f46e5',
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  helpBtn: { marginTop: 24, alignItems: 'center' },
  helpText: { fontSize: 14, color: '#4f46e5', fontWeight: '600' },
});

