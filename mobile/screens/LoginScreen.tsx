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
import {
  Shield,
  KeyRound,
  Mail,
  Server,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getStoredHostIp, setStoredHostIp } from '../api/client';
import { Banner } from '../components/Banner';

export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('pankajsuryawanshi7764@gmail.com');
  const [password, setPassword] = useState<string>('9403496516');
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

  const handleQuickFill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorMessage(null);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both engineer email and password.');
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
          'Authentication failed. Please verify your credentials or check your backend server address.'
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Architectural Grid Header */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Shield size={28} color={colors.primaryAccent} />
          </View>
          <Text style={styles.brandTitle}>
            BUILDSMART <Text style={{ color: colors.primaryAccent }}>AI-PRO</Text>
          </Text>
          <Text style={styles.brandSubtitle}>
            FIELD ARCHITECTURE & TECHNICAL SUITE
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

        {/* Login Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>ENGINEER AUTHENTICATION</Text>
            <View style={styles.securePill}>
              <KeyRound size={10} color={colors.primaryAccent} />
              <Text style={styles.secureText}>JWT SECURE</Text>
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ENGINEER / USER IDENTIFIER</Text>
            <View style={styles.inputWrapper}>
              <Mail size={16} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
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
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
              />
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#071224" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>AUTHENTICATE SESSION</Text>
                <ArrowRight size={16} color="#071224" />
              </>
            )}
          </TouchableOpacity>

          {/* One-Click Role Demo Accounts */}
          <View style={styles.quickFillSection}>
            <Text style={styles.quickFillHeading}>SELECT ROLE PROFILE</Text>
            <View style={styles.quickFillGrid}>
              <TouchableOpacity
                style={[styles.quickFillPill, { borderColor: colors.primaryAccent }]}
                onPress={() => handleQuickFill('pankajsuryawanshi7764@gmail.com', '9403496516')}
              >
                <Text style={[styles.quickFillPillText, { color: colors.primaryAccent, fontWeight: '800' }]}>
                  🛡️ Admin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickFillPill}
                onPress={() => handleQuickFill('engineer@buildsmart.ai', 'engineer123')}
              >
                <Text style={styles.quickFillPillText}>👷 Engineer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickFillPill}
                onPress={() => handleQuickFill('client@buildsmart.ai', 'client123')}
              >
                <Text style={styles.quickFillPillText}>👁️ Client (Read-Only)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Backend Host Config Toggle */}
          <TouchableOpacity
            style={styles.hostConfigToggle}
            onPress={() => setShowHostConfig(!showHostConfig)}
          >
            <Server size={14} color={colors.secondaryInfo} />
            <Text style={styles.hostConfigToggleText}>
              {showHostConfig ? 'Hide API Host Config' : 'Configure Server Host / IP'}
            </Text>
          </TouchableOpacity>

          {showHostConfig && (
            <View style={styles.hostBox}>
              <Text style={styles.hostLabel}>BACKEND API BASE URL</Text>
              <TextInput
                style={styles.hostInput}
                value={hostIp}
                onChangeText={setHostIp}
                placeholder="http://192.168.1.5:3000/api"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.saveHostBtn} onPress={handleSaveHost}>
                <Text style={styles.saveHostText}>SAVE HOST</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Technical Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            BUILDSMART ENTERPRISE CLIENT · PRISMA ENGINE SYNC
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
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  },
  card: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  securePill: {
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
  secureText: {
    color: colors.primaryAccent,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
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
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 12,
  },
  loginBtn: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#071224',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  quickFillSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.blueprintBorderMuted,
  },
  quickFillHeading: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    textAlign: 'center',
  },
  quickFillGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  quickFillPill: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  quickFillPillText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  hostConfigToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    paddingVertical: 6,
  },
  hostConfigToggleText: {
    color: colors.secondaryInfo,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  hostBox: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  hostLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '700',
  },
  hostInput: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
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
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
});

