import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Shield,
  KeyRound,
  Mail,
  Server,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Hash,
  ExternalLink,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getStoredHostIp, setStoredHostIp } from '../api/client';
import { Banner } from '../components/Banner';

interface ProfilePreset {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'ENGINEER' | 'CLIENT';
  title: string;
  badge: string;
  color: string;
  icon: string;
}

const STAFF_PROFILES: ProfilePreset[] = [
  {
    id: 'cmuxajza300003v0vw4ho433d',
    name: 'Pankaj Suryawanshi',
    title: 'Executive Admin',
    email: 'pankajsuryawanshi7764@gmail.com',
    password: '9403496516',
    role: 'ADMIN',
    badge: 'ADMIN SUITE',
    color: colors.primaryAccent,
    icon: '🛡️',
  },
  {
    id: 'cmuxajzjh00023v0vvacm1fwd',
    name: 'Rajesh Sharma',
    title: 'Site Engineer',
    email: 'engineer@buildsmart.ai',
    password: 'engineer123',
    role: 'ENGINEER',
    badge: 'FIELD OPS',
    color: colors.secondaryInfo,
    icon: '👷',
  },
];

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { login, loginByProjectId } = useAuth();
  
  // Auth Mode: 'STAFF' (Admin/Engineer) vs 'CLIENT' (Project ID Login)
  const [authMode, setAuthMode] = useState<'STAFF' | 'CLIENT'>('STAFF');
  
  // Staff Login State
  const [selectedProfileId, setSelectedProfileId] = useState<string>('cmuxajza300003v0vw4ho433d');
  const [email, setEmail] = useState<string>('pankajsuryawanshi7764@gmail.com');
  const [password, setPassword] = useState<string>('9403496516');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Client Project ID Login State
  const [clientProjectId, setClientProjectId] = useState<string>('cmuyaiuku0001x68n02k68s00');
  
  // System Config State
  const [hostIp, setHostIp] = useState<string>('');
  const [showHostConfig, setShowHostConfig] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSavedHost();
  }, []);

  async function loadSavedHost() {
    const saved = await getStoredHostIp();
    setHostIp(saved);
  }

  const handleSaveHost = async () => {
    if (!hostIp.trim()) return;
    await setStoredHostIp(hostIp.trim());
    setShowHostConfig(false);
    Alert.alert('Host Configured', `API Base URL set to: ${hostIp}`);
  };

  const handleSelectStaffProfile = (preset: ProfilePreset) => {
    setSelectedProfileId(preset.id);
    setEmail(preset.email);
    setPassword(preset.password);
    setErrorMessage(null);
  };

  const handleStaffLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both engineer email/identifier and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email.trim(), password.trim());
    } catch (err: any) {
      console.warn('Login failure:', err);
      setErrorMessage(
        err?.message ||
          'Authentication failed. Please verify your credentials or check your backend connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientProjectLogin = async () => {
    if (!clientProjectId.trim()) {
      setErrorMessage('Please enter your Project ID / Code to access your project dashboard.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await loginByProjectId(clientProjectId.trim());
    } catch (err: any) {
      console.warn('Client access failure:', err);
      setErrorMessage(
        err?.message ||
          `Could not find project with ID: "${clientProjectId}". Please check with your site engineer.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 12, 32),
            paddingBottom: Math.max(insets.bottom + 24, 30),
            paddingLeft: Math.max(insets.left, 16),
            paddingRight: Math.max(insets.right, 16),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Shield size={32} color={colors.primaryAccent} />
          </View>
          <Text style={styles.brandTitle}>
            BUILDSMART <Text style={{ color: colors.primaryAccent }}>AI-PRO</Text>
          </Text>
          <Text style={styles.brandSubtitle}>
            FIELD ARCHITECTURE & MULTI-ROLE SUITE
          </Text>
        </View>

        {/* Error Banner */}
        {errorMessage && (
          <Banner
            type="error"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        {/* Role Access Mode Switcher Tabs */}
        <View style={styles.modeTabBar}>
          <TouchableOpacity
            style={[styles.modeTab, authMode === 'STAFF' && styles.modeTabActive]}
            onPress={() => {
              setAuthMode('STAFF');
              setErrorMessage(null);
            }}
            activeOpacity={0.8}
          >
            <Shield size={14} color={authMode === 'STAFF' ? colors.primaryAccent : colors.textMuted} />
            <Text
              style={[
                styles.modeTabText,
                authMode === 'STAFF' && { color: colors.primaryAccent, fontWeight: '800' },
              ]}
            >
              ADMIN & ENGINEER
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, authMode === 'CLIENT' && styles.modeTabActiveClient]}
            onPress={() => {
              setAuthMode('CLIENT');
              setErrorMessage(null);
            }}
            activeOpacity={0.8}
          >
            <Eye size={14} color={authMode === 'CLIENT' ? '#60A5FA' : colors.textMuted} />
            <Text
              style={[
                styles.modeTabText,
                authMode === 'CLIENT' && { color: '#60A5FA', fontWeight: '800' },
              ]}
            >
              CLIENT PORTAL (ID)
            </Text>
          </TouchableOpacity>
        </View>

        {authMode === 'STAFF' ? (
          /* =========================================================================
             STAFF MODE (ADMIN & ENGINEER)
             ========================================================================= */
          <>
            {/* Identity Quick Selection Cards */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SELECT VERIFIED IDENTITY</Text>
                <View style={styles.counterBadge}>
                  <Text style={styles.counterBadgeText}>ADMIN & ENGINEER</Text>
                </View>
              </View>
              <Text style={styles.sectionHelper}>
                Tap any profile to auto-fill credentials:
              </Text>

              <View style={styles.profileGrid}>
                {STAFF_PROFILES.map((preset) => {
                  const isSelected = selectedProfileId === preset.id || email.toLowerCase() === preset.email.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={[
                        styles.profileCard,
                        isSelected && {
                          borderColor: preset.color,
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        },
                      ]}
                      onPress={() => handleSelectStaffProfile(preset)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.profileCardTop}>
                        <View style={styles.profileIconContainer}>
                          <Text style={styles.profileIconEmoji}>{preset.icon}</Text>
                        </View>
                        <View
                          style={[
                            styles.roleBadge,
                            {
                              backgroundColor: isSelected ? `${preset.color}25` : 'rgba(255,255,255,0.06)',
                              borderColor: isSelected ? preset.color : 'rgba(255,255,255,0.1)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleBadgeText,
                              { color: isSelected ? preset.color : colors.textMuted },
                            ]}
                          >
                            {preset.badge}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.profileName} numberOfLines={1}>
                        {preset.name}
                      </Text>
                      <Text style={styles.profileTitle} numberOfLines={1}>
                        {preset.title}
                      </Text>

                      <View style={styles.profileIdRow}>
                        <Mail size={11} color={colors.textMuted} />
                        <Text style={styles.profileEmail} numberOfLines={1}>
                          {preset.email}
                        </Text>
                      </View>

                      {isSelected && (
                        <View style={[styles.selectedCheckPill, { backgroundColor: `${preset.color}20` }]}>
                          <CheckCircle2 size={12} color={preset.color} />
                          <Text style={[styles.selectedCheckText, { color: preset.color }]}>SELECTED</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Staff Credentials Form Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>STAFF AUTHENTICATION</Text>
                <View style={styles.securePill}>
                  <KeyRound size={11} color={colors.primaryAccent} />
                  <Text style={styles.secureText}>JWT SECURE</Text>
                </View>
              </View>

              {/* Email / ID Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>STAFF EMAIL / IDENTIFIER</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={16} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setSelectedProfileId('');
                    }}
                    placeholder="engineer@buildsmart.ai"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SECURITY KEY / PASSWORD</Text>
                <View style={styles.inputWrapper}>
                  <KeyRound size={16} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 40 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={colors.textMuted} />
                    ) : (
                      <Eye size={16} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Authenticate Button */}
              <TouchableOpacity
                style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
                onPress={handleStaffLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#071224" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>AUTHENTICATE & ENTER SUITE</Text>
                    <ArrowRight size={18} color="#071224" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* =========================================================================
             CLIENT PORTAL MODE (ENTER PROJECT ID DIRECTLY)
             ========================================================================= */
          <View style={[styles.card, { borderColor: '#3B82F6', borderWidth: 1.5 }]}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Eye size={16} color="#60A5FA" />
                <Text style={[styles.cardTitle, { color: '#60A5FA' }]}>CLIENT PROJECT PORTAL</Text>
              </View>
              <View style={[styles.securePill, { backgroundColor: 'rgba(59, 130, 246, 0.12)', borderColor: '#3B82F6' }]}>
                <Text style={[styles.secureText, { color: '#60A5FA' }]}>READ-ONLY</Text>
              </View>
            </View>

            <Text style={styles.clientPortalDesc}>
              Enter the unique <Text style={{ color: '#60A5FA', fontWeight: '700' }}>Project ID</Text> provided by your Site Engineer to view your live construction telemetry, milestone photos, expenses, and blueprints.
            </Text>

            {/* Project ID Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ENTER PROJECT ID / ACCESS CODE</Text>
              <View style={[styles.inputWrapper, { borderColor: '#3B82F6' }]}>
                <Hash size={16} color="#60A5FA" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: '#60A5FA', fontWeight: '700' }]}
                  value={clientProjectId}
                  onChangeText={setClientProjectId}
                  placeholder="e.g. cmuyaiuku0001x68n02k68s00"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Active Project Quick-Select Card */}
            <TouchableOpacity
              style={styles.quickProjectPill}
              onPress={() => setClientProjectId('cmuyaiuku0001x68n02k68s00')}
              activeOpacity={0.8}
            >
              <FolderKanban size={14} color="#60A5FA" />
              <View style={{ flex: 1 }}>
                <Text style={styles.quickProjectTitle}>Active Site: farm (Sangli)</Text>
                <Text style={styles.quickProjectId}>ID: cmuyaiuku0001x68n02k68s00</Text>
              </View>
              <Text style={styles.quickProjectSelect}>Select</Text>
            </TouchableOpacity>

            {/* Client Enter Button */}
            <TouchableOpacity
              style={[
                styles.loginBtn,
                { backgroundColor: '#3B82F6' },
                isLoading && styles.loginBtnDisabled,
              ]}
              onPress={handleClientProjectLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#071224" />
              ) : (
                <>
                  <Text style={[styles.loginBtnText, { color: '#FFF' }]}>
                    ACCESS PROJECT DASHBOARD
                  </Text>
                  <ArrowRight size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Backend Host Config Accordion */}
        <TouchableOpacity
          style={styles.hostConfigToggle}
          onPress={() => setShowHostConfig(!showHostConfig)}
          activeOpacity={0.7}
        >
          <Server size={14} color={colors.secondaryInfo} />
          <Text style={styles.hostConfigToggleText}>
            {showHostConfig ? 'Hide Server Host URL' : 'Configure Server Host / Cloud API'}
          </Text>
          {showHostConfig ? (
            <ChevronUp size={14} color={colors.secondaryInfo} />
          ) : (
            <ChevronDown size={14} color={colors.secondaryInfo} />
          )}
        </TouchableOpacity>

        {showHostConfig && (
          <View style={styles.hostBox}>
            <Text style={styles.hostLabel}>BACKEND API BASE URL</Text>
            <TextInput
              style={styles.hostInput}
              value={hostIp}
              onChangeText={setHostIp}
              placeholder="https://buildsmart-ai-pro.vercel.app/api"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.saveHostBtn} onPress={handleSaveHost}>
              <Text style={styles.saveHostText}>SAVE HOST</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Technical Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            BUILDSMART ENTERPRISE SUITE · FIELD TELEMETRY ENGINE
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  brandSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.2,
    fontFamily: 'monospace',
    marginTop: 4,
    textAlign: 'center',
  },
  modeTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
    borderWidth: 1,
    borderColor: colors.primaryAccent,
  },
  modeTabActiveClient: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  modeTabText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
    letterSpacing: 1,
  },
  counterBadge: {
    backgroundColor: 'rgba(45, 191, 158, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(45, 191, 158, 0.3)',
  },
  counterBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.primaryAccent,
  },
  sectionHelper: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 12,
  },
  profileGrid: {
    gap: 8,
  },
  profileCard: {
    backgroundColor: 'rgba(10, 20, 38, 0.8)',
    borderWidth: 1,
    borderColor: colors.blueprintBorder,
    borderRadius: 10,
    padding: 10,
    position: 'relative',
  },
  profileCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconEmoji: {
    fontSize: 16,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  profileTitle: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  profileIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  profileEmail: {
    fontSize: 11,
    color: colors.paper || '#F5F3ED',
    fontFamily: 'monospace',
    flex: 1,
  },
  selectedCheckPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selectedCheckText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  card: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.paper || '#F5F3ED',
    letterSpacing: 1,
  },
  clientPortalDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 14,
  },
  quickProjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  quickProjectTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
  },
  quickProjectId: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#60A5FA',
    marginTop: 2,
  },
  quickProjectSelect: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#38BDF8',
    textTransform: 'uppercase',
  },
  securePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 191, 158, 0.1)',
    borderColor: colors.primaryAccent,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
  },
  secureText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.blueprintBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    position: 'relative',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  loginBtn: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
    gap: 8,
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#071224',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  hostConfigToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  hostConfigToggleText: {
    color: colors.secondaryInfo,
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  hostBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: colors.backgroundDeep,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.blueprintBorderMuted,
  },
  hostLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  hostInput: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 6,
    height: 38,
    paddingHorizontal: 10,
    color: colors.textPrimary,
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  saveHostBtn: {
    backgroundColor: colors.secondaryInfo,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  saveHostText: {
    color: '#071224',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  footerText: {
    fontSize: 9,
    color: colors.textMuted,
    fontFamily: 'monospace',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});
