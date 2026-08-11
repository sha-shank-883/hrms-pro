import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, StatusBar, StyleSheet, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { performanceService } from '../api';
import { Target, Award, ChevronRight, X, Star, ArrowLeft, Trophy, Clock, Info, Activity, Shield, ClipboardCheck } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import Animated, { FadeInDown, SlideInDown, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const ProgressBar = ({ progress, colors }: { progress: number, colors: Record<string, string> }) => {
  const p = Math.min(100, Math.max(0, progress));
  const color = p >= 80 ? '#10b981' : p >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <View style={[styles.progressRail, { backgroundColor: colors.surface }]}>
      <Animated.View style={[styles.progressFill, { width: `${p}%`, backgroundColor: color }]} />
    </View>
  );
};

const GoalCard = ({ goal, index, colors }: { goal: Record<string, any>; index: number; colors: Record<string, string> }) => (
  <Animated.View entering={FadeInDown.delay(index * 80)} layout={ReanimatedLayout.springify()}>
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
          <Target size={24} color={colors.primary} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{goal.title}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.statusPulse, { backgroundColor: goal.progress >= 80 ? '#10b981' : '#f59e0b' }]} />
            <Text style={[styles.badgeText, { color: colors.subtext }]}>{goal.status || 'ACTIVE'}</Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.cardDesc, { color: colors.subtext }]} numberOfLines={2}>{goal.description}</Text>
      
      <View style={styles.metricRow}>
        <View style={styles.metricMeta}>
          <Text style={[styles.metricLabel, { color: colors.subtext }]}>EXECUTION PROGRESS</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{goal.progress}%</Text>
        </View>
        <ProgressBar progress={goal.progress} colors={colors} />
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <View style={[styles.infoBadge, { backgroundColor: colors.surface }]}>
          <Clock size={12} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            TARGET: {new Date(goal.target_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>
    </View>
  </Animated.View>
);

const ReviewCard = ({ review, onPress, index, colors }: { review: Record<string, any>; onPress: () => void; index: number; colors: Record<string, string> }) => (
  <Animated.View entering={FadeInDown.delay(index * 80)} layout={ReanimatedLayout.springify()}>
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
          <Award size={24} color={colors.primary} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{review.review_period}</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star 
                key={s} 
                size={14} 
                color={s <= review.rating ? '#f59e0b' : colors.border} 
                fill={s <= review.rating ? '#f59e0b' : 'transparent'} 
              />
            ))}
          </View>
        </View>
        <View style={[styles.chevronBox, { backgroundColor: colors.surface }]}>
          <ChevronRight size={18} color={colors.subtext} />
        </View>
      </View>
      <View style={[styles.quoteBox, { backgroundColor: colors.surface }]}>
        <Text style={[styles.quoteText, { color: colors.subtext }]} numberOfLines={2}>
          "{review.comments}"
        </Text>
      </View>
    </TouchableOpacity>
  </Animated.View>
);

