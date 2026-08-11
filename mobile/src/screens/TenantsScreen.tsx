import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, StatusBar, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tenantService } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Building2, Globe, Shield, UserCheck, Plus, Settings, ArrowLeft, Search, Filter, Server, Database, ArrowUpRight, Cpu, ChevronRight, HardDrive 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const TenantCard = React.memo(({ tenant, index, colors }: any) => {
  const isActive = tenant.status === 'active';
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} layout={Layout.springify()}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatarWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Building2 color={colors.primary} size={32} />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? '#f0fdf4' : '#fef2f2' }]}>
            <Text style={[styles.statusText, { color: isActive ? '#10b981' : '#ef4444' }]}>
              {tenant.status?.toUpperCase() || 'OFFLINE'}
            </Text>
          </View>
        </View>

        <Text style={[styles.tenantName, { color: colors.text }]}>{tenant.name}</Text>
        <View style={[styles.domainWrap, { backgroundColor: colors.surface }]}>
          <Globe size={12} color={colors.primary} />
          <Text style={[styles.domainText, { color: colors.primary }]}>{tenant.tenant_id}.hrmspro.com</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.archiveBtn, { backgroundColor: colors.text }]}>
            <HardDrive size={16} color={colors.background} />
            <Text style={[styles.archiveBtnText, { color: colors.background }]}>DATA ARCHIVE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingsBtn, { backgroundColor: colors.surface }]}>
            <Settings size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.securityWrap}>
            <Shield size={14} color="#10b981" />
            <Text style={styles.securityText}>SECURITY VALIDATED</Text>
          </View>
          <Text style={[styles.nodeText, { color: colors.subtext }]}>NODE: ALPHA-{index + 1}</Text>
        </View>
      </View>
    </Animated.View>
  );
});

export default function TenantsScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await tenantService.getTenants();
      setTenants(Array.isArray(data) ? data : (data.data || []));
    } catch (error) {
      console.log('Error loading tenants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Account Nexus</Text>
          <View style={[styles.headerIconBox, { backgroundColor: colors.surface }]}>
            <Server size={22} color={colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Syncing account instances...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.listHeader}>
              <Cpu size={14} color={colors.subtext} />
              <Text style={[styles.listHeaderText, { color: colors.subtext }]}>ACTIVE CLUSTER INSTANCES</Text>
              <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
            </View>

            {tenants.length === 0 ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
                  <Building2 size={64} color={colors.border} strokeWidth={1} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Nexus Isolated</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>No registered accounts found in the current environment.</Text>
              </View>
            ) : (
              tenants.map((item, index) => (
                <TenantCard key={index} tenant={item} index={index} colors={colors} />
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => Alert.alert('Nexus Protocol', 'Account creation is reserved for the primary Web Control Center.')}
        activeOpacity={0.9}
      >
        <Plus color="white" size={32} />
      </TouchableOpacity>
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
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  listHeaderText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerLine: { flex: 1, height: 1 },

  card: { borderRadius: 32, padding: 24, marginBottom: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  avatarWrap: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  tenantName: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  domainWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  domainText: { fontSize: 13, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
  archiveBtn: { flex: 1, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  archiveBtnText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  settingsBtn: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 20, borderTopWidth: 1 },
  securityWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  securityText: { fontSize: 10, fontWeight: '900', color: '#10b981', letterSpacing: 0.5 },
  nodeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  fab: { position: 'absolute', bottom: 32, right: 24, width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 12 },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loaderText: { fontSize: 14, fontWeight: '700', marginTop: 12 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptySub: { fontSize: 15, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});
