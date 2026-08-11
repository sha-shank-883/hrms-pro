import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform, StyleSheet, Dimensions, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { leadService } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserPlus, Phone, Mail, MessageSquare, Plus, X, Tag, ArrowLeft, Search, Building2, Target, TrendingUp, Filter, CheckCircle2, ChevronRight, Database, Info, Terminal, Activity, Zap, Shield, Briefcase } from 'lucide-react-native';
import Animated, { FadeInDown, SlideInUp, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const LeadCard = ({ lead, index, colors }: { lead: Record<string, any>; index: number; colors: Record<string, string> }) => {
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', label: 'NEW INBOUND' };
      case 'contacted': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'ENGAGED' };
      case 'qualified': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'QUALIFIED' };
      case 'lost': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'TERMINATED' };
      default: return { color: colors.subtext, bg: colors.surface, label: status?.toUpperCase() || 'UNKNOWN' };
    }
  };
  const config = getStatusConfig(lead.status);

  return (
    <Animated.View entering={FadeInDown.delay(index * 80)} layout={ReanimatedLayout.springify()}>
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.leadInfo}>
            <Text style={[styles.leadName, { color: colors.text }]} numberOfLines={1}>{lead.name}</Text>
            <View style={styles.companyRow}>
              <Briefcase size={12} color={colors.primary} strokeWidth={2.5} />
              <Text style={[styles.companyText, { color: colors.subtext }]} numberOfLines={1}>
                {lead.company_name || 'Private Enterprise'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={[styles.contactSection, { backgroundColor: colors.background }]}>
          <View style={styles.contactItem}>
            <Mail size={14} color={colors.subtext} strokeWidth={2} />
            <Text style={[styles.contactText, { color: colors.text }]}>{lead.email?.toLowerCase()}</Text>
          </View>
          {lead.phone && (
            <View style={styles.contactItem}>
              <Phone size={14} color={colors.subtext} strokeWidth={2} />
              <Text style={[styles.contactText, { color: colors.text }]}>{lead.phone}</Text>
            </View>
          )}
        </View>

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.sourceWrap}>
            <Tag size={12} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.sourceText, { color: colors.subtext }]}>SOURCE: {lead.source || 'Organic'}</Text>
          </View>
          <View style={[styles.analysisBtn, { backgroundColor: colors.surface }]}>
            <Text style={[styles.analysisBtnText, { color: colors.primary }]}>DETAILS</Text>
            <ChevronRight size={14} color={colors.primary} strokeWidth={3} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function LeadsScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [leads, setLeads] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    password: 'Password123',
    source: 'Mobile App',
    notes: ''
  });

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await leadService.getLeads();
      setLeads(data.data || []);
    } catch (error) {
      console.log('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLeads();
    setRefreshing(false);
  }, [loadLeads]);

  const handleCreateLead = async () => {
    if (!newLead.name || !newLead.email || !newLead.company_name) {
      Alert.alert('Incomplete Protocol', 'Operational critical fields (Name, Email, Org) are mandatory.');
      return;
    }

    setSubmitting(true);
    try {
      await leadService.createLead(newLead);
      setIsModalVisible(false);
      setNewLead({ name: '', email: '', phone: '', company_name: '', password: 'Password123', source: 'Mobile App', notes: '' });
      loadLeads();
      Alert.alert('Pipeline Updated', 'Prospect synchronized with master registry.');
    } catch (error) {
      Alert.alert('Sync Failure', 'Unable to transmit prospect data.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => 
      l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leads, searchQuery]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Pipeline</Text>
          <TouchableOpacity 
            onPress={() => setIsModalVisible(true)}
            style={[styles.addIconBox, { backgroundColor: colors.primary }]}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchModule, { backgroundColor: colors.surface }]}>
          <Search size={18} color={colors.subtext} strokeWidth={2.5} />
          <TextInput 
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search prospects or entities..."
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
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Syncing pipeline data...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredLeads}
            keyExtractor={(item, index) => `lead-${index}`}
            renderItem={({ item, index }) => (
              <LeadCard lead={item} index={index} colors={colors} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
                  <Target size={64} color={colors.border} strokeWidth={1} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Pipeline Clear</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>
                  No prospect activity detected in this sector.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── PROSPECT REGISTRATION MODAL ── */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setIsModalVisible(false)} />
            <Animated.View entering={SlideInUp} style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <View>
                  <Text style={[styles.modalSubtitle, { color: colors.primary }]}>PIPELINE ENTRY</Text>
                  <Text style={[styles.modalTitleText, { color: colors.text }]}>New Prospect</Text>
                </View>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.subtext }]}>FULL NAME *</Text>
                  <TextInput 
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="ENTER NAME..."
                    placeholderTextColor={colors.subtext + '60'}
                    value={newLead.name}
                    onChangeText={(text) => setNewLead({...newLead, name: text})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.subtext }]}>ORGANIZATION *</Text>
                  <TextInput 
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="ENTER COMPANY..."
                    placeholderTextColor={colors.subtext + '60'}
                    value={newLead.company_name}
                    onChangeText={(text) => setNewLead({...newLead, company_name: text})}
                  />
                </View>

                <View style={styles.inputGrid}>
                  <View style={{ flex: 1.2 }}>
                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>EMAIL *</Text>
                    <TextInput 
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="EMAIL..."
                      placeholderTextColor={colors.subtext + '60'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={newLead.email}
                      onChangeText={(text) => setNewLead({...newLead, email: text})}
                    />
                  </View>
                  <View style={{ flex: 0.8, marginLeft: 12 }}>
                    <Text style={[styles.inputLabel, { color: colors.subtext }]}>PHONE</Text>
                    <TextInput 
                      style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                      placeholder="PHONE..."
                      placeholderTextColor={colors.subtext + '60'}
                      keyboardType="phone-pad"
                      value={newLead.phone}
                      onChangeText={(text) => setNewLead({...newLead, phone: text})}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.subtext }]}>STRATEGIC NOTES</Text>
                  <TextInput 
                    style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="INTEL NOTES..."
                    placeholderTextColor={colors.subtext + '60'}
                    multiline
                    numberOfLines={4}
                    value={newLead.notes}
                    onChangeText={(text) => setNewLead({...newLead, notes: text})}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.commitBtn, { backgroundColor: colors.primary }, submitting && { opacity: 0.7 }]}
                  onPress={handleCreateLead}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.commitBtnText}>COMMIT TO PIPELINE</Text>
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
  addIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  searchModule: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, paddingHorizontal: 16, borderRadius: 16, height: 50 },
  searchInput: { flex: 1, height: 50, marginLeft: 12, fontSize: 15, fontWeight: '700' },

  body: { flex: 1 },
  listContent: { padding: 20 },
  
  card: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  leadInfo: { flex: 1, gap: 4 },
  leadName: { fontSize: 18, fontWeight: '800' },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  companyText: { fontSize: 12, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },

  contactSection: { gap: 12, marginBottom: 20, padding: 16, borderRadius: 18 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactText: { fontSize: 14, fontWeight: '700' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 16 },
  sourceWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceText: { fontSize: 11, fontWeight: '700' },
  analysisBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  analysisBtnText: { fontSize: 11, fontWeight: '800' },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loaderText: { fontSize: 14, fontWeight: '700', marginTop: 12 },
  emptyWrap: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptySub: { fontSize: 15, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: height * 0.9 },
  modalHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  modalSubtitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  modalTitleText: { fontSize: 24, fontWeight: '800' },
  modalCloseBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 24 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '800', marginBottom: 8, letterSpacing: 0.5 },
  input: { borderRadius: 16, paddingHorizontal: 16, height: 56, fontSize: 15, fontWeight: '700', borderWidth: 1 },
  inputGrid: { flexDirection: 'row', marginBottom: 20 },
  textArea: { borderRadius: 20, padding: 16, fontSize: 15, fontWeight: '700', minHeight: 100, borderWidth: 1, textAlignVertical: 'top' },
  commitBtn: { height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8, marginTop: 10 },
  commitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
