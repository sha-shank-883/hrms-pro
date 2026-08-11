import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, StatusBar, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { holidayService } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Calendar, Star, CheckCircle2, ArrowLeft, PartyPopper, Clock, ChevronRight, Info, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const HolidayCard = ({ holiday, onOptIn, index, colors }: { holiday: Record<string, any>; onOptIn: (holiday: Record<string, any>) => void; index: number; colors: Record<string, string> }) => {
  const isRestricted = holiday.type?.toLowerCase() === 'restricted';
  const date = new Date(holiday.date || holiday.holiday_date);

  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} layout={Layout.springify()}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardMain}>
          <View style={[styles.dateBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.dateMonth, { color: colors.subtext }]}>{date.toLocaleString('default', { month: 'short' })}</Text>
            <Text style={[styles.dateDay, { color: colors.text }]}>{date.getDate()}</Text>
          </View>
          
          <View style={styles.infoBox}>
            <View style={styles.typeRow}>
              <View style={[styles.typeBadge, { backgroundColor: isRestricted ? '#fff7ed' : '#f0fdf4' }]}>
                <Text style={[styles.typeText, { color: isRestricted ? '#c2410c' : '#15803d' }]}>
                  {isRestricted ? 'Restricted' : 'Official'}
                </Text>
              </View>
              <Text style={[styles.dayText, { color: colors.subtext }]}>{date.toLocaleString('default', { weekday: 'long' })}</Text>
            </View>
            
            <Text style={[styles.holidayName, { color: colors.text }]}>{holiday.name || holiday.holiday_name}</Text>
          </View>
        </View>

        <View style={[styles.cardFooter, { backgroundColor: colors.background + '50', borderTopColor: colors.border }]}>
          {isRestricted ? (
            <TouchableOpacity 
              style={[styles.optInBtn, { backgroundColor: colors.card, borderColor: colors.primary + '30' }]}
              onPress={() => onOptIn(holiday)}
              activeOpacity={0.7}
            >
              <Star size={14} color={colors.primary} />
              <Text style={[styles.optInText, { color: colors.primary }]}>Request Opt-In</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.autoBadge}>
              <CheckCircle2 size={14} color="#10b981" />
              <Text style={[styles.autoText, { color: '#10b981' }]}>Public Holiday</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export default function HolidaysScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [holidays, setHolidays] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const currentYear = new Date().getFullYear();

  const loadHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await holidayService.getAll(currentYear);
      setHolidays(data.data || []);
    } catch (error) {
      console.log('Error loading holidays:', error);
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHolidays();
    setRefreshing(false);
  }, [loadHolidays]);

  const handleOptIn = (holiday: Record<string, any>) => {
    if (!user?.employee_id) {
      Alert.alert('Error', 'Security context missing.');
      return;
    }

    const name = holiday.name || holiday.holiday_name;
    Alert.alert(
      'Holiday Opt-In',
      `Submit a request to utilize your restricted holiday allowance for ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              await holidayService.optIn({ employee_id: user.employee_id, holiday_id: holiday.holiday_id });
              Alert.alert('Success', `Opt-in request for ${name} submitted.`);
              loadHolidays();
            } catch (error) {
              Alert.alert('Error', 'Failed to process request.');
            }
          }
        }
      ]
    );
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Holidays</Text>
          <View style={styles.headerBadgeBox}>
            <Calendar size={22} color={colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Syncing calendar...</Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          >
            <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: colors.subtext }]}>{currentYear} SCHEDULE</Text>
               <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
            </View>

            {holidays.length === 0 ? (
              <View style={styles.emptyModule}>
                <Calendar size={64} color={colors.border} strokeWidth={1} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No holidays found</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>There are no scheduled holidays detected for the current year.</Text>
              </View>
            ) : (
              holidays.map((item, index) => (
                <HolidayCard 
                  key={index} 
                  holiday={item} 
                  index={index}
                  onOptIn={handleOptIn}
                  colors={colors}
                />
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

  body: { flex: 1 },
  scrollContent: { padding: 20 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loaderText: { fontSize: 14, fontWeight: '600', marginTop: 12 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  headerLine: { flex: 1, height: 1 },

  card: { borderRadius: 24, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1 },
  cardMain: { flexDirection: 'row', padding: 16, alignItems: 'center', gap: 16 },
  dateBox: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dateMonth: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  dateDay: { fontSize: 24, fontWeight: '800' },
  
  infoBox: { flex: 1 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '800' },
  dayText: { fontSize: 12, fontWeight: '600' },
  holidayName: { fontSize: 18, fontWeight: '800' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  optInBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  optInText: { fontSize: 13, fontWeight: '800' },
  autoBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  autoText: { fontSize: 13, fontWeight: '800' },

  emptyModule: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySub: { fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
});
