import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Linking, StyleSheet, StatusBar, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cmsService } from '../api';
import { useTheme } from '../context/ThemeContext';
import { 
  PlayCircle, ExternalLink, FileText, Settings as SettingsIcon, ArrowLeft, Palette, Type, Layout as LayoutIcon, Globe, ChevronRight, Edit3, Eye, Terminal, Shield, Activity, Layers, Globe2, Server 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const PageCard = React.memo(({ page, index, colors }: { page: any; index: number; colors: Record<string, string> }) => {
  const isPublished = page.published_status === 'published';
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} layout={ReanimatedLayout.springify()}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.pageIconBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LayoutIcon color={colors.primary} size={24} strokeWidth={2} />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isPublished ? '#ecfdf5' : colors.surface }]}>
            <View style={[styles.statusDot, { backgroundColor: isPublished ? '#10b981' : colors.subtext }]} />
            <Text style={[styles.statusText, { color: isPublished ? '#065f46' : colors.subtext }]}>
              {page.published_status?.toUpperCase() || 'DRAFT'}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{page.title}</Text>
          <View style={styles.slugWrap}>
            <Terminal size={12} color={colors.subtext} />
            <Text style={[styles.pageSlug, { color: colors.subtext }]}>/{page.slug}</Text>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={[styles.previewBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => Linking.openURL(`https://hrmspropro.com/${page.slug}`)}
            activeOpacity={0.7}
          >
            <Eye size={16} color={colors.subtext} strokeWidth={2.5} />
            <Text style={[styles.previewText, { color: colors.subtext }]}>PREVIEW</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.primary }]} activeOpacity={0.9}>
            <Edit3 size={16} color="#fff" strokeWidth={2.5} />
            <Text style={styles.editText}>CONFIGURE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});

export default function CMSPageScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [pages, setPages] = useState<Record<string, any>[]>([]);
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCMSData = useCallback(async () => {
    try {
      setLoading(true);
      const [pagesRes, settingsRes] = await Promise.all([
        cmsService.getPages(),
        cmsService.getWebsiteSettings()
      ]);
      setPages(pagesRes.data.data || []);
      setSettings(settingsRes.data.data || null);
    } catch (error) {
      console.log('Error loading CMS data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCMSData();
  }, [loadCMSData]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Website Console</Text>
          <View style={[styles.headerIconBox, { backgroundColor: colors.surface }]}>
            <Globe2 size={22} color={colors.primary} />
          </View>
        </View>
        
        <View style={styles.headerStats}>
           <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: colors.text }]}>{pages.length}</Text>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>INDEXED PAGES</Text>
           </View>
           <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
           <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: colors.text }]}>{pages.filter(p => p.published_status === 'published').length}</Text>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>LIVE DEPLOYMENTS</Text>
           </View>
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Syncing content core...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Branding Intelligence Card */}
            <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.settingsHeader}>
                <View style={[styles.settingsIconBox, { backgroundColor: colors.surface }]}>
                  <Palette size={20} color={colors.primary} strokeWidth={2} />
                </View>
                <View>
                  <Text style={[styles.settingsTitle, { color: colors.text }]}>Brand Protocol</Text>
                  <Text style={[styles.settingsSubtitle, { color: colors.subtext }]}>VISUAL IDENTITY CONFIGURATION</Text>
                </View>
              </View>
              
              <View style={[styles.brandGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.brandItem}>
                  <Text style={[styles.brandLabel, { color: colors.subtext }]}>PRIMARY HEX</Text>
                  <View style={styles.brandValueRow}>
                    <View style={[styles.colorIndicator, { backgroundColor: settings?.primary_color || colors.primary }]} />
                    <Text style={[styles.brandValueText, { color: colors.text }]}>{settings?.primary_color?.toUpperCase() || colors.primary?.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
                <View style={styles.brandItem}>
                  <Text style={[styles.brandLabel, { color: colors.subtext }]}>ARCHITECTURE</Text>
                  <View style={styles.brandValueRow}>
                    <Type size={16} color={colors.subtext} />
                    <Text style={[styles.brandValueText, { color: colors.text }]}>{settings?.font_family || 'Standard UI'}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Layers size={14} color={colors.subtext} />
              <Text style={[styles.sectionHeaderText, { color: colors.subtext }]}>CONTENT REPOSITORY</Text>
              <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
            </View>
            
            {pages.length === 0 ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
                  <FileText color={colors.border} size={64} strokeWidth={1} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Archive Empty</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>No operational pages detected in the current terminal environment.</Text>
              </View>
            ) : (
              pages.map((page, idx) => (
                <PageCard key={idx} page={page} index={idx} colors={colors} />
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
  header: { borderBottomWidth: 1, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, marginBottom: 24 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  headerStats: { flexDirection: 'row', paddingHorizontal: 24, alignItems: 'center' },
  statBox: { flex: 1, gap: 4 },
  statVal: { fontSize: 32, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  statDivider: { width: 1, height: 40, marginHorizontal: 24 },

  body: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 32 },
  
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loaderText: { fontSize: 14, fontWeight: '700', marginTop: 12 },

  settingsCard: { borderRadius: 32, padding: 24, marginBottom: 32, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4 },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  settingsIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  settingsTitle: { fontSize: 20, fontWeight: '900' },
  settingsSubtitle: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  
  brandGrid: { flexDirection: 'row', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1 },
  brandItem: { flex: 1, gap: 8 },
  brandLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  brandValueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandValueText: { fontSize: 14, fontWeight: '800' },
  colorIndicator: { width: 14, height: 14, borderRadius: 5 },
  vDivider: { width: 1, height: 32, marginHorizontal: 20 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingHorizontal: 4 },
  sectionHeaderText: { fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  headerLine: { flex: 1, height: 1 },

  card: { borderRadius: 32, padding: 24, marginBottom: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageIconBox: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  cardContent: { marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: '900', marginBottom: 6 },
  slugWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageSlug: { fontSize: 14, fontWeight: '700' },

  actionGrid: { flexDirection: 'row', gap: 12 },
  previewBtn: { flex: 1, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1 },
  previewText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  editBtn: { flex: 1, height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  editText: { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  empty: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptySub: { fontSize: 15, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});
