import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StatusBar, StyleSheet, Dimensions, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { departmentService } from '../api';
import { useTheme } from '../context/ThemeContext';
import { Network, Users, DollarSign, ChevronRight, ArrowLeft, Search, Building2, TrendingUp, Layout, Briefcase, UserCheck, X, Shield, Info } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const DepartmentCard = ({ dept, index, colors }: any) => {
  const budget = dept.budget ? (parseFloat(dept.budget) / 1000).toFixed(0) + 'K' : '0';
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} layout={ReanimatedLayout.springify()}>
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '10' }]}>
            <Building2 color={colors.primary} size={28} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.deptName, { color: colors.text }]}>{dept.department_name}</Text>
            <View style={styles.managerRow}>
              <UserCheck size={14} color="#10b981" />
              <Text style={[styles.managerText, { color: colors.subtext }]}>{dept.manager_name || 'No Lead Assigned'}</Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.subtext} />
        </View>

        <View style={[styles.cardStats, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.statBox}>
            <Users size={16} color={colors.primary} />
            <View>
              <Text style={[styles.statVal, { color: colors.text }]}>{dept.employee_count || 0}</Text>
              <Text style={[styles.statLab, { color: colors.subtext }]}>Members</Text>
            </View>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <TrendingUp size={16} color="#10b981" />
            <View>
              <Text style={[styles.statVal, { color: colors.text }]}>${budget}</Text>
              <Text style={[styles.statLab, { color: colors.subtext }]}>Budget</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function DepartmentsScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await departmentService.getDepartments();
      setDepartments(data.data || []);
    } catch (error) {
      console.log('Error loading departments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDepartments();
    setRefreshing(false);
  }, [loadDepartments]);

  const filteredDepts = departments.filter(d => 
    d.department_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.manager_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Departments</Text>
          <View style={styles.headerBadgeBox}>
            <Network size={22} color={colors.primary} />
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search size={18} color={colors.subtext} />
            <TextInput 
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search units or managers..."
              placeholderTextColor={colors.subtext + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={[styles.clearBtn, { backgroundColor: colors.background }]}>
                <X size={14} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Indexing structure...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          >
            <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: colors.subtext }]}>ORGANIZATIONAL UNITS</Text>
               <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
            </View>

            {filteredDepts.length === 0 ? (
              <View style={styles.emptyModule}>
                <Building2 size={64} color={colors.border} strokeWidth={1} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No units found</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>No departments match your search query in the current directory.</Text>
              </View>
            ) : (
              filteredDepts.map((item, index) => (
                <DepartmentCard key={index} dept={item} index={index} colors={colors} />
              ))
            )}
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

  searchSection: { paddingHorizontal: 20, paddingBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, paddingHorizontal: 16, height: 52, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600' },
  clearBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  body: { flex: 1 },
  scrollContent: { padding: 20 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loaderText: { fontSize: 14, fontWeight: '600', marginTop: 12 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  headerLine: { flex: 1, height: 1 },

  card: { borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  iconWrap: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  deptName: { fontSize: 19, fontWeight: '800' },
  managerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  managerText: { fontSize: 13, fontWeight: '600' },

  cardStats: { flexDirection: 'row', borderRadius: 20, padding: 16, gap: 12, borderWidth: 1 },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statDivider: { width: 1, height: 24 },
  statVal: { fontSize: 17, fontWeight: '800' },
  statLab: { fontSize: 11, fontWeight: '700', marginTop: -2 },

  emptyModule: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySub: { fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
});
