import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  Mic,
  FileCheck2,
  Layers,
  Send,
  Camera,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { QuickActionType } from '../types';
import { dispatchRecord } from '../api/records';
import { useProjects } from '../context/ProjectContext';

interface QuickActionModalProps {
  visible: boolean;
  actionType: QuickActionType | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  visible,
  actionType,
  onClose,
  onActionComplete,
}) => {
  const { activeProject, refreshProjects } = useProjects();
  const [note, setNote] = useState<string>('');
  const [workersCount, setWorkersCount] = useState<string>('24');
  const [phaseName, setPhaseName] = useState<string>('Superstructure');
  const [progressPercent, setProgressPercent] = useState<string>('65');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!actionType || actionType === 'expense' || actionType === 'document') {
    return null;
  }

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setNote('Tower B Level 4 column rebar tying completed. Ready for formwork inspection by tomorrow 10 AM.');
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeProject) {
      Alert.alert('Error', 'No project selected.');
      return;
    }

    setIsProcessing(true);
    try {
      let payload: any = {};

      if (actionType === 'voice_note') {
        payload = {
          audioDuration: 18,
          transcription: note || 'Field voice note recorded on site.',
          capturedBy: 'Site Engineer (Voice)',
        };
      } else if (actionType === 'sitelog') {
        payload = {
          note: note.trim() || 'Standard daily shift inspection.',
          workersCount: Number(workersCount) || 20,
          supervisorName: 'Lead Engineer',
          weather: '26°C Clear',
        };
      } else if (actionType === 'phase_update') {
        payload = {
          phaseName,
          progressPercent: Number(progressPercent) || 50,
          notes: note.trim() || 'Milestone adjusted via mobile record sheet.',
        };
      } else if (actionType === 'photo') {
        payload = {
          imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80',
          caption: note || 'Proof of work inspection photo',
          latitude: 12.9716,
          longitude: 77.5946,
        };
      }

      await dispatchRecord({
        actionType,
        projectId: activeProject.id,
        payload,
      });

      Alert.alert('Action Dispatched', `${actionType.toUpperCase().replace('_', ' ')} logged successfully.`);
      await refreshProjects();
      onActionComplete?.();
      onClose();
      setNote('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to dispatch action.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTitle = () => {
    switch (actionType) {
      case 'voice_note':
        return 'Record AI Voice Memo';
      case 'sitelog':
        return 'Log Daily Shift Report';
      case 'phase_update':
        return 'Adjust Phase Progress';
      case 'photo':
        return 'Proof of Work Camera';
      default:
        return 'Quick Action';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>
                {activeProject?.name || 'PROJECT ACTION'} · FIELD DISPATCH
              </Text>
              <Text style={styles.title}>{getTitle()}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {actionType === 'voice_note' && (
              <View style={styles.voiceContainer}>
                <TouchableOpacity
                  style={[styles.micCircle, isRecording && styles.micCircleActive]}
                  onPress={handleVoiceToggle}
                >
                  <Mic size={36} color={isRecording ? colors.criticalDelete : colors.primaryAccent} />
                </TouchableOpacity>
                <Text style={styles.voicePrompt}>
                  {isRecording ? 'Listening and generating AI transcription...' : 'Tap microphone to speak site observation'}
                </Text>
                {isRecording && <ActivityIndicator size="small" color={colors.primaryAccent} style={{ marginTop: 8 }} />}
              </View>
            )}

            {actionType === 'sitelog' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ON-SITE LABOUR HEADCOUNT</Text>
                <TextInput
                  style={styles.input}
                  value={workersCount}
                  onChangeText={setWorkersCount}
                  keyboardType="numeric"
                  placeholder="e.g. 25 masons / helpers"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}

            {actionType === 'phase_update' && (
              <View style={styles.twoCol}>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.inputLabel}>TARGET PHASE</Text>
                  <TextInput
                    style={styles.input}
                    value={phaseName}
                    onChangeText={setPhaseName}
                    placeholder="Phase name"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>PROGRESS %</Text>
                  <TextInput
                    style={styles.input}
                    value={progressPercent}
                    onChangeText={setProgressPercent}
                    keyboardType="numeric"
                    placeholder="0-100"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            )}

            <Text style={styles.inputLabel}>OBSERVATION NOTES / TRANSCRIPTION</Text>
            <TextInput
              style={styles.textArea}
              value={note}
              onChangeText={setNote}
              placeholder="Detailed remarks for technical field record..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitButton, isProcessing && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#071224" />
              ) : (
                <>
                  <Send size={16} color="#071224" />
                  <Text style={styles.submitText}>COMMIT FIELD RECORD</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 18, 36, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.blueprintBorderMuted,
  },
  body: {
    padding: 16,
  },
  voiceContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
    backgroundColor: colors.backgroundDeep,
    borderRadius: 10,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
  },
  micCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
    borderColor: colors.primaryAccent,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  micCircleActive: {
    borderColor: colors.criticalDelete,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  voicePrompt: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'monospace',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 13,
  },
  textArea: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 13,
    minHeight: 80,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#071224',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
});

