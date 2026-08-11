import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Linking, StatusBar, StyleSheet, Dimensions, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recruitmentService } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Briefcase, Users, ChevronRight, MapPin, DollarSign, X, CheckCircle, Clock, XCircle, Phone, Mail, ArrowLeft, Search, Filter, UserCheck, TrendingUp, Award, Calendar, FileText, Globe, ArrowUpRight, Zap, Database, Terminal, Shield, Building2 } from 'lucide-react-native';
import Animated, { FadeInDown, SlideInUp, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const JobCard = ({ job, appCount, onPress, index, colors }: { job: Record<string, any>; appCount: number; onPress: () => void; index: number; colors: Record<string, string> }) => (
  <Animated.View entering={FadeInDown.delay(index * 100)} layout={ReanimatedLayout.springify()}>
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.jobInfo}>
          <Text style={[styles.jobTitle, { color: colors.text }]}>{job.title}</Text>
          <View style={styles.locRow}>
            <MapPin size={12} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.locText, { color: colors.subtext }]}>{job.location || 'Remote'}</Text>
          </View>
        </View>
        <View style={[styles.appModule, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }]}>
          <Text style={[styles.appCount, { color: colors.primary }]}>{appCount}</Text>
          <Text style={[styles.appLabel, { color: colors.primary }]}>Applicants</Text>
        </View>
      </View>

      <View style={styles.tagGrid}>
        <View style={[styles.tag, { backgroundColor: colors.background }]}>
          <Clock size={12} color={colors.subtext} />
          <Text style={[styles.tagText, { color: colors.subtext }]}>{job.position_type || 'Full-time'}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: colors.background }]}>
          <Building2 size={12} color={colors.subtext} />
          <Text style={[styles.tagText, { color: colors.subtext }]}>On-site</Text>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: job.status === 'open' ? '#10b981' : colors.subtext }]} />
          <Text style={[styles.statusText, { color: job.status === 'open' ? '#10b981' : colors.subtext }]}>
            {job.status === 'open' ? 'Actively Hiring' : 'Closed'}
          </Text>
        </View>
        <View style={[styles.chevronWrap, { backgroundColor: colors.background }]}>
          <ChevronRight size={18} color={colors.subtext} strokeWidth={3} />
        </View>
      </View>
    </TouchableOpacity>
  </Animated.View>
);

