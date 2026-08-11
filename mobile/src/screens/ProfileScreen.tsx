import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, RefreshControl, StatusBar, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Mail, Phone, MapPin, Briefcase, Calendar, Shield, Edit2, X, LogOut, User as UserIcon, History, Award, BookOpen, Fingerprint, ChevronRight, Check, Camera, Building, Clock, Info, Zap, ShieldAlert, Database, UserCheck, Activity, ShieldHalf, Layout, ArrowLeft, MoreVertical, Smartphone
} from 'lucide-react-native';
import { authService, employeeService, handleApiError } from '../api';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, SlideInUp, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const TABS = [
  { id: 'info', label: 'Overview', Icon: UserIcon },
  { id: 'history', label: 'Timeline', Icon: History },
  { id: 'security', label: 'Privacy', Icon: Shield },
];

const InfoBlock = ({ icon: Icon, label, value, color, colors }: { icon: React.ComponentType<{ size: number; color?: string }>; label: string; value?: string | number | null; color?: string; colors: Record<string, string> }) => (
  <View style={styles.infoBlock}>
    <View style={[styles.infoIconBox, { backgroundColor: colors.surface }]}>
      <Icon size={18} color={color || colors.primary} />
    </View>
    <View style={styles.infoContent}>
      <Text style={[styles.infoLabel, { color: colors.subtext }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value || 'Not provided'}</Text>
    </View>
  </View>
);

export default function ProfileScreen({ route }: { route: { params?: { userId?: number } } }) {
  const navigation = useNavigation();
  const { userId } = route.params || {};
  const { colors, isDark } = useTheme();
  const { user, loadUser, logout } = useAuth();
  
  const isMe = !userId || String(userId) === String(user?.user_id) || String(userId) === String(user?.id);
  
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', address: '', about_me: ''
  });

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      if (isMe) {
        const res = await authService.getProfile();
        data = res.data;
      } else {
        const res = await employeeService.getEmployeeById(userId);
        data = res.data;
      }
      
      const p = data.data || data.user || data;
      setProfile(p);
      if (isMe) {
        setForm({
          first_name: p?.first_name || '',
          last_name: p?.last_name || '',
          phone: p?.phone || '',
          address: p?.address || '',
          about_me: p?.about_me || '',
        });
      }
    } catch (err) {
      console.log('Profile loading failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [isMe, userId]);

  useEffect(() => { loadProfileData(); }, [loadProfileData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const handleUpdate = async () => {
    if (!profile?.employee_id) return Alert.alert('Error', 'No associated employee record found.');
    
    setSaving(true);
    try {
      await employeeService.updateEmployee(profile.employee_id, form);
      await loadUser();
      await loadProfileData();
      setEditModal(false);
      Alert.alert('Success', 'Profile information updated.');
    } catch (err) {
      Alert.alert('Update Failed', handleApiError(err as Record<string, any>).message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit your current session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || '??';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{isMe ? 'Profile' : 'Member Detail'}</Text>
          <TouchableOpacity style={styles.moreBtn} onPress={isMe ? handleLogout : undefined}>
            {isMe ? <LogOut size={22} color={colors.error} /> : <MoreVertical size={22} color={colors.text} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.profileHero}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatarWrap, { borderColor: colors.primary + '20' }]}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              {isMe && (
                <TouchableOpacity style={[styles.cameraCircle, { backgroundColor: colors.card, shadowColor: '#000' }]} activeOpacity={0.8}>
                  <Camera size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>{profile?.first_name} {profile?.last_name}</Text>
            <View style={styles.roleRow}>
              <Briefcase size={14} color={colors.subtext} />
              <Text style={[styles.userRole, { color: colors.subtext }]}>{profile?.position || 'Associate'}</Text>
            </View>
            <View style={[styles.idBadge, { backgroundColor: colors.surface }]}>
              <Text style={[styles.idBadgeText, { color: colors.primary }]}>EMP-{profile?.employee_id || '0000'}</Text>
            </View>
          </View>

          <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
            {TABS.map((t) => (
              <TouchableOpacity 
                key={t.id}
                onPress={() => setActiveTab(t.id)}
                style={[styles.tab, activeTab === t.id && [styles.tabActive, { backgroundColor: colors.card }]]}
              >
                <Text style={[styles.tabText, { color: colors.subtext }, activeTab === t.id && { color: colors.primary }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── MODULE CONTENT ── */}
        <View style={styles.body}>
          {activeTab === 'info' && (
            <Animated.View entering={FadeInDown} style={styles.pane}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.subtext }]}>CONTACT INFO</Text>
                <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
                {isMe && (
                  <TouchableOpacity onPress={() => setEditModal(true)}>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '800' }}>EDIT</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <InfoBlock icon={Mail} label="Professional Email" value={profile?.email} color={colors.primary} colors={colors} />
                <InfoBlock icon={Phone} label="Mobile Line" value={profile?.phone} color="#10b981" colors={colors} />
                <InfoBlock icon={MapPin} label="Primary Address" value={profile?.address} color="#ef4444" colors={colors} />
              </View>

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.subtext }]}>OPERATIONAL DATA</Text>
                <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
              </View>

              <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <InfoBlock icon={Building} label="Department" value={profile?.department_name} color="#6366f1" colors={colors} />
                <InfoBlock icon={Award} label="Corporate Rank" value={profile?.position} color="#f59e0b" colors={colors} />
                <InfoBlock icon={Clock} label="Tenure Start" value={profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'} color="#06b6d4" colors={colors} />
              </View>

              {profile?.about_me && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>PROFESSIONAL BIO</Text>
                    <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
                  </View>
                  <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.aboutText, { color: colors.text }]}>{profile.about_me}</Text>
                  </View>
                </>
              )}
            </Animated.View>
          )}

          {activeTab === 'history' && (
            <Animated.View entering={FadeInDown} style={styles.pane}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.subtext }]}>CAREER TIMELINE</Text>
                <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.timelineContainer}>
                <View style={[styles.timelineRail, { backgroundColor: colors.border }]} />
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.primary, borderColor: colors.background }]} />
                  <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.timelineRole, { color: colors.text }]}>{profile?.position || 'Associate'}</Text>
                    <Text style={[styles.timelineDept, { color: colors.primary }]}>{profile?.department_name || 'Organization'}</Text>
                    <View style={styles.timelineDateRow}>
                      <Calendar size={12} color={colors.subtext} />
                      <Text style={[styles.timelineDate, { color: colors.subtext }]}>
                        Joined {profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {activeTab === 'security' && (
            <Animated.View entering={FadeInDown} style={styles.pane}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.subtext }]}>SECURITY PROTOCOLS</Text>
                <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
              </View>

              <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.securityItem}>
                  <View style={styles.securityLead}>
                    <View style={[styles.securityIconWrap, { backgroundColor: colors.surface }]}>
                      <Smartphone size={20} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.securityLabel, { color: colors.text }]}>MFA Authentication</Text>
                      <Text style={[styles.securitySub, { color: colors.subtext }]}>{profile?.is_two_factor_enabled ? 'Active protection' : 'Vulnerable'}</Text>
                    </View>
                  </View>
                  <Switch 
                    value={!!profile?.is_two_factor_enabled}
                    onValueChange={() => Alert.alert('Secure Access', 'Modify these settings in the Global Security module.')}
                    trackColor={{ false: colors.border, true: '#10b981' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              <TouchableOpacity style={[styles.dangerBtn, { borderColor: colors.error + '40' }]} onPress={handleLogout}>
                <LogOut size={20} color={colors.error} />
                <Text style={[styles.dangerBtnText, { color: colors.error }]}>Disconnect Session</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setEditModal(false)} />
            <Animated.View entering={SlideInUp} style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Update Profile</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.subtext }]}>Modify your professional data</Text>
                </View>
                <TouchableOpacity onPress={() => setEditModal(false)} style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGrid}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>FIRST NAME</Text>
                    <TextInput 
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
                      value={form.first_name} 
                      onChangeText={t => setForm({...form, first_name: t})}
                      placeholderTextColor={colors.subtext}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>LAST NAME</Text>
                    <TextInput 
                      style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
                      value={form.last_name} 
                      onChangeText={t => setForm({...form, last_name: t})}
                      placeholderTextColor={colors.subtext}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>MOBILE LINE</Text>
                  <TextInput 
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
                    value={form.phone} 
                    keyboardType="phone-pad"
                    onChangeText={t => setForm({...form, phone: t})}
                    placeholder="+1 000 000 000"
                    placeholderTextColor={colors.subtext}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>OFFICE ADDRESS</Text>
                  <TextInput 
                    style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
                    multiline
                    value={form.address} 
                    onChangeText={t => setForm({...form, address: t})}
                    placeholderTextColor={colors.subtext}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>PERSONNEL PROFILE</Text>
                  <TextInput 
                    style={[styles.textArea, { minHeight: 120, backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]} 
                    multiline
                    numberOfLines={4}
                    value={form.about_me} 
                    onChangeText={t => setForm({...form, about_me: t})}
                    placeholder="Short professional summary..."
                    placeholderTextColor={colors.subtext}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.7 }]}
                  onPress={handleUpdate}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Commit Changes</Text>}
                </TouchableOpacity>
                <View style={{ height: 40 }} />
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  moreBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingTop: 20 },
  profileHero: { paddingHorizontal: 20, marginBottom: 25 },
  avatarSection: { alignItems: 'center', marginBottom: 25 },
  avatarWrap: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, padding: 4, marginBottom: 16 },
  avatarCircle: { flex: 1, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 42, fontWeight: '800' },
  cameraCircle: { position: 'absolute', bottom: 0, right: 0, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  userName: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  userRole: { fontSize: 15, fontWeight: '700' },
  idBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  idBadgeText: { fontSize: 11, fontWeight: '800' },

  tabContainer: { flexDirection: 'row', borderRadius: 16, padding: 6 },
  tab: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '800' },

  body: { paddingHorizontal: 20 },
  pane: { gap: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  headerLine: { flex: 1, height: 1 },

  detailsCard: { borderRadius: 28, padding: 24, borderWidth: 1, gap: 20 },
  infoBlock: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  infoIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '800', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '700' },
  aboutText: { fontSize: 15, lineHeight: 24, fontWeight: '600' },

  timelineContainer: { paddingLeft: 4, marginTop: 10 },
  timelineRail: { position: 'absolute', left: 16, top: 0, bottom: 0, width: 2 },
  timelineItem: { flexDirection: 'row', gap: 24, marginBottom: 25 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 4, zIndex: 2, marginTop: 6 },
  timelineCard: { flex: 1, borderRadius: 24, padding: 20, borderWidth: 1 },
  timelineRole: { fontSize: 16, fontWeight: '800' },
  timelineDept: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  timelineDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  timelineDate: { fontSize: 12, fontWeight: '700' },

  securityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  securityLead: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  securityIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  securityLabel: { fontSize: 15, fontWeight: '800' },
  securitySub: { fontSize: 12, fontWeight: '700', marginTop: 1 },

  dangerBtn: { height: 58, borderRadius: 18, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
  dangerBtnText: { fontSize: 15, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, height: height * 0.88 },
  modalHeader: { padding: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 28, fontWeight: '800' },
  modalSubtitle: { fontSize: 15, marginTop: 4, fontWeight: '600' },
  modalCloseBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingHorizontal: 28 },
  inputGrid: { flexDirection: 'row', gap: 16 },
  inputGroup: { marginBottom: 20, flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: '800', marginBottom: 10, marginLeft: 4, letterSpacing: 0.5 },
  input: { borderRadius: 16, paddingHorizontal: 18, height: 58, fontSize: 15, fontWeight: '700', borderWidth: 1.5 },
  textArea: { borderRadius: 20, padding: 18, fontSize: 15, fontWeight: '700', minHeight: 90, borderWidth: 1.5, textAlignVertical: 'top' },
  saveBtn: { height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
