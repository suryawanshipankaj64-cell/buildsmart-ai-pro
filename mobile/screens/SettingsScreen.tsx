import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Server,
  User,
  ShieldCheck,
  LogOut,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Sliders,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { getStoredHostIp, setStoredHostIp, apiClient } from '../api/client';
import { fetchAdminRates, updateAdminRates, AdminRates } from '../api/rates';
import { Banner } from '../components/Banner';

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, logout, isAdmin, isEngineer, isClient } = useAuth();
  const { refreshProjects } = useProjects();

  const [hostIp, setHostIp] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [savingHost, setSavingHost] = useState<boolean>(false);

  const [rates, setRates] = useState<AdminRates>({
    baseRatePerSqFt: 1700,
    standardRatePerSqFt: 1700,
    premiumRatePerSqFt: 2200,
    luxuryRatePerSqFt: 3100,
    cementBagRate: 380,
    steelKgRate: 65,
    sandCftRate: 55,
    aggregateCftRate: 42,
    brickRate: 9,
    masonDailyWage: 950,
    helperDailyWage: 550,
  });
  const [loadingRates, setLoadingRates] = useState<boolean>(false);
  const [savingRates, setSavingRates] = useState<boolean>(false);

  useEffect(() => {
    loadHost();
    loadRatesData();
  }, []);

  async function loadRatesData() {
    setLoadingRates(true);
    try {
      const data = await fetchAdminRates();
      if (data) setRates(data);
    } finally {
      setLoadingRates(false);
    }
  }

  const handleSaveRates = async () => {
    if (!isAdmin) {
      Alert.alert('Admin Restricted', 'Only Administrator accounts can calibrate and save master baseline quality rates.');
      return;
    }
    setSavingRates(true);
    try {
      await updateAdminRates(rates);
      Alert.alert('Rates Saved', 'Baseline quality rates successfully synced to backend database.');
      refreshProjects();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update rates on server.');
    } finally {
      setSavingRates(false);
    }
  };

  async function loadHost() {
    const saved = await getStoredHostIp();
    setHostIp(saved);
  }

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      // Temporarily test the target host
      await setStoredHostIp(hostIp.trim());
      const data = await apiClient('/projects', { timeoutMs: 5000 });
      setTestResult({
        success: true,
        msg: `Connection successful! Found ${Array.isArray(data) ? data.length : 0} projects on server.`,
      });
      refreshProjects();
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: err?.message || 'Connection failed. Verify host IP and ensure Next.js dev server is running.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveHost = async () => {
    setSavingHost(true);
    try {
      await setStoredHostIp(hostIp.trim());
      Alert.alert('Host Saved', `Backend endpoint set to: ${hostIp.trim()}`);
      refreshProjects();
    } finally {
      setSavingHost(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to end your engineering session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + 8, 20),
            paddingLeft: Math.max(insets.left, 16),
            paddingRight: Math.max(insets.right, 16),
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>SYSTEM CONFIGURATION</Text>
          <Text style={styles.headerSubtitle}>BUILDSMART MOBILE ENGINE</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {testResult && (
          <Banner
            type={testResult.success ? 'success' : 'error'}
            message={testResult.msg}
            onDismiss={() => setTestResult(null)}
          />
        )}

        {/* 1. Engineer Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <User size={16} color={colors.primaryAccent} />
            <Text style={styles.cardTitle}>ENGINEER PROFILE IDENTITY</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>FULL NAME</Text>
            <Text style={styles.value}>{user?.name || 'Lead Site Engineer'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>SYSTEM IDENTIFIER</Text>
            <Text style={styles.value}>{user?.email || 'engineer@buildsmart.ai'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>CLEARANCE ROLE</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{user?.role || 'ENGINEER'}</Text>
            </View>
          </View>

          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>ADMIN APPROVAL STATUS</Text>
            <View style={styles.approvedPill}>
              <CheckCircle2 size={12} color={colors.primaryAccent} />
              <Text style={styles.approvedText}>AUTHORIZED</Text>
            </View>
          </View>
        </View>

        {/* 2. Admin Baseline Quality Rates Config */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Sliders size={16} color={colors.primaryAccent} />
            <Text style={styles.cardTitle}>QUALITY GRADE BASELINE RATES (₹/SQ.FT)</Text>
          </View>

          <Text style={styles.helperText}>
            Master baseline prices per square foot driving AI House Cost and Takeoff predictions:
          </Text>

          {!isAdmin && (
            <View style={{ marginBottom: 12, padding: 8, backgroundColor: `${colors.secondaryInfo}15`, borderRadius: 6, borderWidth: 1, borderColor: `${colors.secondaryInfo}30` }}>
              <Text style={{ color: colors.secondaryInfo, fontSize: 11, fontWeight: '600' }}>
                🔒 CLEARANCE NOTICE: Baseline rates calibration is restricted to System Admin (pankajsuryawanshi7764@gmail.com). View mode active.
              </Text>
            </View>
          )}

          {/* Standard Grade Input */}
          <View style={styles.rateFieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rateFieldLabel}>STANDARD GRADE</Text>
              <Text style={styles.rateFieldSub}>Civil Standard (Basic Finishes)</Text>
            </View>
            <View style={[styles.rateInputBox, !isAdmin && { opacity: 0.6 }]}>
              <Text style={styles.rateCurrency}>₹</Text>
              <TextInput
                style={styles.rateInput}
                value={String(rates.standardRatePerSqFt || rates.baseRatePerSqFt || 1700)}
                onChangeText={(t) => {
                  if (!isAdmin) return;
                  const val = parseInt(t.replace(/[^0-9]/g, ''), 10) || 0;
                  setRates({ ...rates, standardRatePerSqFt: val, baseRatePerSqFt: val });
                }}
                editable={isAdmin}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Premium Grade Input */}
          <View style={styles.rateFieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rateFieldLabel}>PREMIUM GRADE</Text>
              <Text style={styles.rateFieldSub}>Vitrified tiles, teak wood, CP brass</Text>
            </View>
            <View style={[styles.rateInputBox, !isAdmin && { opacity: 0.6 }]}>
              <Text style={styles.rateCurrency}>₹</Text>
              <TextInput
                style={styles.rateInput}
                value={String(rates.premiumRatePerSqFt || 2200)}
                onChangeText={(t) => {
                  if (!isAdmin) return;
                  const val = parseInt(t.replace(/[^0-9]/g, ''), 10) || 0;
                  setRates({ ...rates, premiumRatePerSqFt: val });
                }}
                editable={isAdmin}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Luxury Grade Input */}
          <View style={styles.rateFieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rateFieldLabel}>LUXURY GRADE</Text>
              <Text style={styles.rateFieldSub}>Italian marble, VRV HVAC, automation</Text>
            </View>
            <View style={[styles.rateInputBox, !isAdmin && { opacity: 0.6 }]}>
              <Text style={styles.rateCurrency}>₹</Text>
              <TextInput
                style={styles.rateInput}
                value={String(rates.luxuryRatePerSqFt || 3100)}
                onChangeText={(t) => {
                  if (!isAdmin) return;
                  const val = parseInt(t.replace(/[^0-9]/g, ''), 10) || 0;
                  setRates({ ...rates, luxuryRatePerSqFt: val });
                }}
                editable={isAdmin}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.hostBtnRow}>
            <TouchableOpacity
              style={[styles.testBtn, !isAdmin && { flex: 1 }]}
              onPress={loadRatesData}
              disabled={loadingRates}
            >
              {loadingRates ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <RefreshCw size={14} color="#FFF" />
                  <Text style={styles.testBtnText}>FETCH SERVER RATES</Text>
                </>
              )}
            </TouchableOpacity>

            {isAdmin && (
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveRates}
                disabled={savingRates}
              >
                {savingRates ? (
                  <ActivityIndicator size="small" color="#071224" />
                ) : (
                  <Text style={styles.saveBtnText}>SAVE RATES</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 3. Backend Server Host Config */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Server size={16} color={colors.secondaryInfo} />
            <Text style={styles.cardTitle}>BACKEND API HOST & ENDPOINT</Text>
          </View>

          <Text style={styles.helperText}>
            Configure the local network IP or cloud endpoint for Next.js 14 API interactions:
          </Text>

          <TextInput
            style={styles.hostInput}
            value={hostIp}
            onChangeText={setHostIp}
            placeholder="http://192.168.1.100:3000/api"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <View style={styles.hostBtnRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <RefreshCw size={14} color="#FFF" />
                  <Text style={styles.testBtnText}>TEST PING</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveHost}
              disabled={savingHost}
            >
              <Text style={styles.saveBtnText}>SAVE ENDPOINT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Database Diagnostics */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Database size={16} color="#A78BFA" />
            <Text style={styles.cardTitle}>ENGINEERING RUNTIME DIAGNOSTICS</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>DATABASE ENGINE</Text>
            <Text style={styles.value}>Prisma ORM (SQLite Local)</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>SECURE TOKEN STORAGE</Text>
            <Text style={styles.value}>Expo SecureStore (Hardware Keystore)</Text>
          </View>

          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>CLIENT BUILD</Text>
            <Text style={styles.value}>BuildSmart Mobile v1.0.0-PRO</Text>
          </View>
        </View>

        {/* 4. Logout Action */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <LogOut size={16} color={colors.criticalDelete} />
          <Text style={styles.logoutBtnText}>TERMINATE SESSION & SIGN OUT</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 45,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundDeep,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorder,
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
    paddingBottom: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
  },
  label: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontWeight: '700',
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  roleBadge: {
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    borderColor: colors.secondaryInfo,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: 10,
    color: colors.secondaryInfo,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  approvedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 191, 158, 0.12)',
    borderColor: colors.primaryAccent,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  approvedText: {
    fontSize: 10,
    color: colors.primaryAccent,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  rateFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
    marginBottom: 8,
  },
  rateFieldLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
  },
  rateFieldSub: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginTop: 2,
  },
  rateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    minWidth: 100,
    height: 38,
  },
  rateCurrency: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
    marginRight: 4,
  },
  rateInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '800',
    paddingVertical: 0,
  },
  hostInput: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  hostBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  testBtn: {
    flex: 1,
    backgroundColor: colors.secondaryInfo,
    borderRadius: 6,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  testBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primaryAccent,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#071224',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.criticalDelete,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  logoutBtnText: {
    color: colors.criticalDelete,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
});

