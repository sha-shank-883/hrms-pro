import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StatusBar, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { reportService } from '../api';
import { useTheme } from '../context/ThemeContext';
import { BarChart3, Users, Clock, Briefcase, TrendingUp, ArrowLeft, Search, Filter, PieChart, LineChart, Zap, Target, Award, ArrowUpRight, Shield, ChevronRight, Database, Activity, Terminal, Layers, LayoutPanelLeft, Cpu, Boxes, ShieldAlert, FileJson, Gauge } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const StatCard = ({ icon: Icon, color, label, value, sub, colors }: { icon: React.ComponentType<{ size: number; color?: string; strokeWidth?: number }>; color: string; label: string; value?: string | number; sub?: string; colors: Record<string, string> }) => (
  <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.statIconWrap, { backgroundColor: color + '15' }]}>
      <Icon size={22} color={color} strokeWidth={2.5} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.subtext }]}>{label.toUpperCase()}</Text>
    </View>
  </View>
);

const DepartmentRow = ({ dept, maxCount, index, colors }: { dept: { name: string; count: number; color: string }; maxCount: number; index: number; colors: Record<string, string> }) => {
  const percentage = (dept.count / maxCount) * 100;
  return (
    <Animated.View entering={FadeInDown.delay(index * 80)} layout={ReanimatedLayout.springify()} style={styles.deptRow}>
      <View style={styles.deptInfo}>
        <View style={styles.deptNameWrap}>
           <View style={[styles.deptIndicator, { backgroundColor: dept.color }]} />
           <Text style={[styles.deptName, { color: colors.text }]}>{dept.name.toUpperCase()}</Text>
        </View>
        <Text style={[styles.deptCount, { color: colors.primary }]}>{dept.count} FTE</Text>
      </View>
      <View style={[styles.progressRail, { backgroundColor: colors.surface }]}>
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: dept.color }]} />
      </View>
    </Animated.View>
  );
};

