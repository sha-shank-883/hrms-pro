import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { leaveService, handleApiError } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, SlideInDown, Layout as ReanimatedLayout } from 'react-native-reanimated';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  X,
  CalendarDays,
  Info,
  Users,
  User,
  Database,
  ChevronRight,
  ClipboardList,
  AlertCircle
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const LEAVE_TYPES = ['Sick Leave', 'Annual Leave', 'Casual Leave', 'Maternity', 'Unpaid'];
const TODAY = new Date().toISOString().split('T')[0];

const statusMap: Record<string, { color: string; bg: string; label: string }> = {
  approved: { color: '#10b981', bg: '#ecfdf5', label: 'Approved' },
  rejected: { color: '#ef4444', bg: '#fef2f2', label: 'Rejected' },
  pending: { color: '#f59e0b', bg: '#fffbeb', label: 'Pending' },
};

const BalanceCard = React.memo(({ bal, colors }: { bal: { type: string; total: number; used: number; remaining: number; color: string }; colors: Record<string, string> }) => {
  const pct = bal.total > 0 ? Math.round((bal.used / bal.total) * 100) : 0;
  return (
    <View style={[styles.balCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.balIndicator, { backgroundColor: bal.color }]} />
      <Text style={[styles.balVal, { color: colors.text }]}>{bal.remaining}</Text>
      <Text style={[styles.balLabel, { color: colors.subtext }]}>{bal.type}</Text>
      <View style={[styles.balRail, { backgroundColor: colors.border }]}>
        <View style={[styles.balProgress, { width: `${pct}%` as const, backgroundColor: bal.color }]} />
      </View>
      <View style={styles.balMeta}>
        <Text style={[styles.balMetaText, { color: colors.subtext }]}>{bal.used}/{bal.total} Days Used</Text>
      </View>
    </View>
  );
});

