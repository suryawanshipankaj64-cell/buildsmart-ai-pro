import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Receipt,
  FileSpreadsheet,
  TrendingUp,
  Camera,
  Mic,
  FolderPlus,
  MapPin,
  X,
  Sparkles,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useProjects } from '../context/ProjectContext';
import { QuickActionType } from '../types';
import { QuickActionModal } from './QuickActionModal';
import { UploadDocumentModal } from './UploadDocumentModal';

interface RecordDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToExpense?: (projectId?: string) => void;
  onNavigateToDocuments?: (projectId?: string) => void;
}

export const RecordDrawer: React.FC<RecordDrawerProps> = ({
  visible,
  onClose,
  onNavigateToExpense,
  onNavigateToDocuments,
}) => {
  const { activeProject } = useProjects();
  const [activeQuickAction, setActiveQuickAction] = useState<QuickActionType | null>(null);
  const [showDocUploadModal, setShowDocUploadModal] = useState<boolean>(false);

  const handleActionClick = (action: QuickActionType) => {
    onClose();
    if (action === 'expense') {
      onNavigateToExpense?.(activeProject?.id);
    } else if (action === 'document') {
      setShowDocUploadModal(true);
    } else {
      setActiveQuickAction(action);
    }
  };

  const actionItems: Array<{
    type: QuickActionType;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    accentColor: string;
  }> = [
    {
      type: 'expense',
      label: 'Log Expense',
      sublabel: 'Direct transaction',
      icon: <Receipt size={22} color={colors.outflowExpense} />,
      accentColor: colors.outflowExpense,
    },
    {
      type: 'sitelog',
      label: 'Site Log',
      sublabel: 'Daily report',
      icon: <FileSpreadsheet size={22} color={colors.secondaryInfo} />,
      accentColor: colors.secondaryInfo,
    },
    {
      type: 'phase_update',
      label: 'Phase Update',
      sublabel: 'Milestone progress',
      icon: <TrendingUp size={22} color={colors.primaryAccent} />,
      accentColor: colors.primaryAccent,
    },
    {
      type: 'photo',
      label: 'Photo Proof',
      sublabel: 'GPS inspection',
      icon: <Camera size={22} color="#A78BFA" />,
      accentColor: '#A78BFA',
    },
    {
      type: 'voice_note',
      label: 'Voice Note',
      sublabel: 'AI memo transcription',
      icon: <Mic size={22} color="#F472B6" />,
      accentColor: '#F472B6',
    },
    {
      type: 'document',
      label: 'Document',
      sublabel: 'Vault blueprint',
      icon: <FolderPlus size={22} color="#38BDF8" />,
      accentColor: '#38BDF8',
    },
  ];

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.sheetContainer}>
                {/* Drag Handle Bar */}
                <View style={styles.dragBar} />

                {/* Header with Project Name & Location */}
                <View style={styles.header}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.badgeRow}>
                      <Sparkles size={12} color={colors.primaryAccent} />
                      <Text style={styles.badgeText}>FIELD RECORD DISPATCH SHEET</Text>
                    </View>
                    <Text style={styles.projectName} numberOfLines={1}>
                      {activeProject?.name || 'Central Architecture Project'}
                    </Text>
                    <View style={styles.locationRow}>
                      <MapPin size={11} color={colors.textMuted} />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {activeProject?.location || 'Bangalore / Kolhapur Construction Zone'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <X size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* 2x3 Quick-Action Grid */}
                <View style={styles.grid}>
                  {actionItems.map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      style={styles.gridItem}
                      onPress={() => handleActionClick(item.type)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.iconCircle,
                          {
                            backgroundColor: `${item.accentColor}15`,
                            borderColor: `${item.accentColor}40`,
                          },
                        ]}
                      >
                        {item.icon}
                      </View>
                      <Text style={styles.actionTitle}>{item.label}</Text>
                      <Text style={styles.actionSubtitle}>{item.sublabel}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Technical Bottom Disclaimer */}
                <View style={styles.technicalFooter}>
                  <Text style={styles.footerText}>
                    ALL ENTRIES ARE GEOTAGGED & TIMESTAMPED IN THE PRISMA AUDIT LOG
                  </Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Dynamic Sub-Modals */}
      <QuickActionModal
        visible={!!activeQuickAction}
        actionType={activeQuickAction}
        onClose={() => setActiveQuickAction(null)}
      />

      <UploadDocumentModal
        visible={showDocUploadModal}
        onClose={() => setShowDocUploadModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 18, 36, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  dragBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.blueprintBorderMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: colors.primaryAccent,
    letterSpacing: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.blueprintBorderMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridItem: {
    width: '31%',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  technicalFooter: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.blueprintBorderMuted,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