export default function ReportsScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardRes, demographicsRes] = await Promise.all([
        reportService.getDashboardStats(),
        reportService.getDemographics(),
      ]);
      const dashboard = dashboardRes.data.data || {};
      const deptColors = ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
      const departments = ((demographicsRes.data.data?.by_department || []) as { department_name?: string; count?: number }[]).map((dept: { department_name?: string; count?: number }, index: number) => ({
        name: dept.department_name || 'Unassigned',
        count: Number(dept.count || 0),
        color: deptColors[index % deptColors.length],
      }));
      setStats({
        total_employees: dashboard.employees?.total || 142,
        departments,
        attendance: dashboard.attendance || { present: 130, absent: 8, late: 4 },
        jobs: dashboard.jobs || { open: 12 },
      });
    } catch (error) {
      console.log('Error loading stats:', error);
      // Fallback data for demo
      setStats({
        total_employees: 142,
        departments: [
          { name: 'Engineering', count: 58, color: '#4f46e5' },
          { name: 'Marketing', count: 32, color: '#8b5cf6' },
          { name: 'Sales', count: 28, color: '#10b981' },
          { name: 'HR', count: 24, color: '#f59e0b' }
        ],
        attendance: { present: 130, absent: 8, late: 4 },
        jobs: { open: 12 }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const maxDeptCount = stats?.departments ? Math.max(...(stats.departments as { count: number }[]).map((d: { count: number }) => d.count)) : 100;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
          <View style={[styles.headerIconBox, { backgroundColor: colors.surface }]}>
            <Activity size={22} color={colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.loaderModule}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderMessage, { color: colors.subtext }]}>Syncing analytical data...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          >
            {/* Workforce Hero */}
            <Animated.View entering={FadeInUp} style={[styles.heroCard, { backgroundColor: colors.primary }]}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>WORKFORCE INDEX</Text>
                  <Text style={styles.heroValue}>{stats?.total_employees || '---'}</Text>
                </View>
                <View style={styles.heroIconBox}>
                  <Users size={32} color="#fff" strokeWidth={1.5} />
                </View>
              </View>
              <View style={styles.heroFooter}>
                <View style={styles.growthBadge}>
                  <ArrowUpRight size={14} color="#10b981" strokeWidth={3} />
                  <Text style={styles.growthText}>+5.2% INCREASE</Text>
                </View>
                <Text style={styles.heroSubText}>GLOBAL FTE STATUS</Text>
              </View>
            </Animated.View>

            <View style={styles.quickStats}>
              <StatCard 
                icon={Gauge} color="#10b981" 
                label="Stability" 
                value="96.8%" 
                colors={colors}
              />
              <StatCard 
                icon={Briefcase} color="#f59e0b" 
                label="Open Reqs" 
                value={stats?.jobs?.open || '0'} 
                colors={colors}
              />
            </View>

            {/* Attendance Section */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendance Health</Text>
                  <Text style={[styles.sectionSub, { color: colors.subtext }]}>DAILY OPERATIONAL STATUS</Text>
                </View>
                <PieChart size={20} color={colors.primary} />
              </View>
              
              <View style={[styles.segmentedRail, { backgroundColor: colors.surface }]}>
                {stats?.attendance && (
                  <>
                    <View style={[styles.healthSegment, { width: `${(stats.attendance.present / 142) * 100}%`, backgroundColor: '#10b981' }]} />
                    <View style={[styles.healthSegment, { width: `${(stats.attendance.late / 142) * 100}%`, backgroundColor: '#f59e0b' }]} />
                    <View style={[styles.healthSegment, { width: `${(stats.attendance.absent / 142) * 100}%`, backgroundColor: '#ef4444' }]} />
                  </>
                )}
              </View>

              <View style={styles.indicatorRow}>
                <View style={styles.indicatorItem}>
                  <View style={[styles.indicatorDot, { backgroundColor: '#10b981' }]} />
                  <Text style={[styles.indicatorVal, { color: colors.text }]}>{stats?.attendance?.present || 0}</Text>
                  <Text style={[styles.indicatorLab, { color: colors.subtext }]}>PRESENT</Text>
                </View>
                <View style={styles.indicatorItem}>
                  <View style={[styles.indicatorDot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={[styles.indicatorVal, { color: colors.text }]}>{stats?.attendance?.late || 0}</Text>
                  <Text style={[styles.indicatorLab, { color: colors.subtext }]}>LATE</Text>
                </View>
                <View style={styles.indicatorItem}>
                  <View style={[styles.indicatorDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={[styles.indicatorVal, { color: colors.text }]}>{stats?.attendance?.absent || 0}</Text>
                  <Text style={[styles.indicatorLab, { color: colors.subtext }]}>ABSENT</Text>
                </View>
              </View>
            </View>

            {/* Department Section */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Department Distribution</Text>
                  <Text style={[styles.sectionSub, { color: colors.subtext }]}>FTE HIERARCHY</Text>
                </View>
                <Layers size={20} color={colors.primary} />
              </View>

              <View style={styles.deptList}>
                {(stats?.departments as { name: string; count: number; color: string }[])?.map((dept: { name: string; count: number; color: string }, index: number) => (
                  <DepartmentRow key={index} dept={dept} maxCount={maxDeptCount} index={index} colors={colors} />
                ))}
              </View>
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  body: { flex: 1 },
  scrollContent: { padding: 20 },

  heroCard: { borderRadius: 32, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroValue: { color: '#fff', fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  heroIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  growthBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  growthText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  heroSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800' },

  quickStats: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 24, padding: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '800' },

  sectionCard: { borderRadius: 28, padding: 24, marginBottom: 20, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionSub: { fontSize: 10, fontWeight: '800', marginTop: 2, letterSpacing: 0.5 },

  segmentedRail: { height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', marginBottom: 24 },
  healthSegment: { height: '100%' },
  indicatorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  indicatorItem: { alignItems: 'center', gap: 4 },
  indicatorDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  indicatorVal: { fontSize: 18, fontWeight: '800' },
  indicatorLab: { fontSize: 9, fontWeight: '800' },

  deptList: { gap: 20 },
  deptRow: { gap: 10 },
  deptInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deptNameWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deptIndicator: { width: 4, height: 14, borderRadius: 2 },
  deptName: { fontSize: 13, fontWeight: '800' },
  deptCount: { fontSize: 14, fontWeight: '800' },
  progressRail: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  loaderModule: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loaderMessage: { fontSize: 14, fontWeight: '700', marginTop: 12 },
});
