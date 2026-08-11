import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Alert, Linking, StatusBar, StyleSheet, Dimensions, RefreshControl, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, documentService } from '../api';
import { useTheme } from '../context/ThemeContext';
import { FileText, Lock, FileCode, Search, X, Shield, ArrowLeft, ChevronRight, HardDrive, Eye, FileCheck, Info, UserCheck } from 'lucide-react-native';
import Animated, { FadeInDown, SlideInUp, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const CATEGORIES = ['All', 'Policy', 'Contract', 'Payslip', 'ID'];

const getFileMeta = (type: string) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('contract') || t.includes('agreement')) return { icon: FileCheck, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' };
  if (t.includes('id') || t.includes('passport') || t.includes('license')) return { icon: Shield, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
  if (t.includes('payslip') || t.includes('tax')) return { icon: FileCode, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
  return { icon: FileText, color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };
};

const DocumentCard = ({ doc, onPress, index, colors }: { doc: Record<string, any>; onPress: (doc: Record<string, any>) => void; index: number; colors: Record<string, string> }) => {
  const { icon: Icon, color, bg } = getFileMeta(doc.document_type);
  const formattedDate = doc?.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'ARCHIVED';

  return (
    <Animated.View entering={FadeInDown.delay(index * 80)} layout={ReanimatedLayout.springify()}>
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => onPress(doc)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          <Icon size={24} color={color} strokeWidth={2.5} />
          <View style={styles.lockBadge}>
            <Lock size={8} color="#fff" fill="#fff" />
          </View>
        </View>
        
        <View style={styles.cardInfo}>
          <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>{doc.document_name}</Text>
          <View style={styles.metaRow}>
            <Text style={[styles.docType, { color }]}>{doc.document_type?.toUpperCase() || 'GENERAL'}</Text>
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
            <Text style={[styles.docDate, { color: colors.subtext }]}>{formattedDate}</Text>
          </View>
        </View>

        <View style={[styles.chevronBox, { backgroundColor: colors.surface }]}>
          <ChevronRight size={18} color={colors.subtext} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function DocumentsScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { colors, isDark } = useTheme();
  const [documents, setDocuments] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vaultModal, setVaultModal] = useState<Record<string, any> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await documentService.getDocuments();
      setDocuments(data.data || []);
    } catch (error) {
      console.log('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const handleAccess = (fileUrl: string) => {
    Alert.alert(
      'Document Protocol',
      'Authorize biometric clearance to view this encrypted document?',
      [
        { text: 'ABORT', style: 'cancel' },
        {
          text: 'AUTHORIZE',
          onPress: async () => {
            setSubmitting(true);
            try {
              if (fileUrl) {
                const resolvedUrl = fileUrl.startsWith('http') ? fileUrl : `${API_URL.replace('/api', '')}${fileUrl}`;
                await Linking.openURL(resolvedUrl);
              }
              setVaultModal(null);
            } catch (error) {
              Alert.alert('Protocol Error', 'Unable to decrypt document link.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const matchesCat = activeCategory === 'All' || (d.document_type || '').toLowerCase() === activeCategory.toLowerCase();
      const matchesSearch = (d.document_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [documents, activeCategory, searchQuery]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Vault</Text>
          <View style={[styles.vaultIconBox, { backgroundColor: colors.surface }]}>
            <Shield size={22} color={colors.primary} />
          </View>
        </View>

        <View style={[styles.searchModule, { backgroundColor: colors.surface }]}>
          <Search size={18} color={colors.subtext} strokeWidth={2.5} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search secure archives..."
            placeholderTextColor={colors.subtext + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.filterChip, 
                { backgroundColor: colors.surface },
                activeCategory === cat && { backgroundColor: colors.primary }
              ]}
            >
              <Text style={[
                styles.filterText, 
                { color: colors.subtext },
                activeCategory === cat && { color: '#fff' }
              ]}>
                {cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Syncing secure archives...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredDocs}
            keyExtractor={(item, index) => `doc-${index}`}
            renderItem={({ item, index }) => (
              <DocumentCard doc={item} onPress={setVaultModal} index={index} colors={colors} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
                  <HardDrive size={64} color={colors.border} strokeWidth={1} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Vault Empty</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>
                  No documents found in this sector.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── DOCUMENT DETAILS MODAL ── */}
      <Modal visible={!!vaultModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setVaultModal(null)} />
          <Animated.View entering={SlideInUp} style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalSubtitle, { color: colors.primary }]}>SECURE ARCHIVE</Text>
                <Text style={[styles.modalTitleText, { color: colors.text }]}>File Details</Text>
              </View>
              <TouchableOpacity onPress={() => setVaultModal(null)} style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.previewModule}>
                <View style={styles.previewIconBox}>
                   <View style={[styles.previewBackdrop, { backgroundColor: colors.primary + '10' }]} />
                   <FileText size={64} color={colors.primary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.previewFileName, { color: colors.text }]}>{vaultModal?.document_name}</Text>
                <View style={[styles.verifiedBadge, { backgroundColor: '#ecfdf5' }]}>
                  <UserCheck size={12} color="#10b981" />
                  <Text style={styles.verifiedText}>ENCRYPTED VAULT</Text>
                </View>
              </View>

              <View style={[styles.metaGrid, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: colors.subtext }]}>CLASSIFICATION</Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>
                    {vaultModal?.document_type || 'General'}
                  </Text>
                </View>
                <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: colors.subtext }]}>INDEXED</Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>
                    {vaultModal?.uploaded_at ? new Date(vaultModal.uploaded_at).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                <Info size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  Internal document protocol: Data must be handled according to sector security standards.
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.decryptBtn, { backgroundColor: colors.primary }, submitting && { opacity: 0.7 }]}
                onPress={() => handleAccess(vaultModal?.file_url)}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.decryptBtnText}>DECRYPT & VIEW</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </Animated.View>
        </View>
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
  vaultIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  searchModule: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, paddingHorizontal: 16, borderRadius: 16, height: 50, marginBottom: 16 },
  searchInput: { flex: 1, height: 50, marginLeft: 12, fontSize: 15, fontWeight: '700' },

  filterBar: { paddingHorizontal: 20, gap: 10 },
  filterChip: { paddingHorizontal: 16, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 11, fontWeight: '800' },

  body: { flex: 1 },
  listContent: { padding: 20 },
  
  card: { borderRadius: 24, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1 },
  iconBox: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  lockBadge: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  cardInfo: { flex: 1, gap: 4 },
  docName: { fontSize: 16, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  docType: { fontSize: 10, fontWeight: '800' },
  docDate: { fontSize: 11, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  chevronBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loaderText: { fontSize: 14, fontWeight: '700', marginTop: 12 },
  emptyWrap: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptySub: { fontSize: 15, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingBottom: 20, maxHeight: height * 0.9 },
  modalHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  modalSubtitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  modalTitleText: { fontSize: 24, fontWeight: '800' },
  modalCloseBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 24 },
  
  previewModule: { alignItems: 'center', marginBottom: 32 },
  previewIconBox: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  previewBackdrop: { position: 'absolute', width: 90, height: 90, borderRadius: 28, transform: [{ rotate: '15deg' }] },
  previewFileName: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  verifiedText: { fontSize: 11, fontWeight: '800', color: '#10b981' },

  metaGrid: { flexDirection: 'row', borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1 },
  metaItem: { flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 10, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 },
  metaValue: { fontSize: 15, fontWeight: '800' },
  metaDivider: { width: 1, height: '70%', alignSelf: 'center' },

  infoCard: { flexDirection: 'row', gap: 12, padding: 20, borderRadius: 20, marginBottom: 32 },
  infoText: { flex: 1, fontSize: 14, fontWeight: '700', lineHeight: 22 },

  decryptBtn: { height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8 },
  decryptBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
