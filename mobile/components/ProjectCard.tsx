import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Building2, MapPin, Calendar, ArrowRight, Activity } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onPress?: () => void;
  isSelected?: boolean;
}

export function formatIndianCurrency(num: number): string {
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onPress,
  isSelected = false,
}) => {
  const progress = Math.min(100, Math.max(0, Math.round(project.progressPercent || 0)));
  const spent = project.spent || 0;
  const budget = project.budget || 0;
  const budgetRatio = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.titleSection}>
          <View style={styles.iconCircle}>
            <Building2 size={16} color={colors.primaryAccent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.projectName} numberOfLines={1}>
              {project.name}
            </Text>
            <View style={styles.locationRow}>
              <MapPin size={11} color={colors.textMuted} />
              <Text style={styles.locationText} numberOfLines={1}>
                {project.location}
              </Text>
              <View style={styles.projectIdBadge}>
                <Text style={styles.projectIdText}>ID: {project.id}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statusBadge}>
          <Activity size={10} color={colors.primaryAccent} />
          <Text style={styles.statusText}>{project.status}</Text>
        </View>
      </View>

      {/* Progress Bar with Metric */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>COMPLETION MILESTONE</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progress}%`,
                backgroundColor:
                  progress >= 80
                    ? colors.primaryAccent
                    : progress >= 40
                    ? colors.secondaryInfo
                    : colors.outflowExpense,
              },
            ]}
          />
        </View>
      </View>

      {/* Budget & Spent Readout */}
      <View style={styles.footerGrid}>
        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>BUDGET ALLOCATED</Text>
          <Text style={styles.footerValue}>{formatIndianCurrency(budget)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.footerCol}>
          <Text style={styles.footerLabel}>EXPENDITURE LOGGED</Text>
          <Text style={[styles.footerValue, { color: colors.outflowExpense }]}>
            {formatIndianCurrency(spent)} <Text style={styles.burnRateText}>({budgetRatio}%)</Text>
          </Text>
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.bottomBar}>
        <View style={styles.dateRow}>
          <Calendar size={12} color={colors.textMuted} />
          <Text style={styles.dateText}>
            Due: {new Date(project.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </Text>
        </View>

        <View style={styles.inspectBtn}>
          <Text style={styles.inspectText}>INSPECT TIMELINE</Text>
          <ArrowRight size={12} color={colors.primaryAccent} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  cardSelected: {
    borderColor: colors.primaryAccent,
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.blueprintBorderMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  projectIdBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 4,
  },
  projectIdText: {
    color: '#60A5FA',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 191, 158, 0.12)',
    borderColor: colors.primaryAccent,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  statusText: {
    color: colors.primaryAccent,
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginVertical: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
  progressValue: {
    color: colors.primaryAccent,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.backgroundDeep,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.blueprintBorderMuted,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  footerGrid: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  footerCol: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.blueprintBorderMuted,
    marginHorizontal: 8,
  },
  footerLabel: {
    fontSize: 8,
    color: colors.textMuted,
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  burnRateText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inspectText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryAccent,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
});

