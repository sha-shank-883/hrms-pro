import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, Linking, TextInput, Modal, Alert, StatusBar, StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Phone, Mail, MapPin, Star, ChevronRight, Check, Heart, Clock, TrendingUp, Users, Zap, Shield, X, Menu, Home, Info, FileText, MessageSquare, DollarSign, BookOpen, ExternalLink, ArrowRight, Globe, Target, Server, Cpu, Activity, Layout as LayoutIcon, Terminal, ShieldAlert, Building, Boxes, ShieldHalf } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { cmsService, API_URL } from '../api';

import Animated, { FadeInDown, FadeIn, SlideInUp, Layout as ReanimatedLayout, SlideInRight } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const FeatureCard = ({ icon: Icon, title, desc, index }: any) => (
  <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.featureCard}>
    <View style={styles.featureIconWrap}>
      <Icon size={24} color="#4f46e5" strokeWidth={2.5} />
    </View>
    <Text style={styles.featureTitle}>{title.toUpperCase()}</Text>
    <Text style={styles.featureDesc}>{desc}</Text>
  </Animated.View>
);

const SectionHeader = ({ title, subtitle, centered = false }: any) => (
  <View style={[styles.sectionHeadingWrap, centered && { alignItems: 'center' }]}>
    <Text style={[styles.sectionTitle, centered && { textAlign: 'center' }]}>{title}</Text>
    <View style={[styles.titleUnderline, centered && { alignSelf: 'center' }]} />
    <Text style={[styles.sectionSubtitle, centered && { textAlign: 'center' }]}>{subtitle}</Text>
  </View>
);

