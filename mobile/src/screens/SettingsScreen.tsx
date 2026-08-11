import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, StatusBar, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Settings as SettingsIcon, Bell, Moon, Shield, Globe, Smartphone, LogOut, ChevronRight, Fingerprint, RefreshCw, ArrowLeft, Palette, Lock, Eye, Cloud, Info, UserCheck, Zap, HardDrive, Cpu, ExternalLink, Activity, Terminal, Layers, LayoutPanelLeft, Boxes, Power 
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SettingRow = ({ icon: Icon, color, label, sublabel, rightElement, onPress, isLast, colors }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
    style={[styles.row, isLast && { borderBottomWidth: 0 }]}
  >
    <View style={[styles.rowIcon, { backgroundColor: colors.surface }]}>
      <Icon size={20} color={color || colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {sublabel && <Text style={[styles.rowSublabel, { color: colors.subtext }]}>{sublabel}</Text>}
    </View>
    {rightElement || <ChevronRight size={18} color={colors.border} />}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { user, logout, refreshSettings } = useAuth();
  const { colors, isDark } = useTheme();
  const [syncing, setSyncing] = useState(false);
  
  const [preferences, setPreferences] = useState({
    pushNotifications: true,
    emailNotifications: false,
    darkMode: isDark,
    biometrics: true,
  });

  const toggleSwitch = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRefresh = async () => {
    setSyncing(true);
    try {
      const success = await refreshSettings();
      if (success) Alert.alert('Sync Successful', 'Global application preferences have been synchronized.');
    } catch (error) {
      Alert.alert('Sync Failed', 'Unable to connect to the configuration server. Please check your connection.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to exit your current session?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: logout }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <TouchableOpacity style={styles.syncBtn} onPress={handleRefresh}>
            {syncing ? <ActivityIndicator size="small" color={colors.primary} /> : <RefreshCw size={22} color={colors.primary} />}
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* User Quick Access */}
        <Animated.View entering={FadeInDown.delay(100)} style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatarWrap, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user?.first_name?.[0]}{user?.last_name?.[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.first_name} {user?.last_name}</Text>
            <Text style={[styles.userEmail, { color: colors.subtext }]}>{user?.email}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: colors.surface }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>{user?.role || 'User'}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>APPLICATION PREFERENCES</Text>
            <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow 
              icon={Bell} color="#6366f1" 
              label="Push Notifications" 
              sublabel="Instant alerts for critical updates"
              rightElement={<Switch value={preferences.pushNotifications} onValueChange={() => toggleSwitch('pushNotifications')} trackColor={{ true: '#10b981', false: colors.border }} thumbColor="#fff" />}
              colors={colors}
            />
            <SettingRow 
              icon={Palette} color="#8b5cf6" 
              label="Interface Theme" 
              sublabel="Light or Dark mode appearance"
              rightElement={<Switch value={preferences.darkMode} onValueChange={() => toggleSwitch('darkMode')} trackColor={{ true: '#8b5cf6', false: colors.border }} thumbColor="#fff" />}
              colors={colors}
            />
            <SettingRow 
              icon={Globe} color="#3b82f6" 
              label="System Language" 
              sublabel="English (United States)"
              isLast
              colors={colors}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>SECURITY & PRIVACY</Text>
            <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingRow 
              icon={Fingerprint} color="#10b981" 
              label="Biometric Entry" 
              sublabel="FaceID or TouchID authentication"
              rightElement={<Switch value={preferences.biometrics} onValueChange={() => toggleSwitch('biometrics')} trackColor={{ true: '#10b981', false: colors.border }} thumbColor="#fff" />}
              colors={colors}
            />
            <SettingRow 
              icon={Lock} color="#ef4444" 
              label="Credentials" 
              sublabel="Update your security password"
              colors={colors}
            />
            <SettingRow 
              icon={Zap} color="#f59e0b" 
              label="Active Sessions" 
              sublabel="Manage devices logged in"
              isLast
              colors={colors}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>SYSTEM INFORMATION</Text>
            <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>App Version</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>2.5.0 (Modernized)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.subtext }]}>Deployment</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>Stable Production</Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={() => Alert.alert('Legal', 'Standard HRMS Privacy Policy applies.')} style={[styles.legalLink, { borderTopColor: colors.border }]}>
              <Text style={[styles.legalText, { color: colors.primary }]}>Legal Documentation & Privacy Policy</Text>
              <ExternalLink size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <TouchableOpacity 
          onPress={handleLogout}
          style={[styles.logoutBtn, { borderColor: colors.error + '40' }]}
          activeOpacity={0.8}
        >
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Disconnect Session</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.subtext }]}>HRMS PRO — PROFESSIONAL EDITION 2025</Text>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  syncBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  body: { flex: 1, padding: 20 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 28, borderWidth: 1, marginBottom: 25 },
  avatarWrap: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 18, fontWeight: '800' },
  userEmail: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '800' },

  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, paddingLeft: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  headerLine: { flex: 1, height: 1 },
  
  card: { borderRadius: 28, paddingHorizontal: 20, paddingVertical: 4, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'transparent', gap: 16 },
  rowIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '800' },
  rowSublabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  infoBox: { paddingVertical: 12, gap: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13, fontWeight: '700' },
  infoValue: { fontSize: 13, fontWeight: '800' },
  legalLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderTopWidth: 1, marginTop: 10 },
  legalText: { fontSize: 12, fontWeight: '800' },

  logoutBtn: { height: 58, borderRadius: 18, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 5 },
  logoutText: { fontSize: 15, fontWeight: '800' },

  footer: { alignItems: 'center', marginTop: 30 },
  footerText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
});