export default function PerformanceScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { colors, isDark } = useTheme();
  const [goals, setGoals] = useState<Record<string, any>[]>([]);
  const [reviews, setReviews] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'okrs' | 'reviews'>('okrs');
  const [selectedReview, setSelectedReview] = useState<Record<string, any> | null>(null);

  const loadPerformanceData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'okrs') {
        const { data } = await performanceService.getGoals();
        setGoals(data.data || []);
      } else {
        const { data } = await performanceService.getReviews();
        setReviews(data.data || []);
      }
    } catch (error) {
      console.log('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Evaluation</Text>
          <View style={[styles.trophyBox, { backgroundColor: colors.surface }]}>
            <Trophy size={22} color={colors.primary} />
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'okrs' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('okrs')}
          >
            <Target size={16} color={activeTab === 'okrs' ? colors.primary : colors.subtext} strokeWidth={2.5} />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'okrs' ? colors.primary : colors.subtext },
              activeTab === 'okrs' && styles.tabTextActive
            ]}>Objectives</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'reviews' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('reviews')}
          >
            <ClipboardCheck size={16} color={activeTab === 'reviews' ? colors.primary : colors.subtext} strokeWidth={2.5} />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'reviews' ? colors.primary : colors.subtext },
              activeTab === 'reviews' && styles.tabTextActive
            ]}>Reviews</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Synchronizing evaluation data...</Text>
          </View>
        ) : (
          <FlatList
            data={activeTab === 'okrs' ? goals : reviews}
            keyExtractor={(item, index) => `perf-${index}`}
            renderItem={({ item, index }) => 
              activeTab === 'okrs' ? (
                <GoalCard goal={item} index={index} colors={colors} />
              ) : (
                <ReviewCard review={item} index={index} onPress={() => setSelectedReview(item)} colors={colors} />
              )
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
                  {activeTab === 'okrs' ? <Target size={64} color={colors.border} /> : <ClipboardCheck size={64} color={colors.border} />}
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Record Clear</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>
                  No evaluation entries found for this operational sector.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── REVIEW MODAL ── */}
      <Modal visible={!!selectedReview} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setSelectedReview(null)} />
          <Animated.View entering={SlideInDown} style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalSubtitle, { color: colors.primary }]}>DETAILED EVALUATION</Text>
                <Text style={[styles.modalTitleText, { color: colors.text }]}>{selectedReview?.review_period}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedReview(null)} style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={[styles.scoreSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.scoreTop}>
                   <Activity size={14} color={colors.primary} />
                   <Text style={[styles.scoreLabel, { color: colors.primary }]}>PERFORMANCE RATING</Text>
                </View>
                <View style={styles.scoreRow}>
                  <Text style={[styles.scoreValue, { color: colors.text }]}>{selectedReview?.rating}</Text>
                  <Text style={[styles.scoreLimit, { color: colors.subtext }]}>/5.0</Text>
                </View>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={32} 
                      color={s <= (selectedReview?.rating || 0) ? '#f59e0b' : colors.border} 
                      fill={s <= (selectedReview?.rating || 0) ? '#f59e0b' : 'transparent'} 
                    />
                  ))}
                </View>
              </View>

              <View style={styles.commentSection}>
                <View style={styles.commentHeader}>
                  <Info size={14} color={colors.subtext} />
                  <Text style={[styles.commentHeaderText, { color: colors.subtext }]}>EXECUTIVE FEEDBACK</Text>
                </View>
                <View style={[styles.feedbackBox, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
                  <Text style={[styles.feedbackText, { color: colors.text }]}>"{selectedReview?.comments}"</Text>
                </View>
              </View>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <View style={styles.footerRow}>
                  <Shield size={16} color="#10b981" />
                  <Text style={[styles.footerText, { color: colors.text }]}>
                    Verified by {selectedReview?.reviewer_name || 'System Admin'}
                  </Text>
                </View>
                <View style={styles.footerRow}>
                  <Clock size={12} color={colors.subtext} />
                  <Text style={[styles.footerSub, { color: colors.subtext }]}>
                    Dated: {selectedReview?.review_date ? new Date(selectedReview.review_date).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </View>
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
  header: { borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  trophyBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  tabContainer: { flexDirection: 'row', paddingHorizontal: 20 },
  tab: { flex: 1, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '700' },
  tabTextActive: { fontWeight: '800' },

  body: { flex: 1 },
  listContent: { padding: 20 },
  
  card: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusPulse: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  cardDesc: { fontSize: 14, lineHeight: 22, marginBottom: 20, fontWeight: '600' },
  
  metricRow: { gap: 10, marginBottom: 20 },
  metricMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  metricValue: { fontSize: 15, fontWeight: '800' },
  progressRail: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  
  cardFooter: { borderTopWidth: 1, paddingTop: 16 },
  infoBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  infoText: { fontSize: 11, fontWeight: '800' },

  starRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  chevronBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quoteBox: { padding: 16, borderRadius: 16 },
  quoteText: { fontSize: 13, fontStyle: 'italic', lineHeight: 20, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: height * 0.9 },
  modalHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  modalSubtitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  modalTitleText: { fontSize: 24, fontWeight: '800' },
  modalCloseBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 24 },

  scoreSection: { alignItems: 'center', marginBottom: 32, padding: 24, borderRadius: 28, borderWidth: 1 },
  scoreTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  scoreLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  scoreValue: { fontSize: 64, fontWeight: '800' },
  scoreLimit: { fontSize: 24, fontWeight: '800', marginLeft: 4 },
  ratingStars: { flexDirection: 'row', gap: 10 },

  commentSection: { gap: 12, marginBottom: 32 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentHeaderText: { fontSize: 11, fontWeight: '800' },
  feedbackBox: { padding: 20, borderRadius: 24, borderLeftWidth: 4 },
  feedbackText: { fontSize: 15, lineHeight: 26, fontWeight: '700', fontStyle: 'italic' },

  modalFooter: { paddingVertical: 20, borderTopWidth: 1, gap: 8 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { fontSize: 13, fontWeight: '700' },
  footerSub: { fontSize: 11, fontWeight: '600' },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loaderText: { fontSize: 14, fontWeight: '700', marginTop: 12 },
  emptyWrap: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptySub: { fontSize: 15, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});