const CandidateCard = ({ app, index, colors }: { app: Record<string, any>; index: number; colors: Record<string, string> }) => {
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hired':
      case 'accepted': return { color: '#10b981', bg: '#ecfdf5', label: 'Hired' };
      case 'rejected': return { color: '#ef4444', bg: '#fef2f2', label: 'Rejected' };
      case 'interview': return { color: '#6366f1', bg: '#f5f3ff', label: 'Interview' };
      default: return { color: colors.primary, bg: colors.primary + '10', label: 'New' };
    }
  };
  const config = getStatusConfig(app.status);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50)} style={[styles.candidateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.candidateHeader}>
        <View style={styles.candidateIdentity}>
          <Text style={[styles.candidateName, { color: colors.text }]}>{app.applicant_name}</Text>
          <View style={styles.candidateEmailRow}>
            <Mail size={12} color={colors.subtext} />
            <Text style={[styles.candidateEmail, { color: colors.subtext }]}>{app.email}</Text>
          </View>
        </View>
        <View style={[styles.statusTag, { backgroundColor: config.bg }]}>
          <View style={[styles.statusTagDot, { backgroundColor: config.color }]} />
          <Text style={[styles.statusTagText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>
      
      <View style={styles.candidateActions}>
        <TouchableOpacity 
          style={[styles.actionBtnPrimary, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
          onPress={() => Linking.openURL(`mailto:${app.email}`)}
          activeOpacity={0.8}
        >
          <Mail size={14} color={colors.primary} strokeWidth={2.5} />
          <Text style={[styles.actionBtnTextPrimary, { color: colors.primary }]}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtnSecondary, { backgroundColor: colors.background, borderColor: colors.border }]} activeOpacity={0.8}>
          <FileText size={14} color={colors.subtext} strokeWidth={2.5} />
          <Text style={[styles.actionBtnTextSecondary, { color: colors.subtext }]}>Resume</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function RecruitmentScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [jobs, setJobs] = useState<Record<string, any>[]>([]);
  const [applications, setApplications] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Record<string, any> | null>(null);

  const loadRecruitmentData = useCallback(async () => {
    try {
      setLoading(true);
      const [jobsRes, appsRes] = await Promise.all([
        recruitmentService.getJobs(),
        recruitmentService.getApplications()
      ]);
      setJobs(jobsRes.data.data || []);
      setApplications(appsRes.data.data || []);
    } catch (error) {
      console.log('Error loading recruitment data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecruitmentData();
  }, [loadRecruitmentData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecruitmentData();
    setRefreshing(false);
  }, [loadRecruitmentData]);

  const getAppsForJob = (jobId: number) => {
    return applications.filter(app => app.job_id === jobId);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Recruitment</Text>
          <View style={styles.headerBadgeBox}>
            <Briefcase size={22} color={colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Loading pipeline...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          >
            <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: colors.subtext }]}>ACTIVE POSITIONS</Text>
               <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
            </View>

            {jobs.length === 0 ? (
              <View style={styles.emptyModule}>
                <Globe size={64} color={colors.border} strokeWidth={1} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Pipeline empty</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>There are no active job requisitions at this time.</Text>
              </View>
            ) : (
              jobs.map((item, index) => (
                <JobCard 
                  key={index} 
                  job={item} 
                  index={index}
                  colors={colors}
                  appCount={getAppsForJob(item.job_id || item.id).length}
                  onPress={() => setSelectedJob(item)}
                />
              ))
            )}
            <View style={{ height: 60 }} />
          </ScrollView>
        )}
      </View>

      {/* ── CANDIDATE MODAL ── */}
      <Modal visible={!!selectedJob} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setSelectedJob(null)} />
          <Animated.View entering={SlideInUp} style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalLabel, { color: colors.primary }]}>Applications</Text>
                <Text style={[styles.modalTitleText, { color: colors.text }]}>{selectedJob?.title}</Text>
                <View style={styles.modalMetaRow}>
                  <Users size={14} color={colors.subtext} />
                  <Text style={[styles.modalMetaText, { color: colors.subtext }]}>
                    {getAppsForJob(selectedJob?.job_id || selectedJob?.id).length} Applicants
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setSelectedJob(null)} style={[styles.modalCloseBtn, { backgroundColor: colors.card }]}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={getAppsForJob(selectedJob?.job_id || selectedJob?.id)}
              keyExtractor={(item, index) => item.application_id?.toString() || item.id?.toString() || index.toString()}
              renderItem={({ item, index }) => <CandidateCard app={item} index={index} colors={colors} />}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.modalEmptyWrap}>
                  <Users size={48} color={colors.border} strokeWidth={1} />
                  <Text style={[styles.modalEmptyTitle, { color: colors.text }]}>No Applicants</Text>
                  <Text style={[styles.modalEmptySub, { color: colors.subtext }]}>No candidates have applied for this position yet.</Text>
                </View>
              }
            />
          </Animated.View>
        </View>
      </Modal>
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

  card: { borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  jobInfo: { flex: 1, gap: 4 },
  jobTitle: { fontSize: 19, fontWeight: '800' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locText: { fontSize: 13, fontWeight: '600' },
  appModule: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, alignItems: 'center', borderWidth: 1 },
  appCount: { fontSize: 18, fontWeight: '800' },
  appLabel: { fontSize: 9, fontWeight: '800', marginTop: -2 },

  tagGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '700' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  chevronWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  emptyModule: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySub: { fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: height * 0.8 },
  modalHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  modalTitleText: { fontSize: 24, fontWeight: '800' },
  modalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  modalMetaText: { fontSize: 14, fontWeight: '600' },
  modalCloseBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  modalList: { padding: 24, paddingTop: 0 },
  candidateCard: { borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1 },
  candidateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  candidateIdentity: { flex: 1, gap: 2 },
  candidateName: { fontSize: 17, fontWeight: '800' },
  candidateEmailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  candidateEmail: { fontSize: 13, fontWeight: '600' },
  statusTag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusTagDot: { width: 6, height: 6, borderRadius: 3 },
  statusTagText: { fontSize: 11, fontWeight: '800' },

  candidateActions: { flexDirection: 'row', gap: 10 },
  actionBtnPrimary: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1 },
  actionBtnTextPrimary: { fontSize: 14, fontWeight: '800' },
  actionBtnSecondary: { flex: 1, height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1 },
  actionBtnTextSecondary: { fontSize: 14, fontWeight: '800' },

  modalEmptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  modalEmptyTitle: { fontSize: 18, fontWeight: '800' },
  modalEmptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
