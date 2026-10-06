import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Menu, Bell, Shield } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
  unreadNotifications?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onMenuPress,
  onNotificationsPress,
  unreadNotifications = 3,
}) => {
  const { user, role } = useAuth();
  const userName = user?.name ? user.name.split(' ')[0] : role === 'ADMIN' ? 'Admin' : role === 'CLIENT' ? 'Client' : 'Engineer';

  const roleDisplay =
    role === 'ADMIN'
      ? 'Role: ADMIN · Full Access Suite'
      : role === 'CLIENT'
      ? 'Role: CLIENT · Transparency Suite (Read-Only)'
      : 'Role: ENGINEER · Field Operations Suite';

  return (
    <View style={styles.header}>
      {/* Top Bar Navigation Actions */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Menu size={22} color={colors.paper || '#F5F3ED'} />
        </TouchableOpacity>

        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Shield size={14} color={colors.primaryAccent} />
          </View>
          <Text style={styles.brandText}>
            BUILDSMART <Text style={styles.proBadge}>AI-PRO</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationsPress}
          activeOpacity={0.7}
        >
          <Bell size={22} color={colors.paper || '#F5F3ED'} />
          {unreadNotifications > 0 && (
            <View style={styles.notificationDot}>
              <Text style={styles.dotText}>{unreadNotifications}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Greeting and Status Subtitle */}
      <View style={styles.greetingSection}>
        <View>
          <Text style={styles.greetingTitle}>
            {title || `Hello, ${userName} 👋`}
          </Text>
          <Text style={styles.greetingSubtitle}>
            {subtitle || roleDisplay}
          </Text>
        </View>
        <View style={[styles.onlinePill, role === 'CLIENT' && { backgroundColor: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.4)' }]}>
          <View style={[styles.statusLight, role === 'CLIENT' && { backgroundColor: '#3B82F6' }]} />
          <Text style={[styles.statusText, role === 'CLIENT' && { color: '#60A5FA' }]}>
            {role === 'CLIENT' ? 'READ-ONLY SYNC' : 'FIELD SYNC ACTIVE'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.backgroundDeep,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorder,
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.criticalDelete,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.backgroundDeep,
  },
  dotText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
    borderWidth: 1,
    borderColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    fontFamily: 'monospace',
  },
  proBadge: {
    color: colors.primaryAccent,
    fontWeight: '900',
  },
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  greetingTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  greetingSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 191, 158, 0.12)',
    borderColor: colors.primaryAccent,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  statusLight: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryAccent,
  },
  statusText: {
    color: colors.primaryAccent,
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
});

