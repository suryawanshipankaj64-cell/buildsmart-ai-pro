import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  Camera,
  CheckCircle2,
  Clock,
  CircleDot,
  UploadCloud,
  FileText,
  Save,
  MapPin,
  Trash2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { colors } from '../theme/colors';
import { Task } from '../types';
import { updateTask } from '../api/tasks';
import { uploadSitePhoto } from '../api/photos';

interface TaskProofModalProps {
  visible: boolean;
  task: Task | null;
  readOnly?: boolean;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: Task) => void;
}

export const TaskProofModal: React.FC<TaskProofModalProps> = ({
  visible,
  task,
  readOnly = false,
  onClose,
  onTaskUpdated,
}) => {
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  useEffect(() => {
    if (task) {
      const isDone = task.isCompleted || task.progressPercent >= 100;
      const isInProg = !isDone && task.progressPercent > 0;
      setStatus(isDone ? 'DONE' : isInProg ? 'IN_PROGRESS' : 'TODO');
      setProgressPercent(task.progressPercent || (isDone ? 100 : 0));
      setNotes(task.notes || '');
      setPhotoUri(task.proofImageUrl || null);
      setLocationCoords(null);
    }
  }, [task, visible]);

  if (!task) return null;

  const handleStatusSelect = (newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    setStatus(newStatus);
    if (newStatus === 'DONE') {
      setProgressPercent(100);
    } else if (newStatus === 'TODO') {
      setProgressPercent(0);
    } else if (progressPercent === 0 || progressPercent === 100) {
      setProgressPercent(50);
    }
  };

  const handleSliderStep = (delta: number) => {
    setProgressPercent((prev) => {
      const next = Math.min(100, Math.max(0, prev + delta));
      if (next === 100) setStatus('DONE');
      else if (next === 0) setStatus('TODO');
      else setStatus('IN_PROGRESS');
      return next;
    });
  };

  const handlePickImage = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture site proof.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
        // Geotag the inspection
        captureCoordinates();
      }
    } catch {
      // Fallback to gallery picker
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setPhotoUri(result.assets[0].uri);
          captureCoordinates();
        }
      } catch (err) {
        console.warn('Image picker error:', err);
      }
    }
  };

  const captureCoordinates = async () => {
    setIsLocating(true);
    try {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocationCoords({
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
        });
      }
    } catch (e) {
      console.warn('Geotagging failed:', e);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveUpdate = async () => {
    setIsSaving(true);
    try {
      const isCompleted = status === 'DONE' || progressPercent >= 100;
      const updated = await updateTask(task.id, {
        isCompleted,
        progressPercent,
        notes: notes.trim() || undefined,
        proofImageUrl: photoUri || undefined,
      });

      // Also record site photo if new photo was taken
      if (photoUri && task.projectId) {
        try {
          await uploadSitePhoto({
            projectId: task.projectId,
            imageUrl: photoUri,
            caption: `Proof of Work: ${task.title} (${progressPercent}%)`,
            latitude: locationCoords?.lat,
            longitude: locationCoords?.lon,
          });
        } catch {}
      }

      onTaskUpdated?.(updated);
      onClose();
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not sync task update with server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.phaseLabel}>
                {task.phaseName.toUpperCase()} · TRADE INSPECTION
              </Text>
              <Text style={styles.taskTitle} numberOfLines={2}>
                {task.title}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 1. Status Selector Pills */}
            <Text style={styles.sectionHeading}>EXECUTION STATUS</Text>
            <View style={styles.statusPillsRow}>
              <TouchableOpacity
                style={[
                  styles.statusPill,
                  status === 'TODO' && styles.statusPillActiveTodo,
                  readOnly && { opacity: 0.85 },
                ]}
                onPress={() => !readOnly && handleStatusSelect('TODO')}
                disabled={readOnly}
              >
                <CircleDot
                  size={14}
                  color={status === 'TODO' ? colors.textPrimary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    status === 'TODO' && styles.statusPillTextActive,
                  ]}
                >
                  To Do
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusPill,
                  status === 'IN_PROGRESS' && styles.statusPillActiveProgress,
                  readOnly && { opacity: 0.85 },
                ]}
                onPress={() => !readOnly && handleStatusSelect('IN_PROGRESS')}
                disabled={readOnly}
              >
                <Clock
                  size={14}
                  color={status === 'IN_PROGRESS' ? colors.secondaryInfo : colors.textMuted}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    status === 'IN_PROGRESS' && { color: colors.secondaryInfo, fontWeight: '800' },
                  ]}
                >
                  In Progress
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusPill,
                  status === 'DONE' && styles.statusPillActiveDone,
                  readOnly && { opacity: 0.85 },
                ]}
                onPress={() => !readOnly && handleStatusSelect('DONE')}
                disabled={readOnly}
              >
                <CheckCircle2
                  size={14}
                  color={status === 'DONE' ? colors.primaryAccent : colors.textMuted}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    status === 'DONE' && { color: colors.primaryAccent, fontWeight: '800' },
                  ]}
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Progress Percentage Controls */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.sectionHeading}>PROGRESS ESTIMATION</Text>
                <Text style={styles.progressReadout}>{progressPercent}%</Text>
              </View>

              {/* Visual Fill Track */}
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor:
                        progressPercent >= 100
                          ? colors.primaryAccent
                          : progressPercent > 0
                          ? colors.secondaryInfo
                          : colors.blueprintBorderMuted,
                    },
                  ]}
                />
              </View>

              {/* Direct Percentage Target Steppers (0% - 25% - 50% - 75% - 100%) */}
              {!readOnly && (
                <View style={styles.stepperRow}>
                  {[0, 25, 50, 75, 100].map((step) => {
                    const isStepActive = progressPercent === step;
                    return (
                      <TouchableOpacity
                        key={step}
                        style={[
                          styles.stepperBtn,
                          isStepActive && {
                            borderColor: colors.primaryAccent,
                            backgroundColor: 'rgba(45, 191, 158, 0.15)',
                          },
                        ]}
                        onPress={() => {
                          setProgressPercent(step);
                          if (step === 100) setStatus('DONE');
                          else if (step === 0) setStatus('TODO');
                          else setStatus('IN_PROGRESS');
                        }}
                      >
                        <Text
                          style={[
                            styles.stepperText,
                            isStepActive && { color: colors.primaryAccent, fontWeight: '800' },
                          ]}
                        >
                          {step}%
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 3. Proof-of-Work Photo Placeholder & Capture */}
            <View style={styles.photoSection}>
              <View style={styles.photoHeader}>
                <Text style={styles.sectionHeading}>PROOF-OF-WORK PHOTO</Text>
                {locationCoords && (
                  <View style={styles.geotagBadge}>
                    <MapPin size={10} color={colors.primaryAccent} />
                    <Text style={styles.geotagText}>
                      GPS: {locationCoords.lat.toFixed(3)}, {locationCoords.lon.toFixed(3)}
                    </Text>
                  </View>
                )}
              </View>

              {photoUri ? (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  {!readOnly && (
                    <View style={styles.photoActionRow}>
                      <TouchableOpacity
                        style={styles.retakeButton}
                        onPress={handlePickImage}
                      >
                        <Camera size={14} color="#FFF" />
                        <Text style={styles.retakeText}>Retake Photo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => setPhotoUri(null)}
                      >
                        <Trash2 size={14} color="#FFF" />
                        <Text style={styles.removePhotoText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : readOnly ? (
                <View style={[styles.photoPlaceholder, { paddingVertical: 20 }]}>
                  <Text style={styles.placeholderSub}>
                    No proof photo attached by site engineer for this task yet.
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoPlaceholder}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <View style={styles.cameraIconBox}>
                    <Camera size={24} color={colors.primaryAccent} />
                  </View>
                  <Text style={styles.placeholderTitle}>
                    Capture Site Inspection Photo
                  </Text>
                  <Text style={styles.placeholderSub}>
                    Geotags GPS coordinates & verifies trade milestone
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 4. Site Notes Text Area */}
            <View style={styles.notesSection}>
              <View style={styles.notesHeader}>
                <FileText size={14} color={colors.textMuted} />
                <Text style={styles.sectionHeading}>
                  {readOnly ? 'ENGINEER REMARKS & SITE NOTES' : 'SITE NOTES / REMARKS'}
                </Text>
              </View>
              <TextInput
                style={[styles.notesInput, readOnly && { backgroundColor: 'rgba(18, 37, 66, 0.4)', color: colors.textMuted }]}
                value={notes || (readOnly ? 'No remarks logged.' : '')}
                onChangeText={setNotes}
                editable={!readOnly}
                placeholder="Log field observations, material batch numbers, or contractor remarks..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* 5. Save Update Button */}
          <View style={styles.footer}>
            {readOnly ? (
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.cardSurface, borderColor: colors.blueprintBorder, borderWidth: 1 }]}
                onPress={onClose}
              >
                <Text style={[styles.saveButtonText, { color: colors.textPrimary }]}>DISMISS INSPECTION VIEW</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSaveUpdate}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#071224" />
                ) : (
                  <>
                    <Save size={16} color="#071224" />
                    <Text style={styles.saveButtonText}>SAVE UPDATE & SYNC</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
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
  modalSheet: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
  },
  phaseLabel: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: colors.primaryAccent,
    letterSpacing: 1,
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.blueprintBorderMuted,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionHeading: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  statusPillActiveTodo: {
    borderColor: colors.textMuted,
    backgroundColor: 'rgba(142, 171, 199, 0.15)',
  },
  statusPillActiveProgress: {
    borderColor: colors.secondaryInfo,
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
  },
  statusPillActiveDone: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
  },
  statusPillText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  statusPillTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  progressSection: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressReadout: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: colors.primaryAccent,
  },
  sliderTrack: {
    height: 10,
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sliderFill: {
    height: '100%',
    borderRadius: 5,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepperBtn: {
    flex: 1,
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  stepperText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.paper,
    fontFamily: 'monospace',
  },
  photoSection: {
    marginBottom: 16,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  geotagBadge: {
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
  geotagText: {
    color: colors.primaryAccent,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  photoPlaceholder: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorder,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  placeholderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  placeholderSub: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  photoPreviewContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
  },
  photoPreview: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  photoActionRow: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retakeButton: {
    backgroundColor: 'rgba(7, 18, 36, 0.85)',
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  removePhotoButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  removePhotoText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  retakeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 13,
    minHeight: 80,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  saveButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#071224',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
});