const LeaveRow = React.memo(({ leave, isManager, onUpdate, index, colors }: { leave: Record<string, any>; isManager: boolean; onUpdate: (id: number, status: 'approved' | 'rejected') => void; index: number; colors: Record<string, string> }) => {
  const s = statusMap[leave.status] || statusMap.pending;
  return (
    <Animated.View entering={FadeInDown.delay(index * 60)} layout={ReanimatedLayout.springify()}>
      <View style={[styles.leaveCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.leaveHeader}>
          <View style={styles.leaveTypeInfo}>
            {isManager && (
              <View style={[styles.employeeBadge, { backgroundColor: colors.primary + '10' }]}>
                <User size={10} color={colors.primary} strokeWidth={3} />
                <Text style={[styles.employeeName, { color: colors.primary }]}>{leave.employee_name || 'Employee'}</Text>
              </View>
            )}
            <Text style={[styles.leaveTitle, { color: colors.text }]}>{leave.leave_type}</Text>
          </View>
          <View style={[styles.statusTag, { backgroundColor: s.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: s.color }]} />
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>

        <View style={styles.dateInfo}>
          <CalendarDays size={14} color={colors.subtext} strokeWidth={2} />
          <Text style={[styles.dateRange, { color: colors.subtext }]}>
            {new Date(leave.start_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
            {' — '}
            {new Date(leave.end_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </View>

        {leave.reason && (
          <View style={[styles.reasonBlock, { backgroundColor: colors.background }]}>
            <Text style={[styles.reasonText, { color: colors.subtext }]} numberOfLines={2}>{leave.reason}</Text>
          </View>
        )}

        {isManager && leave.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => onUpdate(leave.leave_id || leave.id, 'rejected')}
              style={[styles.actionBtnSecondary, { borderColor: '#fee2e2' }]}
            >
              <XCircle size={16} color="#ef4444" strokeWidth={2} />
              <Text style={styles.actionBtnTextSecondary}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onUpdate(leave.leave_id || leave.id, 'approved')}
              style={[styles.actionBtnPrimary, { backgroundColor: '#10b981' }]}
            >
              <CheckCircle size={16} color="#fff" strokeWidth={2} />
              <Text style={styles.actionBtnTextPrimary}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

export default function LeavesScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [leaves, setLeaves] = useState<Record<string, any>[]>([]);
  const [balances, setBalances] = useState<{ type: string; total: number; used: number; remaining: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'mine' | 'team'>('mine');
  const [form, setForm] = useState({ leave_type: 'Sick Leave', start_date: TODAY, end_date: TODAY, reason: '' });

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'mine') {
        const [leavesRes, balRes] = await Promise.allSettled([
          leaveService.getMyLeaves(),
          user?.employee_id ? leaveService.getLeaveBalance(user.employee_id) : Promise.reject(),
        ]);
        if (leavesRes.status === 'fulfilled') setLeaves(leavesRes.value.data?.data || []);
        if (balRes.status === 'fulfilled') {
          const raw: any = balRes.value.data?.data?.leaveBalance || {};
          setBalances(Object.entries(raw).map(([type, v]: [string, any], i) => ({
            type,
            total: v.allocated || 0,
            used: v.used || 0,
            remaining: v.remaining || 0,
            color: COLORS[i % COLORS.length],
          })));
        }
      } else {
        const { data } = await leaveService.getAllLeaves();
        setLeaves((data?.data || []).filter((l: { status: string }) => l.status === 'pending'));
      }
    } catch (e) {
      console.log('Leave load error', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.employee_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleApply = async () => {
    if (!form.reason.trim()) {
      Alert.alert('Incomplete', 'A reason is required for validation.');
      return;
    }

    setSubmitting(true);
    try {
      await leaveService.applyLeave({ ...form, employee_id: user?.employee_id });
      setShowModal(false);
      setForm({ leave_type: 'Sick Leave', start_date: TODAY, end_date: TODAY, reason: '' });
      loadData();
      Alert.alert('Success', 'Your request has been queued for approval.');
    } catch (e) {
      Alert.alert('Error', handleApiError(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = (id: number, status: 'approved' | 'rejected') => {
    Alert.alert('Decision Required', `Proceed with ${status} for this request?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        style: status === 'rejected' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            if (status === 'approved') await leaveService.approveLeave(id);
            else await leaveService.rejectLeave(id, 'Rejected via mobile app');
            loadData();
            Alert.alert('Processed', `Status updated to ${status}.`);
          } catch {
            Alert.alert('Error', 'Action could not be completed.');
          }
        },
      },
    ]);
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Leaves</Text>
          <TouchableOpacity onPress={() => setShowModal(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Plus size={24} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {isManager && (
          <View style={styles.tabWrapper}>
            <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                onPress={() => setActiveTab('mine')}
                style={[styles.tab, activeTab === 'mine' && [styles.tabActive, { backgroundColor: colors.card }]]}
              >
                <Text style={[styles.tabText, { color: colors.subtext }, activeTab === 'mine' && { color: colors.primary }]}>My Request</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('team')}
                style={[styles.tab, activeTab === 'team' && [styles.tabActive, { backgroundColor: colors.card }]]}
              >
                <Text style={[styles.tabText, { color: colors.subtext }, activeTab === 'team' && { color: colors.primary }]}>Team Approval</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.body}>
          {loading && !refreshing ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loaderText, { color: colors.subtext }]}>Synchronizing...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'mine' && balances.length > 0 && (
                <Animated.View entering={FadeInUp.delay(100)}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.subtext }]}>QUOTAS</Text>
                    <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.balList}>
                    {balances.map((b, i) => <BalanceCard key={i} bal={b} colors={colors} />)}
                  </ScrollView>
                </Animated.View>
              )}

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
                  {activeTab === 'mine' ? 'ACTIVITY LOG' : 'PENDING REVIEW'}
                </Text>
                <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.leaveRegistry}>
                {leaves.length === 0 ? (
                  <View style={styles.emptyState}>
                    <ClipboardList size={64} color={colors.border} strokeWidth={1} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Vault Empty</Text>
                    <Text style={[styles.emptySub, { color: colors.subtext }]}>No leave requests detected in this sector.</Text>
                  </View>
                ) : (
                  leaves.map((l, i) => (
                    <LeaveRow
                      key={l.leave_id || l.id || i}
                      leave={l}
                      isManager={isManager && activeTab === 'team'}
                      onUpdate={handleUpdate}
                      index={i}
                      colors={colors}
                    />
                  ))
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Application Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowModal(false)} />
            <Animated.View entering={SlideInDown} style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>New Request</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.subtext }]}>Select type and duration</Text>
                </View>
                <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}>
                  <X size={24} color={colors.text} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Leave Classification</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeSelector}>
                  {LEAVE_TYPES.map(t => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setForm({ ...form, leave_type: t })}
                      style={[
                        styles.typeChip, 
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        form.leave_type === t && { backgroundColor: colors.primary + '15', borderColor: colors.primary }
                      ]}
                    >
                      <Text style={[styles.typeChipText, { color: colors.subtext }, form.leave_type === t && { color: colors.primary }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.dateGrid}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Commencement</Text>
                    <View style={[styles.inputField, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Calendar size={18} color={colors.primary} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={form.start_date}
                        onChangeText={t => setForm({ ...form, start_date: t })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.subtext}
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Conclusion</Text>
                    <View style={[styles.inputField, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Calendar size={18} color={colors.primary} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={form.end_date}
                        onChangeText={t => setForm({ ...form, end_date: t })}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.subtext}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Reason for Absence</Text>
                  <View style={[styles.inputField, styles.textAreaField, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.textArea, { color: colors.text }]}
                      multiline
                      value={form.reason}
                      onChangeText={t => setForm({ ...form, reason: t })}
                      placeholder="Detail the operational impact or reason..."
                      placeholderTextColor={colors.subtext}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: colors.primary }, submitting && styles.btnDisabled]}
                  onPress={handleApply}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Dispatch Request</Text>
                  )}
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
  addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },

  scrollContent: { paddingBottom: 20 },
  tabWrapper: { paddingHorizontal: 20, marginTop: 20 },
  tabContainer: { flexDirection: 'row', borderRadius: 16, padding: 6 },
  tab: { flex: 1, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '700' },

  body: { paddingHorizontal: 20, paddingTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  headerLine: { flex: 1, height: 1 },
  
  balList: { paddingBottom: 24, gap: 16 },
  balCard: { width: 144, borderRadius: 28, padding: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  balIndicator: { width: 10, height: 10, borderRadius: 5, marginBottom: 16 },
  balVal: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  balLabel: { fontSize: 12, fontWeight: '700', marginBottom: 14 },
  balRail: { height: 4, borderRadius: 2, marginBottom: 8, overflow: 'hidden' },
  balProgress: { height: '100%', borderRadius: 2 },
  balMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  balMetaText: { fontSize: 10, fontWeight: '700' },

  leaveRegistry: { gap: 16 },
  leaveCard: { borderRadius: 28, padding: 22, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
  leaveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  leaveTypeInfo: { flex: 1 },
  employeeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8 },
  employeeName: { fontSize: 11, fontWeight: '800' },
  leaveTitle: { fontSize: 18, fontWeight: '800' },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  dateRange: { fontSize: 14, fontWeight: '600' },
  reasonBlock: { padding: 14, borderRadius: 16, marginBottom: 18 },
  reasonText: { fontSize: 14, fontWeight: '500', lineHeight: 20 },

  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtnSecondary: { flex: 1, height: 52, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnTextSecondary: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
  actionBtnPrimary: { flex: 1, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnTextPrimary: { color: '#fff', fontSize: 15, fontWeight: '700' },

  loaderWrap: { alignItems: 'center', paddingVertical: 60 },
  loaderText: { marginTop: 12, fontSize: 14, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySub: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, height: height * 0.88 },
  modalHeader: { padding: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 28, fontWeight: '800' },
  modalSubtitle: { fontSize: 15, marginTop: 4, fontWeight: '600' },
  modalCloseBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingHorizontal: 28 },
  
  inputLabel: { fontSize: 14, fontWeight: '800', marginBottom: 14, marginLeft: 4, letterSpacing: 0.5 },
  typeSelector: { paddingBottom: 24, gap: 12 },
  typeChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5 },
  typeChipText: { fontSize: 14, fontWeight: '700' },

  dateGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  inputGroup: { flex: 1 },
  inputField: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 18, height: 60, borderWidth: 1.5, gap: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '700' },
  textAreaField: { height: 140, alignItems: 'flex-start', paddingTop: 18 },
  textArea: { flex: 1, fontSize: 16, fontWeight: '700', textAlignVertical: 'top' },

  submitBtn: { height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
});
