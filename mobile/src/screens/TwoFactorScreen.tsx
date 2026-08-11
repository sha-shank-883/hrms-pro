import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, ArrowLeft, Key, Lock, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function TwoFactorScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { verify2FA } = useAuth();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const inputRef = useRef<TextInput>(null);
  
  const { userId, tenantId } = route.params || {};

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
      if (tenantId) {
        await SecureStore.setItemAsync('tenantId', tenantId);
      }
      await verify2FA(userId, code);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Verification failed';
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
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface }]}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>

          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Shield color={colors.primary} size={48} strokeWidth={1.5} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Security Verification</Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              Access to this terminal requires a secondary authentication sequence. Enter the 6-digit code from your authenticator app.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.form}>
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
                  <View key={i} style={[
                    styles.codeBox, 
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    code.length === i && { borderColor: colors.primary, borderWidth: 2 }
                  ]}>
                    <Text style={[styles.codeText, { color: colors.text }]}>{code[i] || ''}</Text>
                  </View>
                ))}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.verifyBtn, { backgroundColor: colors.primary }]}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.verifyBtnText}>AUTHORIZE ACCESS</Text>
                  <ChevronRight size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.helpBtn} 
              onPress={() => Alert.alert('Nexus Help', 'Contact your System Administrator if you have lost access to your authenticator device.')}
            >
              <Text style={[styles.helpText, { color: colors.primary }]}>Lost Authenticator Access?</Text>
            </TouchableOpacity>

            <View style={styles.footerInfo}>
               <Lock size={12} color={colors.subtext} />
               <Text style={[styles.footerText, { color: colors.subtext }]}>ENCRYPTED HANDSHAKE ACTIVE</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 32 },
  backBtn: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  header: { alignItems: 'center', marginBottom: 48 },
  iconBox: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 24, fontWeight: '500' },
  form: { width: '100%' },
  inputSection: { marginBottom: 40 },
  hiddenInput: { position: 'absolute', width: 0, height: 0, opacity: 0 },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  codeBox: {
    width: (width - 64 - 50) / 6,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: { fontSize: 28, fontWeight: '800' },
  verifyBtn: {
    height: 64,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  helpBtn: { marginTop: 32, alignItems: 'center' },
  helpText: { fontSize: 14, fontWeight: '700' },
  
  footerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 48, opacity: 0.4 },
  footerText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
});
