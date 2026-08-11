import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  RefreshControl,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { payrollService, handleApiError } from '../api';
import { appStorage } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  DollarSign,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ArrowLeft,
  Shield,
  Wallet,
  Activity,
  Database,
  Banknote,
  FileText,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  QrCode,
  User,
  Building,
  Receipt,
  Filter,
  RefreshCw
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, Layout as ReanimatedLayout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const formatMoney = (value: string | number) => {
  const number = Number.parseFloat(String(value ?? 0));
  return Number.isFinite(number)
    ? number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';
};

const getMonthName = (monthNumber: number) => {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString('default', { month: 'long' });
};

const StatusBadge = ({ status }: { status: string }) => {
  const isPaid = status === 'paid' || status === 'verified';
  const color = isPaid ? '#10b981' : '#f59e0b';
  const bg = isPaid ? '#ecfdf5' : '#fffbeb';
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {isPaid ? <CheckCircle size={10} color={color} /> : <AlertCircle size={10} color={color} />}
      <Text style={[styles.badgeText, { color }]}>{status.replace('_', ' ').toUpperCase()}</Text>
    </View>
  );
};

const PayslipRow = React.memo(({
  slip,
  isExpanded,
  onToggle,
  onDownload,
  onViewDetail,
  index,
  colors
}: {
  slip: Record<string, any>;
  isExpanded: boolean;
  onToggle: (id: number) => void;
  onDownload: (id: number) => void;
  onViewDetail: (slip: Record<string, any>) => void;
  index: number;
  colors: Record<string, string>;
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} layout={ReanimatedLayout.springify()}>
      <View style={[styles.slipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => onToggle(slip.payroll_id || slip.id)} activeOpacity={0.8} style={styles.slipHeader}>
          <View style={[styles.slipIconWrap, { backgroundColor: colors.surface }]}>
            <FileText size={22} color={colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.slipInfo}>
            <Text style={[styles.slipPeriod, { color: colors.text }]}>
              {getMonthName(slip.month || slip.period_month)} {slip.year || slip.period_year}
            </Text>
            <Text style={[styles.slipDate, { color: colors.subtext }]}>
              {slip.employee_name || 'Employee'}
            </Text>
          </View>
          <View style={styles.slipTrailing}>
            <Text style={[styles.slipAmount, { color: colors.text }]}>
              ${formatMoney(slip.net_pay || slip.net_salary)}
            </Text>
            <StatusBadge status={slip.payment_status || slip.status || 'pending'} />
          </View>
          <View style={styles.chevronWrap}>
            {isExpanded ? (
              <ChevronUp size={18} color={colors.primary} strokeWidth={2} />
            ) : (
              <ChevronDown size={18} color={colors.subtext} strokeWidth={2} />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View entering={FadeInUp} style={[styles.slipDetail, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <Text style={[styles.breakdownTitle, { color: colors.subtext }]}>SALARY BREAKDOWN</Text>
            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <View style={styles.detailLabelWrap}>
                  <Banknote size={16} color={colors.subtext} strokeWidth={2} />
                  <Text style={[styles.detailLabel, { color: colors.subtext }]}>Gross Salary</Text>
                </View>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  ${formatMoney(slip.basic_salary || slip.gross_pay)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailLabelWrap}>
                  <TrendingUp size={16} color="#10b981" strokeWidth={2} />
                  <Text style={[styles.detailLabel, { color: colors.subtext }]}>Allowances</Text>
                </View>
                <Text style={[styles.detailValue, { color: '#10b981' }]}>
                  +${formatMoney(slip.allowances || slip.total_allowances || 0)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailLabelWrap}>
                  <Shield size={16} color="#ef4444" strokeWidth={2} />
                  <Text style={[styles.detailLabel, { color: colors.subtext }]}>Deductions</Text>
                </View>
                <Text style={[styles.detailValue, { color: '#ef4444' }]}>
                  -${formatMoney(slip.deductions || slip.total_deductions || 0)}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.netPayRow}>
              <View>
                <Text style={[styles.netPayLabel, { color: colors.subtext }]}>NET AMOUNT</Text>
                <Text style={[styles.netPayAmount, { color: colors.primary }]}>
                  ${formatMoney(slip.net_pay || slip.net_salary)}
                </Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => onViewDetail(slip)}
                  style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Receipt size={16} color={colors.primary} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDownload(slip.id || slip.payroll_id)}
                  style={[styles.downloadBtn, { backgroundColor: colors.primary }]}>
                  <Download size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.downloadBtnText}>PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
});

export default function PayrollScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const [payrolls, setPayrolls] = useState<Record<string, any>[]>([]);
  const [myPayslips, setMyPayslips] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'payslips' | 'records'>('payslips');
  const [selectedPayslip, setSelectedPayslip] = useState<Record<string, any> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [detailPayslip, setDetailPayslip] = useState<Record<string, any> | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyHash, setVerifyHash] = useState('');
  const [downloading, setDownloading] = useState<number | null>(null);

  const apiBase = process.env.EXPO_PUBLIC_API_URL || '';

  const loadData = useCallback(async () => {
    try {
      const [payrollRes, payslipsRes] = await Promise.all([
        payrollService.getPayroll(),
        payrollService.getMyPayslips()
      ]);
      setPayrolls(payrollRes.data?.data || []);
      setMyPayslips(payslipsRes.data?.data || []);
    } catch (error) {
      const err = handleApiError(error);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const currentData = useMemo(() => {
    return activeTab === 'payslips' ? myPayslips : payrolls;
  }, [activeTab, myPayslips, payrolls]);

  const latestSlip = useMemo(() => {
    return currentData[0];
  }, [currentData]);

  const downloadPayslip = async (id: number) => {
    try {
      setDownloading(id);
      const token = await appStorage.getItem('token');
      const tenantId = await appStorage.getItem('tenantId');
      const response = await fetch(`${apiBase}/payslips/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId || 'tenant_default',
        },
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const fileUri = FileSystem.cacheDirectory + `payslip_${id}.pdf`;
        await FileSystem.writeAsStringAsync(fileUri, base64.split(',')[1], {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Download Payslip',
          });
        } else {
          Alert.alert('Downloaded', `Payslip #${id} saved to cache`);
        }
      };
      reader.onerror = () => { throw new Error('Failed to read PDF'); };
      reader.readAsDataURL(blob);
    } catch (error) {
      const err = handleApiError(error);
      Alert.alert('Download Failed', err.message);
    } finally {
      setDownloading(null);
    }
  };

  const viewDetail = async (slip: Record<string, any>) => {
    setSelectedPayslip(slip);
    setShowModal(true);
    setVerified(false);
    setVerifyHash('');
    try {
      const id = slip.id || slip.payroll_id;
      const res = await payrollService.getPayslipV2(id);
      setDetailPayslip(res.data?.data || res.data);
    } catch {
      setDetailPayslip(null);
    }
  };

  const handleVerify = async () => {
    if (!selectedPayslip) return;
    try {
      setVerifying(true);
      const id = selectedPayslip.id || selectedPayslip.payroll_id;
      const res = await payrollService.verifyPayslip(id);
      const v = res.data?.data || res.data;
      setVerified(true);
      setVerifyHash(v?.verification_hash || v?.hash || 'verified');
    } catch {
      Alert.alert('Verification Failed', 'Could not verify this payslip');
    } finally {
      setVerifying(false);
    }
  };

  const handleEmail = async () => {
    if (!selectedPayslip) return;
    try {
      const id = selectedPayslip.id || selectedPayslip.payroll_id;
      await payrollService.queuePayslipEmail(id);
      Alert.alert('Queued', 'Payslip will be emailed shortly');
    } catch {
      Alert.alert('Error', 'Failed to queue email');
    }
  };

  const renderPayslipItem = ({ item, index }: { item: Record<string, any>; index: number }) => (
    <PayslipRow
      slip={item}
      isExpanded={expandedId === (item.payroll_id || item.id)}
      onToggle={toggleExpand}
      onDownload={downloadPayslip}
      onViewDetail={viewDetail}
      index={index}
      colors={colors}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Database size={64} color={colors.border} strokeWidth={1} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Payslips</Text>
      <Text style={[styles.emptySub, { color: colors.subtext }]}>
        No payslip records found for this view.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.subtext }]}>Loading payslips...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Payroll</Text>
          <TouchableOpacity style={[styles.walletBtn, { backgroundColor: colors.surface }]}>
            <Wallet size={22} color={colors.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('payslips')}
          style={[styles.tab, activeTab === 'payslips' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
          <Receipt size={16} color={activeTab === 'payslips' ? colors.primary : colors.subtext} strokeWidth={2} />
          <Text style={[styles.tabLabel, { color: activeTab === 'payslips' ? colors.primary : colors.subtext }]}>
            My Payslips ({myPayslips.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('records')}
          style={[styles.tab, activeTab === 'records' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
          <Activity size={16} color={activeTab === 'records' ? colors.primary : colors.subtext} strokeWidth={2} />
          <Text style={[styles.tabLabel, { color: activeTab === 'records' ? colors.primary : colors.subtext }]}>
            Records ({payrolls.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentData}
        renderItem={renderPayslipItem}
        keyExtractor={(item) => String(item.payroll_id || item.id)}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          <View style={styles.heroSection}>
            <Animated.View entering={FadeInDown.delay(100)} style={[styles.summaryCard, { backgroundColor: isDark ? colors.card : colors.text }]}>
              <View style={styles.summaryHeader}>
                <Text style={[styles.summaryTitle, { color: isDark ? colors.subtext : 'rgba(255,255,255,0.6)' }]}>
                  {activeTab === 'payslips' ? 'LATEST PAYSLIP' : 'LATEST RECORD'}
                </Text>
                <View style={[styles.securityTag, { backgroundColor: isDark ? colors.background : 'rgba(16,185,129,0.1)' }]}>
                  <Shield size={12} color="#10b981" strokeWidth={2.5} />
                  <Text style={styles.securityText}>Verified</Text>
                </View>
              </View>
              <View style={styles.amountContainer}>
                <Text style={[styles.currencySymbol, { color: isDark ? colors.subtext : 'rgba(255,255,255,0.4)' }]}>$</Text>
                <Text style={[styles.mainAmount, { color: isDark ? colors.text : '#fff' }]}>
                  {latestSlip ? formatMoney(latestSlip.net_pay || latestSlip.net_salary) : '0.00'}
                </Text>
              </View>
              <View style={styles.periodRow}>
                <Calendar size={14} color={isDark ? colors.subtext : 'rgba(255,255,255,0.5)'} strokeWidth={2} />
                <Text style={[styles.periodText, { color: isDark ? colors.subtext : 'rgba(255,255,255,0.5)' }]}>
                  {latestSlip
                    ? `${getMonthName(latestSlip.month || latestSlip.period_month)} ${latestSlip.year || latestSlip.period_year}`
                    : 'No data'}
                </Text>
              </View>
            </Animated.View>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Payslip Details</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <XCircle size={24} color={colors.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedPayslip && (
                <>
                  <View style={[styles.modalInfoCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalInfoItem}>
                        <User size={14} color={colors.subtext} />
                        <Text style={[styles.modalInfoLabel, { color: colors.subtext }]}>Employee</Text>
                        <Text style={[styles.modalInfoValue, { color: colors.text }]}>
                          {selectedPayslip.employee_name || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.modalInfoItem}>
                        <Building size={14} color={colors.subtext} />
                        <Text style={[styles.modalInfoLabel, { color: colors.subtext }]}>Department</Text>
                        <Text style={[styles.modalInfoValue, { color: colors.text }]}>
                          {selectedPayslip.department_name || 'N/A'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalInfoItem}>
                        <Calendar size={14} color={colors.subtext} />
                        <Text style={[styles.modalInfoLabel, { color: colors.subtext }]}>Period</Text>
                        <Text style={[styles.modalInfoValue, { color: colors.text }]}>
                          {getMonthName(selectedPayslip.month || selectedPayslip.period_month)} {selectedPayslip.year || selectedPayslip.period_year}
                        </Text>
                      </View>
                      <View style={styles.modalInfoItem}>
                        <StatusBadge status={selectedPayslip.payment_status || selectedPayslip.status || 'pending'} />
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.modalSectionTitle, { color: colors.subtext }]}>EARNINGS</Text>
                  <View style={[styles.modalTable, { borderColor: colors.border }]}>
                    {(detailPayslip?.earnings || []).length > 0 ? (
                      detailPayslip!.earnings.map((e: any, i: number) => (
                        <View key={i} style={[styles.modalTableRow, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.modalTableLabel, { color: colors.text }]}>{e.component_name}</Text>
                          <Text style={[styles.modalTableValue, { color: colors.text }]}>${formatMoney(e.amount)}</Text>
                        </View>
                      ))
                    ) : (
                      <>
                        <View style={[styles.modalTableRow, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.modalTableLabel, { color: colors.text }]}>Basic Salary</Text>
                          <Text style={[styles.modalTableValue, { color: colors.text }]}>${formatMoney(selectedPayslip.basic_salary)}</Text>
                        </View>
                        <View style={[styles.modalTableRow, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.modalTableLabel, { color: colors.text }]}>Allowances</Text>
                          <Text style={[styles.modalTableValue, { color: '#10b981' }]}>+${formatMoney(selectedPayslip.allowances || 0)}</Text>
                        </View>
                      </>
                    )}
                    <View style={[styles.modalTableRow, styles.modalTableTotal, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.modalTableLabel, { color: colors.text, fontWeight: '800' }]}>Total Earnings</Text>
                      <Text style={[styles.modalTableValue, { color: colors.primary, fontWeight: '800' }]}>
                        ${formatMoney(detailPayslip?.gross_pay || selectedPayslip.gross_pay || selectedPayslip.basic_salary || 0)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.modalSectionTitle, { color: colors.subtext }]}>DEDUCTIONS</Text>
                  <View style={[styles.modalTable, { borderColor: colors.border }]}>
                    {(detailPayslip?.deductions || []).length > 0 ? (
                      detailPayslip!.deductions.map((d: any, i: number) => (
                        <View key={i} style={[styles.modalTableRow, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.modalTableLabel, { color: colors.text }]}>{d.component_name}</Text>
                          <Text style={[styles.modalTableValue, { color: '#ef4444' }]}>-${formatMoney(d.amount)}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={[styles.modalTableRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTableLabel, { color: colors.text }]}>Total Deductions</Text>
                        <Text style={[styles.modalTableValue, { color: '#ef4444' }]}>-${formatMoney(selectedPayslip.deductions || selectedPayslip.total_deductions || 0)}</Text>
                      </View>
                    )}
                    <View style={[styles.modalTableRow, styles.modalTableTotal, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.modalTableLabel, { color: colors.text, fontWeight: '800' }]}>Total Deductions</Text>
                      <Text style={[styles.modalTableValue, { color: '#ef4444', fontWeight: '800' }]}>
                        -${formatMoney(detailPayslip?.total_deductions || selectedPayslip.deductions || selectedPayslip.total_deductions || 0)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.modalNetPay, { backgroundColor: colors.primary }]}>
                    <Text style={styles.modalNetPayLabel}>NET PAY (TAKE HOME)</Text>
                    <Text style={styles.modalNetPayAmount}>
                      ${formatMoney(detailPayslip?.net_pay || selectedPayslip.net_pay || selectedPayslip.net_salary || 0)}
                    </Text>
                  </View>

                  <Text style={[styles.modalSectionTitle, { color: colors.subtext }]}>VERIFICATION</Text>
                  <View style={[styles.modalVerification, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <TouchableOpacity onPress={handleVerify} disabled={verifying}
                      style={[styles.verifyBtn, { backgroundColor: verified ? '#10b981' : colors.primary }]}>
                      {verifying ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Shield size={16} color="#fff" strokeWidth={2.5} />
                          <Text style={styles.verifyBtnText}>
                            {verified ? 'Verified' : 'Verify Authenticity'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    {verifyHash ? (
                      <View style={styles.verifyResult}>
                        <CheckCircle size={16} color="#10b981" />
                        <Text style={styles.verifyHashText}>{verifyHash}</Text>
                      </View>
                    ) : null}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => selectedPayslip && downloadPayslip(selectedPayslip.id || selectedPayslip.payroll_id)}
                disabled={downloading !== null}
                style={[styles.modalFooterBtn, { backgroundColor: colors.primary }]}>
                {downloading !== null ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Download size={16} color="#fff" />
                )}
                <Text style={styles.modalFooterBtnText}>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEmail} style={[styles.modalFooterBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <Mail size={16} color={colors.primary} />
                <Text style={[styles.modalFooterBtnText, { color: colors.primary }]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowModal(false)} style={[styles.modalFooterBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.modalFooterBtnText, { color: colors.subtext }]}>Close</Text>
              </TouchableOpacity>
            </View>
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
  walletBtn: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  tabRow: { flexDirection: 'row', borderBottomWidth: 1, marginHorizontal: 20 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 16, marginRight: 8 },
  tabLabel: { fontSize: 13, fontWeight: '700' },

  listContent: { paddingBottom: 40 },
  heroSection: { padding: 20, paddingTop: 10 },
  summaryCard: { borderRadius: 32, padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  summaryTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  securityTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  securityText: { color: '#10b981', fontSize: 11, fontWeight: '800' },
  amountContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  currencySymbol: { fontSize: 24, fontWeight: '800', marginTop: 10, marginRight: 6 },
  mainAmount: { fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  periodText: { fontSize: 14, fontWeight: '700' },

  slipCard: { borderRadius: 28, marginHorizontal: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
  slipHeader: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  slipIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  slipInfo: { flex: 1 },
  slipPeriod: { fontSize: 18, fontWeight: '800' },
  slipDate: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  slipTrailing: { alignItems: 'flex-end', marginRight: 12 },
  slipAmount: { fontSize: 18, fontWeight: '800' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 6 },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  chevronWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  slipDetail: { padding: 24, borderTopWidth: 1 },
  breakdownTitle: { fontSize: 11, fontWeight: '800', marginBottom: 20, letterSpacing: 0.5 },
  detailGrid: { gap: 14 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 15, fontWeight: '700' },
  detailValue: { fontSize: 16, fontWeight: '800' },
  divider: { height: 1, marginVertical: 24 },
  netPayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netPayLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  netPayAmount: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 44, borderRadius: 14, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  downloadBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { marginTop: 12, fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySub: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalBody: { paddingHorizontal: 24, paddingTop: 16 },
  modalInfoCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20 },
  modalInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  modalInfoItem: { flex: 1, gap: 4 },
  modalInfoLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  modalInfoValue: { fontSize: 15, fontWeight: '700' },
  modalSectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  modalTable: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  modalTableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  modalTableTotal: { borderBottomWidth: 0 },
  modalTableLabel: { fontSize: 14, fontWeight: '600' },
  modalTableValue: { fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
  modalNetPay: { borderRadius: 16, padding: 24, marginVertical: 16, alignItems: 'center' as const },
  modalNetPayLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  modalNetPayAmount: { color: '#fff', fontSize: 32, fontWeight: '800' },
  modalVerification: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 24 },
  verifyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  verifyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  verifyResult: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingHorizontal: 4 },
  verifyHashText: { color: '#10b981', fontSize: 12, fontWeight: '600', flex: 1 },
  modalFooter: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1 },
  modalFooterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14 },
  modalFooterBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
