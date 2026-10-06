import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Lock,
  ShieldAlert,
  RefreshCw,
  LogOut,
  Mail,
  UserCheck,
  Building,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export const PendingApprovalScreen = () => {
  const { user, refreshUser, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUser();
      Alert.alert(
        'Status Check',
        'Your profile status was verified against the Prisma central user registry.'
      );
    } catch (err: any) {
      Alert.alert('Verification Error', err?.message || 'Failed to reach backend registry.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleContactAdmin = () => {
    Alert.alert(
      'Administrator Contact',
      'Please reach out to the Lead Administrator at admin@buildsmart.ai or via the internal enterprise Slack channel (#site-ops-approvals).'
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Lock Hero Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.lockRing}>
            <Lock size={36} color={colors.outflowExpense} />
          </View>
        </View>

        {/* Header Titles */}
        <Text style={styles.headerSubtitle}>SECURITY PERIMETER ACTIVE</Text>
        <Text style={styles.headerTitle}>Account Pending Admin Approval</Text>
        <Text style={styles.headerDescription}>
          Your engineering credentials have been registered in the database, but your access role
          is pending administrative authorization.
        </Text>

        {/* Profile Technical Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <ShieldAlert size={14} color={colors.outflowExpense} />
            <Text style={styles.cardTitle}>ENGINEER CLEARANCE PROFILE</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>ACCOUNT EMAIL</Text>
            <Text style={styles.dataValue}>{user?.email || 'unassigned@buildsmart.ai'}</Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>REQUESTED ROLE</Text>
            <Text style={[styles.dataValue, { color: colors.secondaryInfo }]}>
              {user?.role || 'ENGINEER'}
            </Text>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>PROVISIONING STATUS</Text>
            <View style={styles.statusBadge}>
              <View style={styles.amberDot} />
              <Text style={styles.statusText}>PENDING EXECUTIVE AUDIT</Text>
            </View>
          </View>

          <View style={[styles.dataRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.dataLabel}>ACTION REQUIRED</Text>
            <Text style={styles.dataNote}>
              An Admin must toggle 'isApproved' to true in the Admin Dashboard.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
          activeOpacity={0.8}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#071224" />
          ) : (
            <>
              <RefreshCw size={16} color="#071224" />
              <Text style={styles.refreshButtonText}>CHECK APPROVAL STATUS</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleContactAdmin}
          activeOpacity={0.8}
        >
          <Mail size={16} color={colors.secondaryInfo} />
          <Text style={styles.contactButtonText}>CONTACT PROJECT ADMIN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <LogOut size={16} color={colors.criticalDelete} />
          <Text style={styles.logoutButtonText}>SIGN OUT / SWITCH PROFILE</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>BUILDSMART PROTOCOL · ACCESS CONTROL LAYER</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  lockRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: colors.outflowExpense,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.outflowExpense,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  headerDescription: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  infoCard: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
    paddingBottom: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  dataRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
  },
  dataLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 2,
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: colors.outflowExpense,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  amberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.outflowExpense,
  },
  statusText: {
    color: colors.outflowExpense,
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  dataNote: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  refreshButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 8,
    paddingVertical: 14,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  refreshButtonText: {
    color: '#071224',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
  contactButton: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.secondaryInfo,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contactButtonText: {
    color: colors.secondaryInfo,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoutButtonText: {
    color: colors.criticalDelete,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
});