export default function MarketingScreen({ navigation }: any) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [bookingData, setBookingData] = useState({
    company_name: '',
    email: '',
    phone: '',
    employees_count: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await cmsService.getWebsiteSettings();
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setSettings({
          ...data,
          sections: typeof data.sections === 'string' ? JSON.parse(data.sections || '[]') : (data.sections || []),
        });
      }
    } catch (error) {
      console.error('Error fetching website settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async () => {
    if (!bookingData.company_name || !bookingData.email || !bookingData.phone) {
      Alert.alert('Protocol Error', 'Verification requires Company, Email, and Phone parameters.');
      return;
    }

    setSubmitting(true);
    try {
      Alert.alert('Protocol Synchronized', 'Operations expert assigned. Check your terminal for uplink coordination.');
      setShowBookingModal(false);
      setBookingData({ company_name: '', email: '', phone: '', employees_count: '', message: '' });
    } catch (error) {
      Alert.alert('Transmission Failure', 'System unable to commit inquiry to CRM pipeline.');
    } finally {
      setSubmitting(false);
    }
  };

  const theme = useTheme();
  const { colors } = theme;

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loaderText, { color: colors.muted }]}>BOOTING SECURE ENVIRONMENT...</Text>
      </View>
    );
  }


  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.primary} />
      
      {/* ── INDUSTRIAL HEADER ── */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.logoWrap}>
          <View style={[styles.logoCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Terminal size={20} color="#fff" strokeWidth={2.5} />
          </View>
          <Text style={styles.brandName}>HRMS OPERATIVE</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => navigation.navigate(user ? 'Main' : 'Login')}
            style={[styles.portalBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          >
            <Text style={styles.portalBtnText}>{user ? 'DASHBOARD' : 'ACCESS PORTAL'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMenu(true)} style={[styles.menuBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>

            <Menu size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── AUTONOMOUS HERO ── */}
        <View style={styles.hero}>
          <Animated.View entering={FadeInDown.duration(1000)} style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Activity size={12} color="#4f46e5" strokeWidth={3} />
              <Text style={styles.heroBadgeText}>VERSION 4.2 OPERATIONAL</Text>
            </View>
            <Text style={styles.heroTitle}>
              {settings?.hero_title || 'Autonomous Operational Intelligence'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {settings?.hero_subtitle || 'Scale your enterprise with an encryption-first human resources ecosystem built for the next decade.'}
            </Text>
            
            <View style={styles.heroActions}>
              <TouchableOpacity 
                onPress={() => setShowBookingModal(true)} 
                style={styles.primaryHeroBtn}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryHeroBtnText}>COORDINATE DEMO</Text>
                <ArrowRight size={20} color="#fff" strokeWidth={3} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryHeroBtn} activeOpacity={0.7}>
                <Text style={styles.secondaryHeroBtnText}>EXPLORE TECH</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          <View style={styles.heroImageContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1551288049-bbda38a594a0?q=80&w=1000' }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay} />
            <View style={styles.heroFloatingCard}>
              <Shield size={20} color="#22c55e" strokeWidth={2.5} />
              <Text style={styles.floatingCardText}>SOC-2 COMPLIANT</Text>
            </View>
          </View>
        </View>

        {/* ── INTELLIGENCE GRID ── */}
        <View style={styles.section}>
          <SectionHeader 
            title="Operational Core" 
            subtitle="Engineered modules for high-density enterprise management."
          />
          <View style={styles.featureGrid}>
            <FeatureCard icon={Activity} title="Attendance" desc="Biometric-grade synchronization across all global nodes." index={0} />
            <FeatureCard icon={DollarSign} title="Payroll" desc="Automated compensation algorithmic processing." index={1} />
            <FeatureCard icon={Users} title="Personnel" desc="Centralized organizational intelligence archive." index={2} />
            <FeatureCard icon={Server} title="Deployment" desc="Multi-tenant cloud infrastructure for scale." index={3} />
          </View>
        </View>

        {/* ── DATA INTEGRITY ── */}
        <View style={[styles.section, styles.bgAlt]}>
          <View style={styles.integrityContent}>
            <View style={styles.integrityIconBox}>
               <ShieldHalf size={40} color="#4f46e5" strokeWidth={1.5} />
            </View>
            <SectionHeader 
              title="Data Integrity" 
              subtitle="Military-grade security protocols protecting every personnel interaction."
            />
            <View style={styles.checklist}>
              {[
                'AES-256 end-to-end encrypted storage',
                'Real-time automated compliance auditing',
                'Distributed multi-region data redundancy',
                'Zero-trust identity verification access'
              ].map((item, idx) => (
                <View key={idx} style={styles.checkItem}>
                  <View style={styles.checkIndicator}><Check size={12} color="#fff" strokeWidth={3} /></View>
                  <Text style={styles.checkLabel}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── TESTIMONIAL ── */}
        <View style={styles.section}>
          <View style={styles.testimonialCard}>
            <View style={styles.quoteMark}><Text style={styles.quoteText}>"</Text></View>
            <Text style={styles.testimonialBody}>
              "HRMS Operative transformed our fragmented operations into a unified intelligence stream. The architectural clarity is unmatched in the enterprise space."
            </Text>
            <View style={styles.testimonialFooter}>
              <View style={styles.authorAvatar}><Text style={styles.authorInitial}>M</Text></View>
              <View>
                <Text style={styles.authorName}>Marcus Thorne</Text>
                <Text style={styles.authorRole}>CTO, NEXUS OPERATIONS</Text>
              </View>
              <View style={styles.ratingRow}>
                {[1,2,3,4,5].map(i => <Star key={i} size={12} color="#fbbf24" fill="#fbbf24" />)}
              </View>
            </View>
          </View>
        </View>

        {/* ── DEPLOYMENT TIERS ── */}
        <View style={[styles.section, styles.bgAlt]}>
          <SectionHeader centered title="Deployment Tiers" subtitle="Scalable operational environments for every growth stage." />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pricingContent}>
            <View style={styles.tierCard}>
              <Text style={styles.tierName}>SQUADRON</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceCurrency}>$</Text>
                <Text style={styles.priceAmount}>499</Text>
                <Text style={styles.pricePeriod}>/MO</Text>
              </View>
              <View style={styles.tierDivider} />
              <View style={styles.tierFeatures}>
                <Text style={styles.tierFeature}>• Up to 50 active nodes</Text>
                <Text style={styles.tierFeature}>• Standard core modules</Text>
                <Text style={styles.tierFeature}>• 99.9% uptime SLA</Text>
              </View>
              <TouchableOpacity style={styles.tierBtn}>
                <Text style={styles.tierBtnText}>PROVISION SQUADRON</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.tierCard, styles.tierCardFeatured]}>
              <View style={styles.featuredTag}><Text style={styles.featuredTagText}>ENTERPRISE STANDARD</Text></View>
              <Text style={[styles.tierName, { color: '#fff' }]}>COMMAND</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.priceCurrency, { color: '#fff' }]}>$</Text>
                <Text style={[styles.priceAmount, { color: '#fff' }]}>1.2K</Text>
                <Text style={[styles.pricePeriod, { color: 'rgba(255,255,255,0.6)' }]}>/MO</Text>
              </View>
              <View style={[styles.tierDivider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
              <View style={styles.tierFeatures}>
                <Text style={[styles.tierFeature, { color: '#fff' }]}>• Unlimited operational nodes</Text>
                <Text style={[styles.tierFeature, { color: '#fff' }]}>• Full AI analytics suite</Text>
                <Text style={[styles.tierFeature, { color: '#fff' }]}>• Priority system uplink</Text>
              </View>
              <TouchableOpacity style={[styles.tierBtn, { backgroundColor: '#fff' }]}>
                <Text style={[styles.tierBtnText, { color: '#4f46e5' }]}>INITIATE COMMAND</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* ── CTA ── */}
        <View style={styles.ctaWrapper}>
          <View style={styles.ctaBox}>
            <Boxes size={48} color="#4f46e5" style={{ marginBottom: 24 }} strokeWidth={1.5} />
            <Text style={styles.ctaTitle}>Ready for Uplink?</Text>
            <Text style={styles.ctaDesc}>Establish your secure organizational environment in under 4 operational hours.</Text>
            <TouchableOpacity onPress={() => setShowBookingModal(true)} style={styles.finalCtaBtn}>
              <Text style={styles.finalCtaBtnText}>REQUEST SYSTEM ACCESS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <View style={styles.logoWrap}>
              <View style={[styles.logoCircle, { backgroundColor: '#fff' }]}>
                <Terminal size={20} color="#0f172a" strokeWidth={2.5} />
              </View>
              <Text style={[styles.brandName, { color: '#fff' }]}>HRMS OPERATIVE</Text>
            </View>
            <Text style={styles.footerDescription}>Industrial-grade human resources infrastructure for high-growth global enterprises.</Text>
          </View>
          <View style={styles.footerGrid}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>SYSTEM</Text>
              <Text style={styles.footerLink}>Features</Text>
              <Text style={styles.footerLink}>Security</Text>
              <Text style={styles.footerLink}>API Docs</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>LEGAL</Text>
              <Text style={styles.footerLink}>Privacy</Text>
              <Text style={styles.footerLink}>Terms</Text>
              <Text style={styles.footerLink}>Compliance</Text>
            </View>
          </View>
          <View style={styles.footerBottom}>
            <Text style={styles.copyright}>© 2024 HRMS OPERATIVE. INDUSTRIAL SOFTWARE OPERATIONS.</Text>
          </View>
        </View>

      </ScrollView>

      {/* ── BOOKING SEQUENCE MODAL ── */}
      <Modal visible={showBookingModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowBookingModal(false)} />
            <Animated.View entering={SlideInUp} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTag}>SYSTEM WALKTHROUGH</Text>
                  <Text style={styles.modalTitleText}>Coordinate Demo</Text>
                </View>
                <TouchableOpacity onPress={() => setShowBookingModal(false)} style={styles.modalCloseBtn}>
                  <X size={24} color="#0f172a" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.inputStack}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>ORGANIZATION NOMENCLATURE *</Text>
                    <View style={styles.inputWrap}>
                      <Building size={18} color="#94a3b8" strokeWidth={2.5} />
                      <TextInput 
                        style={styles.textInput}
                        placeholder="e.g. Nexus Corp"
                        placeholderTextColor="#cbd5e1"
                        value={bookingData.company_name}
                        onChangeText={t => setBookingData({...bookingData, company_name: t})}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>CORPORATE UPLINK EMAIL *</Text>
                    <View style={styles.inputWrap}>
                      <Mail size={18} color="#94a3b8" strokeWidth={2.5} />
                      <TextInput 
                        style={styles.textInput}
                        placeholder="admin@nexus.terminal"
                        placeholderTextColor="#cbd5e1"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={bookingData.email}
                        onChangeText={t => setBookingData({...bookingData, email: t})}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>SECURE COMMS LINE *</Text>
                    <View style={styles.inputWrap}>
                      <Phone size={18} color="#94a3b8" strokeWidth={2.5} />
                      <TextInput 
                        style={styles.textInput}
                        placeholder="+1 (000) 000-0000"
                        placeholderTextColor="#cbd5e1"
                        keyboardType="phone-pad"
                        value={bookingData.phone}
                        onChangeText={t => setBookingData({...bookingData, phone: t})}
                      />
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.modalSubmitBtn, submitting && styles.btnDisabled]}
                  onPress={handleBookingSubmit}
                  disabled={submitting}
                  activeOpacity={0.9}
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>COORDINATE UPLINK</Text>}
                </TouchableOpacity>
                <View style={{ height: 60 }} />
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── NAVIGATION OVERLAY ── */}
      <Modal visible={showMenu} animationType="fade" transparent>
        <View style={styles.navOverlay}>
           <TouchableOpacity style={styles.navDismiss} onPress={() => setShowMenu(false)} />
           <Animated.View entering={SlideInRight} style={styles.navMenu}>
              <View style={styles.navHeader}>
                 <Text style={styles.navHeaderTitle}>NAVIGATION</Text>
                 <TouchableOpacity onPress={() => setShowMenu(false)} style={styles.navCloseBtn}>
                    <X size={24} color="#0f172a" />
                 </TouchableOpacity>
              </View>
              <View style={styles.navLinks}>
                {['Intelligence Grid', 'Security Protocol', 'Deployment Tiers', 'Operations Hub'].map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.navLink} onPress={() => setShowMenu(false)}>
                    <Text style={styles.navLinkLabel}>{item}</Text>
                    <ChevronRight size={18} color="#cbd5e1" strokeWidth={3} />
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.navFooter}>
                 <Text style={styles.navFooterText}>CONNECTED TO GLOBAL HRMS NETWORK</Text>
              </View>
           </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', gap: 16 },
  loaderText: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 2 },
  
  header: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 18, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  portalBtn: { backgroundColor: '#f8fafc', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  portalBtnText: { color: '#0f172a', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  menuBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingBottom: 0 },

  hero: { paddingVertical: 60, paddingHorizontal: 32 },
  heroContent: { gap: 24, marginBottom: 56 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f5f3ff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start' },
  heroBadgeText: { fontSize: 10, fontWeight: '900', color: '#4f46e5', letterSpacing: 1.5 },
  heroTitle: { fontSize: 48, fontWeight: '900', color: '#0f172a', lineHeight: 54, letterSpacing: -2 },
  heroSubtitle: { fontSize: 18, color: '#64748b', lineHeight: 28, fontWeight: '600' },
  heroActions: { flexDirection: 'row', gap: 14, marginTop: 12 },
  primaryHeroBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 28, paddingVertical: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  primaryHeroBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  secondaryHeroBtn: { backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 20, borderRadius: 24, borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center' },
  secondaryHeroBtnText: { color: '#64748b', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  
  heroImageContainer: { width: '100%', height: 320, borderRadius: 48, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.1, shadowRadius: 35, elevation: 20 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(79, 70, 229, 0.08)' },
  heroFloatingCard: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 12 },
  floatingCardText: { fontSize: 10, fontWeight: '900', color: '#1e293b', letterSpacing: 0.5 },

  section: { paddingVertical: 100, paddingHorizontal: 32 },
  bgAlt: { backgroundColor: '#f8fafc' },
  sectionHeadingWrap: { marginBottom: 60 },
  sectionTitle: { fontSize: 36, fontWeight: '900', color: '#0f172a', marginBottom: 16, letterSpacing: -1.5 },
  titleUnderline: { width: 48, height: 5, backgroundColor: '#4f46e5', borderRadius: 3, marginBottom: 24 },
  sectionSubtitle: { fontSize: 18, color: '#64748b', fontWeight: '600', lineHeight: 28 },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  featureCard: { width: (width - 80) / 2, backgroundColor: '#fff', padding: 28, borderRadius: 32, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.04, shadowRadius: 15, elevation: 3 },
  featureIconWrap: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#f5f3ff', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  featureTitle: { fontSize: 14, fontWeight: '900', color: '#0f172a', marginBottom: 12, letterSpacing: 1 },
  featureDesc: { fontSize: 12, color: '#64748b', fontWeight: '600', lineHeight: 18 },

  integrityContent: { gap: 40 },
  integrityIconBox: { width: 88, height: 88, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 25, elevation: 8 },
  checklist: { gap: 20 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  checkIndicator: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  checkLabel: { fontSize: 16, fontWeight: '800', color: '#1e293b' },

  testimonialCard: { backgroundColor: '#fff', padding: 48, borderRadius: 48, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.05, shadowRadius: 40, elevation: 12 },
  quoteMark: { position: 'absolute', top: -30, left: 30, width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  quoteText: { fontSize: 120, color: '#f1f5f9', fontWeight: '900', lineHeight: 140 },
  testimonialBody: { fontSize: 22, fontWeight: '700', color: '#0f172a', lineHeight: 34, fontStyle: 'italic', marginBottom: 48 },
  testimonialFooter: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  authorAvatar: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  authorInitial: { color: '#fff', fontSize: 20, fontWeight: '900' },
  authorName: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  authorRole: { fontSize: 11, color: '#94a3b8', fontWeight: '800', letterSpacing: 1.5 },
  ratingRow: { flexDirection: 'row', gap: 4, marginTop: 10 },

  pricingContent: { paddingHorizontal: 32, gap: 28, paddingBottom: 40 },
  tierCard: { width: width * 0.8, backgroundColor: '#fff', borderRadius: 40, padding: 40, borderWidth: 1.5, borderColor: '#e2e8f0' },
  tierCardFeatured: { backgroundColor: '#4f46e5', borderColor: '#4f46e5', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.35, shadowRadius: 40, elevation: 20 },
  featuredTag: { position: 'absolute', top: -16, alignSelf: 'center', backgroundColor: '#fbbf24', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8 },
  featuredTagText: { fontSize: 10, fontWeight: '900', color: '#000', letterSpacing: 1.5 },
  tierName: { fontSize: 13, fontWeight: '900', color: '#64748b', letterSpacing: 2.5, marginBottom: 24 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 32 },
  priceCurrency: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginRight: 4 },
  priceAmount: { fontSize: 54, fontWeight: '900', color: '#0f172a' },
  pricePeriod: { fontSize: 15, fontWeight: '900', color: '#94a3b8', marginLeft: 8 },
  tierDivider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 32 },
  tierFeatures: { gap: 16, marginBottom: 48 },
  tierFeature: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  tierBtn: { height: 64, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
  tierBtnText: { fontSize: 14, fontWeight: '900', color: '#0f172a', letterSpacing: 1.5 },

  ctaWrapper: { padding: 32, marginBottom: 60 },
  ctaBox: { backgroundColor: '#f5f3ff', borderRadius: 56, padding: 56, alignItems: 'center', gap: 16, borderWidth: 1.5, borderColor: '#ddd6fe', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.05, shadowRadius: 35, elevation: 12 },
  ctaTitle: { fontSize: 36, fontWeight: '900', color: '#0f172a', textAlign: 'center', letterSpacing: -1.5 },
  ctaDesc: { fontSize: 17, color: '#64748b', textAlign: 'center', marginBottom: 32, fontWeight: '600', lineHeight: 26 },
  finalCtaBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 36, paddingVertical: 22, borderRadius: 26, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.35, shadowRadius: 25, elevation: 12 },
  finalCtaBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },

  footer: { backgroundColor: '#0f172a', padding: 56, paddingTop: 100 },
  footerTop: { gap: 32, marginBottom: 80 },
  footerDescription: { fontSize: 16, color: '#64748b', lineHeight: 28, fontWeight: '600' },
  footerGrid: { flexDirection: 'row', gap: 80, marginBottom: 80 },
  footerCol: { gap: 20 },
  footerColTitle: { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 2.5, marginBottom: 12 },
  footerLink: { fontSize: 15, color: '#475569', fontWeight: '700' },
  footerBottom: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 40, alignItems: 'center' },
  copyright: { fontSize: 10, color: '#334155', fontWeight: '900', letterSpacing: 2.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.95)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 56, borderTopRightRadius: 56, height: height * 0.92, overflow: 'hidden' },
  modalHeader: { padding: 48, paddingBottom: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTag: { fontSize: 10, fontWeight: '900', color: '#4f46e5', letterSpacing: 2.5, marginBottom: 10 },
  modalTitleText: { fontSize: 36, fontWeight: '900', color: '#0f172a', letterSpacing: -1.5 },
  modalCloseBtn: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  modalBody: { flex: 1, paddingHorizontal: 48 },
  inputStack: { gap: 32, marginBottom: 48 },
  inputGroup: { gap: 14 },
  inputLabel: { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 2, marginLeft: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 24, paddingHorizontal: 24, height: 72, borderWidth: 2, borderColor: '#e2e8f0', gap: 16 },
  textInput: { flex: 1, fontSize: 16, color: '#0f172a', fontWeight: '800' },
  modalSubmitBtn: { height: 80, borderRadius: 28, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.35, shadowRadius: 25, elevation: 12 },
  btnDisabled: { opacity: 0.6 },
  modalSubmitBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },

  navOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.92)', zIndex: 2000, flexDirection: 'row' },
  navDismiss: { flex: 1 },
  navMenu: { width: width * 0.85, backgroundColor: '#fff', padding: 48, paddingTop: 80 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 64 },
  navHeaderTitle: { fontSize: 12, fontWeight: '900', color: '#94a3b8', letterSpacing: 2.5 },
  navCloseBtn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  navLinks: { gap: 16 },
  navLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 24, borderBottomWidth: 1.5, borderBottomColor: '#f1f5f9' },
  navLinkLabel: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  navFooter: { marginTop: 'auto', borderTopWidth: 1.5, borderTopColor: '#f1f5f9', paddingTop: 32 },
  navFooterText: { fontSize: 10, fontWeight: '900', color: '#cbd5e1', letterSpacing: 2, textAlign: 'center' },
});

