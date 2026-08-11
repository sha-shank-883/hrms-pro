import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, RefreshControl, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { taskService, handleApiError } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CheckSquare, Plus, CheckCircle, Clock, PlayCircle, X, ArrowLeft, Calendar as CalendarIcon, PauseCircle, ChevronRight, Hash, AlignLeft, Flag, Zap, Target, Activity, Layout } from 'lucide-react-native';
import Animated, { FadeInDown, SlideInUp, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const PRIORITY_THEME: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Urgent' },
  medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Standard' },
  low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Low' },
  default: { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', label: 'Routine' },
};

const TABS = [
  { id: 'todo', label: 'Pending', icon: Clock },
  { id: 'in_progress', label: 'Active', icon: PlayCircle },
  { id: 'completed', label: 'Finalized', icon: CheckCircle },
];

const TaskCard = ({ task, onStatusUpdate, index, colors }: { task: Record<string, any>; onStatusUpdate: (id: number, status: string) => void; index: number; colors: Record<string, string> }) => {
  const prio = PRIORITY_THEME[task.priority] || PRIORITY_THEME.default;
  const status = task.status;
  const formattedDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'ASAP';

  return (
    <Animated.View entering={FadeInDown.delay(index * 80)} layout={ReanimatedLayout.springify()}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.prioBadge, { backgroundColor: prio.bg }]}>
            <View style={[styles.prioDot, { backgroundColor: prio.color }]} />
            <Text style={[styles.prioText, { color: prio.color }]}>{prio.label.toUpperCase()}</Text>
          </View>
          <View style={[styles.dateWrap, { backgroundColor: colors.surface }]}>
            <CalendarIcon size={12} color={colors.primary} />
            <Text style={[styles.dateText, { color: colors.primary }]}>{formattedDate}</Text>
          </View>
        </View>

        <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
        {task.description ? (
          <Text style={[styles.taskDesc, { color: colors.subtext }]} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.taskMeta}>
            <Target size={12} color={colors.subtext} />
            <Text style={[styles.taskId, { color: colors.subtext }]}>TASK-{task.task_id || task.id}</Text>
          </View>

          <View style={styles.actions}>
            {status === 'todo' || status === 'pending' ? (
              <TouchableOpacity
                onPress={() => onStatusUpdate(task.task_id, 'in_progress')}
                style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <PlayCircle size={14} color="#fff" />
                <Text style={styles.actionBtnText}>START</Text>
              </TouchableOpacity>
            ) : status === 'in_progress' ? (
              <View style={styles.dualActions}>
                <TouchableOpacity
                  onPress={() => onStatusUpdate(task.task_id, 'todo')}
                  style={[styles.actionBtnPause, { backgroundColor: colors.surface }]}
                  activeOpacity={0.8}
                >
                  <PauseCircle size={16} color={colors.subtext} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onStatusUpdate(task.task_id, 'completed')}
                  style={[styles.actionBtnSuccess, { backgroundColor: '#10b981' }]}
                  activeOpacity={0.8}
                >
                  <CheckCircle size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>RESOLVE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.resolvedBadge, { backgroundColor: '#10b98115' }]}>
                <CheckCircle size={12} color="#10b981" />
                <Text style={styles.resolvedText}>FINALIZED</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default function TaskScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('todo');
  const [createModal, setCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: new Date().toISOString().split('T')[0] });

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await taskService.getTasks();
      const allTasks = data.data || [];
      const filtered = allTasks.filter((t: { status: string }) => {
        if (activeTab === 'todo') return t.status === 'todo' || t.status === 'pending';
        if (activeTab === 'in_progress') return t.status === 'in_progress';
        return t.status === 'completed';
      });
      setTasks(filtered);
    } catch (error) {
      console.log('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleUpdateStatus = (id: number, newStatus: string) => {
    Alert.alert(
      'Protocol Update',
      `Synchronize task status to ${newStatus.toUpperCase()}?`,
      [
        { text: 'ABORT', style: 'cancel' },
        {
          text: 'COMMIT',
          onPress: async () => {
            try {
              await taskService.updateTaskStatus(id, newStatus);
              loadTasks();
            } catch (error) {
              Alert.alert('System Error', 'Unable to synchronize status update.');
            }
          }
        }
      ]
    );
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Warning', 'Task title definition is required.');
      return;
    }

    setSubmitting(true);
    try {
      await taskService.createTask({
        ...newTask,
        status: 'todo',
        category: 'operational'
      });
      setCreateModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: new Date().toISOString().split('T')[0] });
      loadTasks();
    } catch (error) {
      Alert.alert('Protocol Failure', handleApiError(error).message);
    } finally {
      setSubmitting(false);
    }
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Operations</Text>
          <TouchableOpacity 
            onPress={() => setCreateModal(true)} 
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity 
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tab, 
                activeTab === tab.id && { borderBottomColor: colors.primary }
              ]}
            >
              <tab.icon 
                size={16} 
                color={activeTab === tab.id ? colors.primary : colors.subtext} 
                strokeWidth={activeTab === tab.id ? 2.5 : 2}
              />
              <Text style={[
                styles.tabText, 
                { color: activeTab === tab.id ? colors.primary : colors.subtext },
                activeTab === tab.id && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.body}>
        {loading && !refreshing ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loaderText, { color: colors.subtext }]}>Syncing operations...</Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item, index) => item.task_id?.toString() || item.id?.toString() || index.toString()}
            renderItem={({ item, index }) => (
              <TaskCard task={item} onStatusUpdate={handleUpdateStatus} index={index} colors={colors} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
                  <CheckSquare size={64} color={colors.border} strokeWidth={1} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Operational Void</Text>
                <Text style={[styles.emptySub, { color: colors.subtext }]}>
                  All protocols have been successfully resolved for this sector.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* ── CREATE TASK MODAL ── */}
      <Modal visible={createModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setCreateModal(false)} />
            <Animated.View entering={SlideInUp} style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <View>
                  <Text style={[styles.modalTitleText, { color: colors.text }]}>New Protocol</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.subtext }]}>Define operational requirement</Text>
                </View>
                <TouchableOpacity onPress={() => setCreateModal(false)} style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.subtext }]}>PROTOCOL TITLE</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Enter short description..."
                    placeholderTextColor={colors.subtext + '80'}
                    value={newTask.title}
                    onChangeText={t => setNewTask({...newTask, title: t})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.subtext }]}>DETAILED SPECIFICATION</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Provide full operational details..."
                    placeholderTextColor={colors.subtext + '80'}
                    multiline
                    numberOfLines={4}
                    value={newTask.description}
                    onChangeText={t => setNewTask({...newTask, description: t})}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.subtext }]}>PRIORITY CLASSIFICATION</Text>
                  <View style={styles.prioGrid}>
                    {['low', 'medium', 'high'].map((p) => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setNewTask({ ...newTask, priority: p })}
                        style={[
                          styles.prioChip, 
                          { backgroundColor: colors.background, borderColor: colors.border },
                          newTask.priority === p && { backgroundColor: PRIORITY_THEME[p].bg, borderColor: PRIORITY_THEME[p].color }
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.prioChipText, 
                          { color: colors.subtext },
                          newTask.priority === p && { color: PRIORITY_THEME[p].color }
                        ]}>
                          {PRIORITY_THEME[p].label.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.subtext }]}>TARGET DEADLINE</Text>
                  <View style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <CalendarIcon size={18} color={colors.primary} />
                    <TextInput
                      style={[styles.input, { flex: 1, borderWidth: 0, height: 50, color: colors.text }]}
                      value={newTask.due_date}
                      onChangeText={t => setNewTask({...newTask, due_date: t})}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.subtext + '80'}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.commitBtn, { backgroundColor: colors.primary }, submitting && { opacity: 0.7 }]}
                  onPress={handleCreateTask}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.commitBtnText}>COMMIT PROTOCOL</Text>}
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
  header: { borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  addBtn: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },

  tabContainer: { flexDirection: 'row', paddingHorizontal: 20 },
  tab: { flex: 1, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '700' },
  tabTextActive: { fontWeight: '800' },

  body: { flex: 1 },
  listContent: { padding: 20 },
  
  card: { borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  prioBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  prioDot: { width: 6, height: 6, borderRadius: 3 },
  prioText: { fontSize: 10, fontWeight: '800' },
  dateWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dateText: { fontSize: 11, fontWeight: '800' },

  taskTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  taskDesc: { fontSize: 14, lineHeight: 22, fontWeight: '600' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 16, marginTop: 4 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  taskId: { fontSize: 11, fontWeight: '800' },

  actions: { flexDirection: 'row', gap: 8 },
  actionBtnPrimary: { height: 38, paddingHorizontal: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  dualActions: { flexDirection: 'row', gap: 10 },
  actionBtnPause: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionBtnSuccess: { height: 38, paddingHorizontal: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  resolvedText: { color: '#10b981', fontSize: 11, fontWeight: '800' },

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
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '800', marginBottom: 10, letterSpacing: 0.5, marginLeft: 4 },
  input: { height: 56, borderRadius: 16, paddingHorizontal: 18, fontSize: 15, fontWeight: '700', borderWidth: 1.5 },
  textArea: { minHeight: 120, borderRadius: 20, padding: 18, fontSize: 15, fontWeight: '700', borderWidth: 1.5, textAlignVertical: 'top' },
  prioGrid: { flexDirection: 'row', gap: 10 },
  prioChip: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  prioChipText: { fontSize: 12, fontWeight: '800' },
  dateInput: { height: 56, borderRadius: 16, paddingHorizontal: 18, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 12 },
  commitBtn: { height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8, marginTop: 15 },
  commitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
