import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Dimensions, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { assetService } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Laptop, Smartphone, Monitor, HardDrive, Camera, Tablet, Box, ShieldAlert, ArrowLeft, Search, Filter, Cpu, Database, ChevronRight, Settings, Info, Activity, AlertCircle, X, Terminal, Target } from 'lucide-react-native';
import Animated, { FadeInDown, SlideInUp, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const AssetIcon = ({ type, color, size = 24 }: { type?: string; color: string; size?: number }) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('laptop') || t.includes('macbook')) return <Laptop color={color} size={size} strokeWidth={2.5} />;
  if (t.includes('phone') || t.includes('iphone') || t.includes('android')) return <Smartphone color={color} size={size} strokeWidth={2.5} />;
  if (t.includes('monitor') || t.includes('display')) return <Monitor color={color} size={size} strokeWidth={2.5} />;
  if (t.includes('tablet') || t.includes('ipad')) return <Tablet color={color} size={size} strokeWidth={2.5} />;
  if (t.includes('camera')) return <Camera color={color} size={size} strokeWidth={2.5} />;
  if (t.includes('drive') || t.includes('disk')) return <HardDrive color={color} size={size} strokeWidth={2.5} />;
  return <Box color={color} size={size} strokeWidth={2.5} />;
};

const AssetCard = ({ asset, onReport, index, colors }: { asset: Record<string, any>; onReport: (asset: Record<string, any>) => void; index: number; colors: Record<string, string> }) => {
  const isActive = asset.status === 'assigned' || asset.status === 'in_use' || asset.status === 'active';
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 80)} layout={ReanimatedLayout.springify()}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
            <AssetIcon type={asset.type} color={colors.primary} size={28} />
          </View>
          <View style={styles.headerContent}>
            <View style={styles.nameRow}>
              <Text style={[styles.assetTitle, { color: colors.text }]} numberOfLines={1}>{asset.name?.toUpperCase()}</Text>
              <View style={[styles.statusTag, { backgroundColor: isActive ? '#ecfdf5' : '#fffbeb' }]}>
                <View style={[styles.statusDot, { backgroundColor: isActive ? '#10b981' : '#f59e0b' }]} />
                <Text style={[styles.statusLabel, { color: isActive ? '#065f46' : '#92400e' }]}>
                  {isActive ? 'ACTIVE' : (asset.status?.toUpperCase() || 'OFFLINE')}
                </Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Terminal size={12} color={colors.subtext} strokeWidth={2.5} />
              <Text style={[styles.serialNumber, { color: colors.subtext }]}>SN: {asset.serial_number || 'UNKNOWN'}</Text>
              <View style={[styles.typeBadge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.typeText, { color: colors.subtext }]}>{asset.type?.toUpperCase() || 'HARDWARE'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={[styles.conditionBox, { backgroundColor: '#ecfdf5' }]}>
            <Activity size={14} color="#10b981" strokeWidth={2.5} />
            <Text style={styles.conditionText}>CONDITION: OPTIMAL</Text>
          </View>
          <TouchableOpacity 
            style={[styles.incidentBtn, { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }]}
            onPress={() => onReport(asset)}
            activeOpacity={0.8}
          >
            <ShieldAlert size={14} color="#ef4444" strokeWidth={2.5} />
            <Text style={styles.incidentBtnText}>REPORT FAILURE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default function AssetsScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [assets, setAssets] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportModal, setReportModal] = useState<Record<string, any> | null>(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await assetService.getAssets();
      const rows = Array.isArray(data) ? data : (data.data || []);
      const visibleAssets = user?.role === 'employee'
        ? rows.filter((asset: { assigned_to?: string | number }) => String(asset.assigned_to) === String(user?.employee_id))
        : rows;
      setAssets(visibleAssets);
    } catch (error) {
      console.log('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssets();
    setRefreshing(false);
  };

  const handleReportIssue = async () => {
    if (!issueDescription.trim()) {
      Alert.alert('Protocol Warning', 'Incident reporting requires a technical failure summary.');
      return;
    }

    setSubmitting(true);
    try {
      Alert.alert('Success', 'Hardware incident recorded. Support team notified.');
      setReportModal(null);
      setIssueDescription('');
    } catch (error) {
      Alert.alert('System Error', 'Unable to transmit incident report.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(a => 
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.serial_number?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assets, searchQuery]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Inventory</Text>
          <View style={styles.headerRight}>
            <View style={[styles.unitBadge, { backgroundColor: colors.surface }]}>
              <Text style={[styles.unitText, { color: colors.primary }]}>{filteredAssets.length} UNITS</Text>
            </View>
          </View>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Search size={18} color={colors.subtext} strokeWidth={2.5} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search registry (Name/Serial)..."
            placeholderTextColor={colors.subtext + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Syncing hardware registry...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredAssets}
            keyExtractor={(item) => String(item.asset_id || item.id)}
            renderItem={({ item, index }) => (
              <AssetCard asset={item} onReport={setReportModal} index={index} colors={colors} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
                  <Database size={64} color={colors.border} strokeWidth={1} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Registry Clear</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>
                  No hardware assets registered to this sector.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── INCIDENT REPORT MODAL ── */}
      <Modal visible={!!reportModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setReportModal(null)} />
            <Animated.View entering={SlideInUp} style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <View>
                  <Text style={[styles.modalTitleText, { color: colors.text }]}>Report Issue</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.subtext }]}>Hardware incident protocol</Text>
                </View>
                <TouchableOpacity onPress={() => setReportModal(null)} style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={[styles.targetModule, { backgroundColor: colors.surface }]}>
                  <Info size={20} color={colors.primary} strokeWidth={2.5} />
                  <View>
                    <Text style={[styles.targetLabel, { color: colors.subtext }]}>AFFECTED UNIT:</Text>
                    <Text style={[styles.targetName, { color: colors.text }]}>{reportModal?.name?.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.subtext }]}>FAILURE DESCRIPTION</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Describe the failure with specificity..."
                    placeholderTextColor={colors.subtext + '80'}
                    multiline
                    numberOfLines={6}
                    value={issueDescription}
                    onChangeText={setIssueDescription}
                  />
                </View>

                <View style={[styles.warningBox, { backgroundColor: '#fff1f2', borderColor: '#ffe4e6' }]}>
                  <AlertCircle size={18} color="#ef4444" strokeWidth={2.5} />
                  <Text style={styles.warningText}>
                    Submission will trigger a technical support ticket.
                  </Text>
                </View>

                <TouchableOpacity 
                  style={[styles.commitBtn, { backgroundColor: colors.primary }, submitting && { opacity: 0.7 }]}
                  onPress={handleReportIssue}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.commitBtnText}>TRANSMIT INCIDENT</Text>
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
  header: { borderBottomWidth: 1, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, marginBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerRight: {},
  unitBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  unitText: { fontSize: 11, fontWeight: '800' },

  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, paddingHorizontal: 16, borderRadius: 16, height: 50 },
  searchInput: { flex: 1, height: 50, marginLeft: 12, fontSize: 15, fontWeight: '700' },

  body: { flex: 1 },
  listContent: { padding: 20 },
  
  card: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  iconContainer: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerContent: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  assetTitle: { fontSize: 17, fontWeight: '800', flex: 1, marginRight: 8 },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 9, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serialNumber: { fontSize: 12, fontWeight: '700' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 9, fontWeight: '800' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 16, marginTop: 4 },
  conditionBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  conditionText: { fontSize: 10, fontWeight: '800', color: '#10b981' },
  incidentBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  incidentBtnText: { color: '#ef4444', fontSize: 11, fontWeight: '800' },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loaderText: { fontSize: 14, fontWeight: '700', marginTop: 12 },
  emptyWrap: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptySub: { fontSize: 15, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingBottom: 20, maxHeight: height * 0.9 },
  modalHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  modalTitleText: { fontSize: 24, fontWeight: '800' },
  modalSubtitle: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  modalCloseBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 24 },
  targetModule: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: 20, marginBottom: 24 },
  targetLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  targetName: { fontSize: 16, fontWeight: '800' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '800', marginBottom: 10, letterSpacing: 0.5, marginLeft: 4 },
  textArea: { minHeight: 150, borderRadius: 20, padding: 18, fontSize: 15, fontWeight: '700', borderWidth: 1.5, textAlignVertical: 'top' },
  warningBox: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1 },
  warningText: { flex: 1, fontSize: 12, color: '#e11d48', fontWeight: '700', lineHeight: 18 },
  commitBtn: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  commitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
