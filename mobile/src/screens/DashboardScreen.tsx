import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Platform, UIManager, Alert, StatusBar, Dimensions, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { reportService, taskService, attendanceService } from '../api';
import { useTheme } from '../context/ThemeContext';
import {
  Users, Clock, UserCheck, Calendar, CreditCard, Briefcase, FileText, CheckSquare, MessageCircle, BarChart3, Settings, Building2, Target, Bell, LogOut, Timer, Zap, Activity, ChevronRight, Search, PlusCircle, ArrowUpRight, TrendingUp, Power
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { canOpenModule } from '../utils/authz';
import Animated, { FadeInDown, FadeInUp, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const StatCard = React.memo(({ value, label, icon, color, delay, colors }: { value: string | number; label: string; icon: React.ReactElement; color: string; delay: number; colors: Record<string, string> }) => (
  <Animated.View entering={FadeInDown.delay(delay)} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.statIconWrapper, { backgroundColor: color + '15' }]}>
      {React.cloneElement(icon as React.ReactElement<any>, { color, size: 18 })}
    </View>
    <View style={styles.statInfo}>
      <Text style={[styles.statValue, { color: colors.text }]}>{String(value ?? 0)}</Text>
      <Text style={[styles.statLabel, { color: colors.subtext }]}>{label}</Text>
    </View>
  </Animated.View>
));

