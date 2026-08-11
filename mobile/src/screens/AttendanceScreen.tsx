import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, StatusBar, StyleSheet, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { attendanceService } from '../api';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, Layout as ReanimatedLayout } from 'react-native-reanimated';
import { MapPin, Clock, Shield, Fingerprint, CheckCircle, XCircle, ArrowLeft, Calendar, ChevronRight, TrendingUp, AlertCircle, Database, Zap, Power, Timer, Info, Navigation } from 'lucide-react-native';
import { Calendar as AttendanceCalendar } from 'react-native-calendars';

const { width, height } = Dimensions.get('window');

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  present: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'PRESENT' },
  late: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'LATE' },
  absent: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'ABSENT' },
  default: { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', label: 'REGULAR' },
};

const HistoryItem = React.memo(({ record, index, colors }: { record: any; index: number; colors: Record<string, string> }) => {
  const date = new Date(record.date);
  const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.default;
  return (
    <Animated.View entering={FadeInDown.delay(index * 60)} style={[styles.historyItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.dayBox, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.dayNum, { color: cfg.color }]}>{date.getDate()}</Text>
        <Text style={[styles.dayMonth, { color: cfg.color }]}>{date.toLocaleDateString('en', { month: 'short' }).toUpperCase()}</Text>
      </View>
      <View style={styles.recordContent}>
        <View style={styles.recordHeader}>
          <Text style={[styles.dayName, { color: colors.text }]}>{date.toLocaleDateString('en', { weekday: 'long' })}</Text>
          <View style={[styles.statusTag, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusTagText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <View style={styles.recordFooter}>
          <View style={styles.timeRow}>
            <Clock size={12} color={colors.subtext} />
            <Text style={[styles.timeText, { color: colors.subtext }]}>
              {record.clocked_in_at ? new Date(record.clocked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </Text>
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
            <Text style={[styles.workHours, { color: colors.subtext }]}>{record.work_hours || '0.0'} HRS</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

export default function AttendanceScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [history, setHistory] = useState<Record<string, any>[]>([]);
  const [today, setToday] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bio, setBio] = useState({ supported: false, enrolled: false });

  const init = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
      const [hist, tod] = await Promise.allSettled([
        attendanceService.getHistory(),
        attendanceService.checkToday(),
      ]);
      if (hist.status === 'fulfilled') setHistory(hist.value.data?.data || []);
      if (tod.status === 'fulfilled') setToday(tod.value.data?.data);

      const [hw, en] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      setBio({ supported: hw, enrolled: en });
    } catch (e) {
      console.log('Attendance init error', e);
    }
  }, []);

  useEffect(() => { init(); }, [init]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await init();
    setRefreshing(false);
  }, [init]);

  const handleClockInOut = async () => {
    if (!location) {
      Alert.alert('Permission Protocol', 'Location access is required for sector-bound authentication.');
      return;
    }
    const isOut = today?.clocked_in && !today?.clocked_out;
    Alert.alert(
      'System Authorization', 
      `Confirm ${isOut ? 'CLOCK OUT' : 'CLOCK IN'} for your current shift?`, 
      [
        { text: 'ABORT', style: 'cancel' },
        { text: 'AUTHORIZE', onPress: async () => {
          setLoading(true);
          try {
            if (bio.supported && bio.enrolled) {
              const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'VERIFY BIOMETRIC CLEARANCE' });
              if (!r.success) { setLoading(false); return; }
            }
            const payload = { 
              employee_id: user?.employee_id, 
              latitude: location.latitude, 
              longitude: location.longitude, 
              location: 'Mobile App', 
              device_info: Platform.OS 
            };
            if (isOut) {
              await attendanceService.clockOut(payload);
            } else {
              await attendanceService.clockIn(payload);
            }
            await init();
          } catch {
            Alert.alert('Protocol Error', 'Authentication session failed.');
          } finally { setLoading(false); }
        }},
      ]
    );
  };

  const isActive = today?.clocked_in && !today?.clocked_out;
  const markedDates = useMemo(() => {
    return history.reduce((acc: Record<string, { marked: boolean; dotColor: string }>, r: any) => {
      const d = new Date(r.date).toISOString().split('T')[0];
      acc[d] = { marked: true, dotColor: r.status === 'late' ? '#f59e0b' : '#10b981' };
      return acc;
    }, { [new Date().toISOString().split('T')[0]]: { selected: true, selectedColor: colors.primary } });
  }, [history, colors.primary]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Registry</Text>
          <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
            <Shield size={22} color={colors.primary} />
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Real-time Status Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusInfo}>
            <View style={styles.statusLabelRow}>
              <View style={[styles.statusDot, { backgroundColor: isActive ? '#10b981' : colors.subtext }]} />
              <Text style={[styles.statusLabel, { color: colors.subtext }]}>
                {isActive ? 'ACTIVE SESSION' : 'STANDBY MODE'}
              </Text>
            </View>
            <Text style={[styles.mainTime, { color: colors.text }]}>
              {today?.clocked_in_at
                ? new Date(today.clocked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                : '--:--'}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.metaBadge, { backgroundColor: location ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                <Navigation size={10} color={location ? '#10b981' : '#ef4444'} />
                <Text style={[styles.badgeText, { color: location ? '#10b981' : '#ef4444' }]}>GEOFENCE LOCKED</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleClockInOut}
            style={[styles.clockActionBtn, { backgroundColor: isActive ? 'rgba(239, 68, 68, 0.1)' : colors.primary }]}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={isActive ? '#ef4444' : '#fff'} />
            ) : (
              <View style={styles.clockBtnContent}>
                <Power size={28} color={isActive ? '#ef4444' : '#fff'} strokeWidth={2.5} />
                <Text style={[styles.clockBtnText, { color: isActive ? '#ef4444' : '#fff' }]}>
                  {isActive ? 'OUT' : 'IN'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Calendar Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>CHRONOLOGY</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.subtext }]}>Monthly Overview</Text>
          </View>
          <View style={[styles.calendarWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AttendanceCalendar
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: colors.subtext,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#fff',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.border,
                dotColor: '#10b981',
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 11,
                textDayFontWeight: '700',
                textMonthFontWeight: '800',
                textDayHeaderFontWeight: '800',
              }}
              markedDates={markedDates}
            />
          </View>
        </View>

        {/* History List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>LOGS</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.subtext }]}>Recent Activity</Text>
          </View>
          <View style={styles.historyList}>
            {history.slice(0, 5).map((r, i) => <HistoryItem key={i} record={r} index={i} colors={colors} />)}
            {history.length === 0 && (
              <View style={styles.emptyModule}>
                <Database size={48} color={colors.border} strokeWidth={1} />
                <Text style={[styles.emptySub, { color: colors.subtext }]}>No records detected.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { borderBottomWidth: 1, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { padding: 20 },

  statusCard: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: 32, marginBottom: 32, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  statusInfo: { flex: 1 },
  statusLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  mainTime: { fontSize: 42, fontWeight: '800', letterSpacing: -1.5 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  clockActionBtn: { width: 90, height: 90, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 6 },
  clockBtnContent: { alignItems: 'center', gap: 2 },
  clockBtnText: { fontSize: 13, fontWeight: '900' },

  section: { marginBottom: 32 },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  sectionSubtitle: { fontSize: 18, fontWeight: '800' },

  calendarWrapper: { borderRadius: 28, padding: 12, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 1 },

  historyList: { gap: 12 },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1 },
  dayBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayNum: { fontSize: 22, fontWeight: '800' },
  dayMonth: { fontSize: 10, fontWeight: '800' },
  recordContent: { flex: 1, marginLeft: 16 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayName: { fontSize: 16, fontWeight: '800' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusTagText: { fontSize: 10, fontWeight: '800' },
  recordFooter: { flexDirection: 'row', alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 14, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 4 },
  workHours: { fontSize: 14, fontWeight: '700' },
  
  emptyModule: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptySub: { fontSize: 15, fontWeight: '700' },
});
