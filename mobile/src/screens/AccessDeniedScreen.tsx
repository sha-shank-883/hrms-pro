import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldX, ArrowLeft, Lock, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function AccessDeniedScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(800)} style={styles.content}>
           <View style={[styles.iconBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ShieldX color={colors.error} size={64} strokeWidth={1.5} />
              <View style={[styles.pulseRing, { borderColor: colors.error }]} />
           </View>
           
           <Text style={[styles.title, { color: colors.text }]}>Clearance Required</Text>
           
           <Text style={[styles.subtitle, { color: colors.subtext }]}>
             Your current security credentials do not permit access to this encrypted operations module.
           </Text>

           <View style={[styles.protocolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.protocolHeader}>
                 <Lock size={14} color={colors.error} />
                 <Text style={[styles.protocolLabel, { color: colors.error }]}>PROTOCOL 403: FORBIDDEN</Text>
              </View>
              <Text style={[styles.protocolText, { color: colors.text }]}>
                Access is restricted to authorized administrative personnel. Coordinate with your System Administrator to elevate your clearance tier.
              </Text>
           </View>

           <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: colors.text }]}
                onPress={() => navigation.goBack()}
              >
                 <ArrowLeft size={20} color={colors.background} />
                 <Text style={[styles.primaryBtnText, { color: colors.background }]}>Return to Dashboard</Text>
              </TouchableOpacity>
              
              <View style={styles.footerInfo}>
                 <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                 <Text style={[styles.footerText, { color: colors.subtext }]}>SECURE SESSION ACTIVE</Text>
              </View>
           </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  content: { alignItems: 'center' },
  
  iconBox: { width: 120, height: 120, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 40, borderWidth: 1 },
  pulseRing: { position: 'absolute', width: 140, height: 140, borderRadius: 52, borderWidth: 1, opacity: 0.1 },
  
  title: { fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 16, letterSpacing: -1 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 26, fontWeight: '500', marginBottom: 40 },

  protocolCard: { width: '100%', borderRadius: 28, padding: 24, borderWidth: 1, marginBottom: 48 },
  protocolHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  protocolLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  protocolText: { fontSize: 13, lineHeight: 20, fontWeight: '600' },

  actions: { width: '100%', alignItems: 'center', gap: 24 },
  primaryBtn: { width: '100%', height: 64, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  primaryBtnText: { fontSize: 16, fontWeight: '900' },
  
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  footerText: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
});
