import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

export interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  accentColor?: string;
  badge?: string;
  badgeType?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onPress?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  accentColor = colors.primaryAccent,
  badge,
  badgeType = 'default',
  onPress,
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return { bg: 'rgba(45, 191, 158, 0.15)', text: colors.primaryAccent, border: colors.primaryAccent };
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: colors.outflowExpense, border: colors.outflowExpense };
      case 'danger':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: colors.criticalDelete, border: colors.criticalDelete };
      case 'info':
        return { bg: 'rgba(26, 115, 232, 0.15)', text: colors.secondaryInfo, border: colors.secondaryInfo };
      default:
        return { bg: colors.backgroundDeep, text: colors.textMuted, border: colors.blueprintBorderMuted };
    }
  };

  const badgeStyle = getBadgeStyle();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Corner Technical Crosshair Accent */}
      <View style={[styles.cornerAccent, { borderColor: accentColor }]} />

      <View style={styles.headerRow}>
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}1A`, borderColor: accentColor }]}>
          {icon}
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
            <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{badge}</Text>
          </View>
        )}
      </View>

      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>

      {subtext && (
        <Text style={styles.subtext} numberOfLines={1}>
          {subtext}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  cornerAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    marginVertical: 2,
  },
  subtext: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
});

