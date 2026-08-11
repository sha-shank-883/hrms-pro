import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StatusBar, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shiftService } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Clock, Calendar, Sun, Moon, Coffee, Bell, ChevronRight, ArrowLeft, Info, Timer } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ShiftCard = ({ shift, index, colors }: any) => {
  const startHour = parseInt(shift.start_time?.split(':')[0] || '0');
  const isDayShift = startHour >= 6 && startHour < 18;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} layout={Layout.springify()}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardMain}>
          <View style={[styles.iconBox, { backgroundColor: isDayShift ? '#fff7ed' : '#f5f3ff' }]}>
            {isDayShift ? <Sun size={28} color="#f59e0b" strokeWidth={2} /> : <Moon size={28} color="#6366f1" strokeWidth={2} />}
          </View>
          
          <View style={styles.infoBox}>
            <View style={styles.badgeRow}>
              <View style={[styles.activeBadge, { backgroundColor: '#ecfdf5' }]}>
                <View style={styles.activePulse} />
                <Text style={styles.activeText}>Active</Text>
              </View>
              <Text style={[styles.shiftCategory, { color: colors.subtext }]}>{isDayShift ? 'Day' : 'Night'}</Text>
            </View>
            <Text style={[styles.shiftName, { color: colors.text }]}>{shift.shift_name}</Text>
            <View style={styles.timeRow}>
              <Clock size={14} color={colors.primary} strokeWidth={2.5} />
              <Text style={[styles.timeText, { color: colors.primary }]}>{shift.start_time} — {shift.end_time}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.cardDetails, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={styles.detailItem}>
            <Calendar size={14} color={colors.subtext} />
            <Text style={[styles.detailText, { color: colors.subtext }]}>
              Starts {new Date(shift.start_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Coffee size={14} color={colors.subtext} />
            <Text style={[styles.detailText, { color: colors.subtext }]}>60m Break</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.notifyBtn, { borderTopColor: colors.border }]} activeOpacity={0.8}>
          <Bell size={16} color={colors.primary} />
          <Text style={[styles.notifyText, { color: colors.primary }]}>Set Reminder</Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function ShiftsScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadShifts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await shiftService.getEmployeeShifts(user?.employee_id);
      setShifts(data.data || []);
    } catch (error) {
      console.log('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.employee_id]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  }, [loadShifts]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Shifts</Text>
          <View style={styles.headerBadgeBox}>
            <Calendar size={22} color={colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Syncing schedule...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          >
            <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: colors.subtext }]}>UPCOMING ROSTER</Text>
               <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
            </View>

            {shifts.length === 0 ? (
              <View style={styles.emptyModule}>
                <Timer size={64} color={colors.border} strokeWidth={1} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No shifts assigned</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>Your work schedule for this period hasn't been posted yet.</Text>
              </View>
            ) : (
              shifts.map((item, index) => (
                <ShiftCard key={index} shift={item} index={index} colors={colors} />
              ))
            )}

            <View style={[styles.policyCard, { backgroundColor: colors.primary + '10' }]}>
              <View style={styles.policyHeader}>
                <Info size={18} color={colors.primary} />
                <Text style={[styles.policyTitle, { color: colors.text }]}>Schedule Policy</Text>
              </View>
              <Text style={[styles.policyText, { color: colors.text }]}>
                Please request any shift adjustments at least 48 hours in advance. For emergencies, contact your supervisor immediately.
              </Text>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerBadgeBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  body: { flex: 1 },
  scrollContent: { padding: 20 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loaderText: { fontSize: 14, fontWeight: '600', marginTop: 12 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  headerLine: { flex: 1, height: 1 },

  card: { borderRadius: 24, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1 },
  cardMain: { flexDirection: 'row', padding: 20, alignItems: 'center', gap: 16 },
  iconBox: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  infoBox: { flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  activeText: { fontSize: 11, fontWeight: '800', color: '#059669' },
  shiftCategory: { fontSize: 12, fontWeight: '700' },
  shiftName: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 15, fontWeight: '800' },

  cardDetails: { flexDirection: 'row', gap: 20, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, fontWeight: '700' },

  notifyBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1 },
  notifyText: { flex: 1, fontSize: 14, fontWeight: '800' },

  policyCard: { padding: 20, borderRadius: 24, marginTop: 8 },
  policyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  policyTitle: { fontSize: 17, fontWeight: '800' },
  policyText: { fontSize: 14, lineHeight: 22, fontWeight: '600' },

  emptyModule: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySub: { fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
});
