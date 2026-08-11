import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StatusBar, StyleSheet, Dimensions, RefreshControl, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auditService } from '../api';
import { useTheme } from '../context/ThemeContext';
import { 
  Shield, Activity, Terminal, ShieldAlert, UserCheck, ArrowLeft, Search, Filter, Server, Lock, Key, Eye, Clock, ChevronRight 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const getActionConfig = (action: string) => {
  const act = action?.toUpperCase() || '';
  if (act.includes('LOGIN') || act.includes('AUTH')) return { icon: UserCheck, color: '#10b981', bg: '#f0fdf4', label: 'AUTH' };
  if (act.includes('DELETE') || act.includes('FAILED')) return { icon: ShieldAlert, color: '#ef4444', bg: '#fef2f2', label: 'CRITICAL' };
  if (act.includes('UPDATE') || act.includes('EDIT')) return { icon: Terminal, color: '#3b82f6', bg: '#eff6ff', label: 'WRITE' };
  return { icon: Activity, color: '#8b5cf6', bg: '#f5f3ff', label: 'EVENT' };
};

const LogCard = React.memo(({ log, index, colors }: { log: Record<string, any>; index: number; colors: Record<string, string> }) => {
  const config = getActionConfig(log.action);
  const Icon = config.icon;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50)} layout={Layout.springify()}>
      <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.logIndicator, { backgroundColor: config.color }]} />
        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
              <Icon size={18} color={config.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.logAction, { color: colors.text }]}>{log.action}</Text>
              <Text style={[styles.logMeta, { color: colors.subtext }]}>Actor ID: <Text style={[styles.actorId, { color: colors.primary }]}>{log.user_id}</Text></Text>
            </View>
            <View style={styles.logTimeWrap}>
              <Clock size={10} color={colors.subtext} />
              <Text style={[styles.logTime, { color: colors.subtext }]}>
                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          <View style={[styles.logFooter, { borderTopColor: colors.border }]}>
            <View style={styles.logDetails}>
               <Server size={10} color={colors.subtext} />
               <Text style={[styles.logDetailsText, { color: colors.subtext }]}>Sequence Node #{log.log_id || log.id}</Text>
            </View>
            <Text style={[styles.logDate, { color: colors.subtext }]}>{new Date(log.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

export default function AuditLogsScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [logs, setLogs] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await auditService.getLogs();
      setLogs(data.data || []);
    } catch (error) {
      console.log('Error loading logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  }, [loadLogs]);

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(log.user_id).includes(searchQuery)
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* ── HEADER ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Security Logs</Text>
          <View style={[styles.headerIconBox, { backgroundColor: colors.surface }]}>
            <Shield size={22} color={colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Syncing security intelligence...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredLogs}
            keyExtractor={(item, index) => item.log_id?.toString() || item.id?.toString() || index.toString()}
            renderItem={({ item, index }) => (
              <LogCard log={item} index={index} colors={colors} />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            ListHeaderComponent={() => (
              <View style={styles.listHeader}>
                <Terminal size={14} color={colors.subtext} />
                <Text style={[styles.listHeaderText, { color: colors.subtext }]}>DECRYPTED INTELLIGENCE STREAM</Text>
                <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
                  <Eye size={64} color={colors.border} strokeWidth={1} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Record Clear</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>No event intercepts detected in this sequence.</Text>
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
  header: { borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  headerIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  body: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 40 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24, opacity: 0.8 },
  listHeaderText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  headerLine: { flex: 1, height: 1 },

  logCard: { borderRadius: 24, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', borderWidth: 1 },
  logIndicator: { width: 4 },
  logContent: { flex: 1, padding: 16 },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logAction: { fontSize: 15, fontWeight: '800' },
  logMeta: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  actorId: { fontWeight: '800' },
  logTimeWrap: { alignItems: 'flex-end', gap: 2 },
  logTime: { fontSize: 10, fontWeight: '800' },

  logFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 12 },
  logDetails: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logDetailsText: { fontSize: 10, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  logDate: { fontSize: 10, fontWeight: '800' },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  loaderText: { fontSize: 14, fontWeight: '700', marginTop: 12 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptySub: { fontSize: 15, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});
