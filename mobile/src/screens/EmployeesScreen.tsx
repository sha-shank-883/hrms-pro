import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, StatusBar, StyleSheet, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { employeeService, departmentService } from '../api';
import { useTheme } from '../context/ThemeContext';
import { Search, Users, Building2, Mail, Phone, MapPin, Calendar, Briefcase, Filter, X, ChevronRight, User, Crown, Shield, Star, ArrowLeft, Terminal, Database, Network, Zap, Boxes, Activity, UserCheck, ShieldAlert, Cpu } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const RoleBadge = ({ role }: { role: string }) => {
  const isManager = role?.toLowerCase() === 'manager';
  const isAdmin = role?.toLowerCase() === 'admin';
  
  if (isAdmin) return (
    <View style={[styles.roleBadge, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
      <Text style={[styles.roleText, { color: '#f97316' }]}>ADMIN</Text>
    </View>
  );
  
  if (isManager) return (
    <View style={[styles.roleBadge, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
      <Text style={[styles.roleText, { color: '#6366f1' }]}>MANAGER</Text>
    </View>
  );

  return (
    <View style={[styles.roleBadge, { backgroundColor: 'rgba(100, 116, 139, 0.1)' }]}>
      <Text style={[styles.roleText, { color: '#64748b' }]}>STAFF</Text>
    </View>
  );
};

const EmployeeCard = React.memo(({ item, index, departments, navigation, colors }: any) => {
  const deptName = departments.find((d: any) => d.id === item.department_id)?.name || 'General';
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 60)} layout={ReanimatedLayout.springify()}>
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('Profile', { userId: item.user_id || item.id })}
        activeOpacity={0.8}
      >
        <View style={[styles.avatarWrap, { backgroundColor: colors.primary + '10' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {item.first_name?.charAt(0)}{item.last_name?.charAt(0)}
          </Text>
          <View style={[styles.onlineDot, { borderColor: colors.card }]} />
        </View>
        
        <View style={styles.cardContent}>
          <Text style={[styles.nameText, { color: colors.text }]} numberOfLines={1}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={[styles.designationText, { color: colors.subtext }]} numberOfLines={1}>
            {item.designation || 'Specialist'}
          </Text>
          
          <View style={styles.metaRow}>
            <RoleBadge role={item.role} />
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
            <Text style={[styles.deptText, { color: colors.primary }]} numberOfLines={1}>{deptName.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={[styles.chevronBox, { backgroundColor: colors.surface }]}>
          <ChevronRight size={16} color={colors.subtext} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function EmployeesScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [employeesRes, departmentsRes] = await Promise.all([
        employeeService.getEmployees(),
        departmentService.getDepartments()
      ]);
      setEmployees(employeesRes.data.data || []);
      setDepartments(departmentsRes.data.data || []);
    } catch (error) {
      console.log('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const matchesSearch = !searchQuery || 
        fullName.includes(searchQuery.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = !selectedDepartment || emp.department_id === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, selectedDepartment]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Directory</Text>
          <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
            <Users size={22} color={colors.primary} />
          </View>
        </View>

        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
            <Search size={18} color={colors.subtext} strokeWidth={2.5} />
            <TextInput 
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search registry..."
              placeholderTextColor={colors.subtext + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={[styles.clearBtn, { backgroundColor: colors.background }]}>
                <X size={14} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterPadding}
        >
          <TouchableOpacity 
            onPress={() => setSelectedDepartment(null)}
            style={[
              styles.filterChip, 
              { backgroundColor: colors.surface },
              selectedDepartment === null && { backgroundColor: colors.primary }
            ]}
          >
            <Text style={[
              styles.filterText, 
              { color: colors.subtext },
              selectedDepartment === null && { color: '#fff' }
            ]}>
              ALL SECTORS
            </Text>
          </TouchableOpacity>
          {departments.map((dept) => (
            <TouchableOpacity 
              key={dept.id}
              onPress={() => setSelectedDepartment(dept.id)}
              style={[
                styles.filterChip, 
                { backgroundColor: colors.surface },
                selectedDepartment === dept.id && { backgroundColor: colors.primary }
              ]}
            >
              <Text style={[
                styles.filterText, 
                { color: colors.subtext },
                selectedDepartment === dept.id && { color: '#fff' }
              ]}>
                {dept.name.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Syncing member directory...</Text>
          </View>
        ) : (
          <FlatList 
            data={filteredEmployees}
            renderItem={({ item, index }) => (
              <EmployeeCard 
                item={item} 
                index={index} 
                departments={departments} 
                navigation={navigation} 
                colors={colors}
              />
            )}
            keyExtractor={item => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            ListHeaderComponent={() => (
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitleText, { color: colors.subtext }]}>
                  {filteredEmployees.length} MATCHES DETECTED
                </Text>
                <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyModule}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
                  <Users size={64} color={colors.border} strokeWidth={1} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Records Found</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>
                  No employees matching your current filters in the registry.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { borderBottomWidth: 1, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, marginBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  searchSection: { paddingHorizontal: 20, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 50 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '700' },
  clearBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  filterScroll: { paddingLeft: 20 },
  filterPadding: { paddingRight: 40, gap: 10 },
  filterChip: { paddingHorizontal: 16, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  body: { flex: 1 },
  listContainer: { padding: 20 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loaderText: { fontSize: 14, fontWeight: '700', marginTop: 12 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, paddingHorizontal: 4 },
  sectionTitleText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  headerLine: { flex: 1, height: 1 },

  card: { borderRadius: 24, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1 },
  avatarWrap: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800' },
  onlineDot: { position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 2.5 },
  cardContent: { flex: 1, gap: 2 },
  nameText: { fontSize: 17, fontWeight: '800' },
  designationText: { fontSize: 13, fontWeight: '700' },
  
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 9, fontWeight: '900' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  deptText: { fontSize: 11, fontWeight: '800' },
  dot: { width: 4, height: 4, borderRadius: 2 },

  chevronBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  emptyModule: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptySub: { fontSize: 15, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});