const ModuleItem = React.memo(({ item, onPress, index, colors, isDark }: { item: { name: string; icon: React.ReactElement; screen: string; moduleKey: string; color: string }; onPress: (screen: string, moduleKey?: string) => void; index: number; colors: Record<string, string>; isDark: boolean }) => (
  <Animated.View entering={FadeInUp.delay(200 + index * 40)} style={styles.moduleItemWrapper}>
    <TouchableOpacity
      onPress={() => onPress(item.screen, item.moduleKey)}
      style={[styles.moduleItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={[styles.moduleIconCircle, { backgroundColor: item.color + (isDark ? '20' : '10') }]}>
        {React.cloneElement(item.icon as React.ReactElement<any>, { color: item.color, size: 22 })}
      </View>
      <Text style={[styles.moduleItemLabel, { color: colors.text }]}>{item.name}</Text>
      <ArrowUpRight size={14} color={colors.subtext} style={{ marginLeft: 'auto', opacity: 0.5 }} />
    </TouchableOpacity>
  </Animated.View>
));

export default function DashboardScreen() {
  const { user, tenantId, settings: mobileSettings, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [todayAttendance, setTodayAttendance] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, taskRes, attRes] = await Promise.allSettled([
        reportService.getDashboardStats(),
        taskService.getTasks(),
        attendanceService.checkToday(),
      ]);

      if (statsRes.status === 'fulfilled') {
        const stats = statsRes.value.data?.data || {};
        setSummary({
          total: stats.employees?.total || 0,
          present_today: stats.attendance?.present || 0,
          leave_balance: stats.leaves?.balance || 0,
          payroll_due: stats.payroll?.due || 0,
        });
      }
      if (taskRes.status === 'fulfilled') {
        const tasks = taskRes.value.data?.data || [];
        setPendingTasks(tasks.filter((t: { status: string }) => t.status === 'pending' || t.status === 'todo').length);
      }
      if (attRes.status === 'fulfilled') {
        setTodayAttendance(attRes.value.data?.data);
      }
    } catch (err) {
      console.log('Dashboard load error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleNavigate = useCallback((screen: string, moduleKey?: string) => {
    if (!screen) return;
    if (moduleKey && moduleKey !== 'payrollSelf' && !canOpenModule(user, tenantId, moduleKey, mobileSettings)) {
      Alert.alert('Access Denied', 'Insufficient permissions for this module.');
      return;
    }
    (navigation as any).navigate(screen);
  }, [user, tenantId, mobileSettings, navigation]);

  const handleClockInOut = async () => {
    try {
      setLoading(true);
      const payload = { employee_id: user?.employee_id, location: 'Mobile Terminal' };
      if (todayAttendance?.clocked_in && !todayAttendance?.clocked_out) {
        await attendanceService.clockOut(payload);
        Alert.alert('Protocol Success', 'Duty shift concluded.');
      } else {
        await attendanceService.clockIn(payload);
        Alert.alert('Protocol Success', 'Duty shift initiated.');
      }
      await loadData();
    } catch {
      Alert.alert('Error', 'Attendance synchronization failed.');
    } finally {
      setLoading(false);
    }
  };

  const isActiveShift = todayAttendance?.clocked_in && !todayAttendance?.clocked_out;

  const allModules = [
    { name: 'Employees', icon: <Users />, screen: 'Employees', moduleKey: 'employees', color: '#6366f1' },
    { name: 'Attendance', icon: <UserCheck />, screen: 'Attendance', moduleKey: 'attendance', color: '#10b981' },
    { name: 'Leaves', icon: <Calendar />, screen: 'Leaves', moduleKey: 'leaves', color: '#f59e0b' },
    { name: 'Payroll', icon: <CreditCard />, screen: 'Payroll', moduleKey: 'payroll', color: '#8b5cf6' },
    { name: 'Tasks', icon: <CheckSquare />, screen: 'Tasks', moduleKey: 'tasks', color: '#3b82f6' },
    { name: 'Chat', icon: <MessageCircle />, screen: 'Chat', moduleKey: 'chat', color: '#06b6d4' },
    { name: 'Documents', icon: <FileText />, screen: 'Documents', moduleKey: 'documents', color: '#64748b' },
    { name: 'Departments', icon: <Building2 />, screen: 'Departments', moduleKey: 'departments', color: '#ec4899' },
    { name: 'Shifts', icon: <Clock />, screen: 'Shifts', moduleKey: 'shifts', color: '#14b8a6' },
    { name: 'Assets', icon: <Briefcase />, screen: 'Assets', moduleKey: 'assets', color: '#f97316' },
    { name: 'Performance', icon: <Target />, screen: 'Performance', moduleKey: 'performance', color: '#a855f7' },
    { name: 'Reports', icon: <BarChart3 />, screen: 'Reports', moduleKey: 'reports', color: '#0ea5e9' },
  ];

  const visibleModules = allModules.filter(
    m => !m.moduleKey || m.moduleKey === 'payrollSelf' || canOpenModule(user, tenantId, m.moduleKey, mobileSettings)
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => handleNavigate('Profile')} style={styles.profileBtn}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Text>
            </View>
            <View>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.first_name || 'Guest'}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: '#10b981' }]} />
                <Text style={[styles.greeting, { color: colors.subtext }]}>Active Session</Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Bell size={20} color={colors.text} />
              <View style={[styles.badge, { borderColor: colors.card }]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Attendance Hero */}
        <Animated.View entering={FadeInDown.delay(100)} style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleWrapper}>
              <Activity size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>OPERATIONAL STATUS</Text>
            </View>
            <View style={[styles.dateBadge, { backgroundColor: colors.surface }]}>
              <Text style={[styles.dateText, { color: colors.primary }]}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.attendanceRow}>
            <View style={styles.timeInfo}>
              <Text style={[styles.timeLabel, { color: colors.subtext }]}>SHIFT COMMENCED</Text>
              <Text style={[styles.timeValue, { color: colors.text }]}>
                {todayAttendance?.clocked_in_at
                  ? new Date(todayAttendance.clocked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '--:--'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClockInOut}
              style={[styles.actionBtn, { backgroundColor: isActiveShift ? colors.error : colors.primary }]}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  {isActiveShift ? <Power size={16} color="#fff" /> : <TrendingUp size={16} color="#fff" />}
                  <Text style={styles.actionBtnText}>
                    {isActiveShift ? 'CLOCK OUT' : 'CLOCK IN'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard value={summary?.total ?? 0} label="Colleagues" icon={<Users />} color="#6366f1" delay={200} colors={colors} />
          <StatCard value={summary?.present_today ?? 0} label="In Office" icon={<UserCheck />} color="#10b981" delay={250} colors={colors} />
          <StatCard value={summary?.leave_balance ?? 0} label="Days Left" icon={<Calendar />} color="#f59e0b" delay={300} colors={colors} />
          <StatCard value={pendingTasks} label="Active Tasks" icon={<CheckSquare />} color="#3b82f6" delay={350} colors={colors} />
        </View>

        {/* Modules Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.subtext }]}>OPERATIONAL MODULES</Text>
            <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.modulesGrid}>
            {visibleModules.map((item, idx) => (
              <ModuleItem key={item.screen} item={item} onPress={handleNavigate} index={idx} colors={colors} isDark={isDark} />
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.logoutBtn, { borderColor: colors.error + '40' }]} 
          onPress={logout}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={colors.error} />
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
  scrollContent: { padding: 20, paddingTop: 10 },
  header: { paddingHorizontal: 20, paddingBottom: 15 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileBtn: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 20, fontWeight: '800' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  greeting: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  badge: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 2 },

  mainCard: { padding: 24, borderRadius: 32, borderWidth: 1, marginBottom: 25 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardTitleWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  dateBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  dateText: { fontSize: 10, fontWeight: '800' },
  attendanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeInfo: { gap: 4 },
  timeLabel: { fontSize: 10, fontWeight: '800', opacity: 0.6 },
  timeValue: { fontSize: 28, fontWeight: '800' },
  actionBtn: { paddingHorizontal: 20, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  statCard: { width: (width - 52) / 2, padding: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
  statIconWrapper: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statInfo: { gap: 1 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '700' },

  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18, paddingLeft: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  headerLine: { flex: 1, height: 1 },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleItemWrapper: { width: (width - 52) / 2 },
  moduleItem: { padding: 18, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
  moduleIconCircle: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  moduleItemLabel: { fontSize: 14, fontWeight: '800' },

  logoutBtn: { height: 58, borderRadius: 18, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 5 },
  logoutText: { fontSize: 15, fontWeight: '800' },

  footer: { alignItems: 'center', marginTop: 30 },
  footerText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
});
