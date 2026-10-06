import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react-native';
import { colors } from '../theme/colors';

export interface BannerProps {
  type?: 'error' | 'warning' | 'success' | 'info';
  message: string;
  onDismiss?: () => void;
  actionText?: string;
  onAction?: () => void;
}

export const Banner: React.FC<BannerProps> = ({
  type = 'info',
  message,
  onDismiss,
  actionText,
  onAction,
}) => {
  const getStyleProps = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          border: colors.criticalDelete,
          icon: <AlertTriangle size={18} color={colors.criticalDelete} />,
          textColor: colors.textPrimary,
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          border: colors.outflowExpense,
          icon: <AlertTriangle size={18} color={colors.outflowExpense} />,
          textColor: colors.textPrimary,
        };
      case 'success':
        return {
          bg: 'rgba(45, 191, 158, 0.12)',
          border: colors.primaryAccent,
          icon: <CheckCircle2 size={18} color={colors.primaryAccent} />,
          textColor: colors.textPrimary,
        };
      default:
        return {
          bg: 'rgba(26, 115, 232, 0.12)',
          border: colors.secondaryInfo,
          icon: <Info size={18} color={colors.secondaryInfo} />,
          textColor: colors.textPrimary,
        };
    }
  };

  const styleProps = getStyleProps();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: styleProps.bg, borderColor: styleProps.border },
      ]}
    >
      <View style={styles.iconContainer}>{styleProps.icon}</View>
      <View style={styles.contentContainer}>
        <Text style={[styles.text, { color: styleProps.textColor }]}>{message}</Text>
        {actionText && onAction && (
          <TouchableOpacity onPress={onAction} style={styles.actionButton}>
            <Text style={styles.actionText}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <X size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 6,
    marginHorizontal: 16,
  },
  iconContainer: {
    marginRight: 10,
  },
  contentContainer: {
    flex: 1,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  actionButton: {
    marginTop: 4,
  },
  actionText: {
    color: colors.primaryAccent,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 6,
  },
});

