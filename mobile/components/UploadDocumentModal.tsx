import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, UploadCloud, FileText, CheckSquare, Square, ShieldCheck } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../theme/colors';
import { DocumentCategory, Role, DocumentRecord } from '../types';
import { uploadDocument } from '../api/documents';
import { useProjects } from '../context/ProjectContext';

interface UploadDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onDocumentUploaded?: (doc: DocumentRecord) => void;
}

const CATEGORIES: DocumentCategory[] = ['PLANS', 'PERMITS', 'CONTRACTS', 'BILLS'];
const ROLES: Role[] = ['ADMIN', 'ENGINEER', 'CLIENT'];

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  visible,
  onClose,
  onDocumentUploaded,
}) => {
  const { projects, activeProject } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProject?.id || '');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<DocumentCategory>('PLANS');
  const [version, setVersion] = useState<string>('v1.0');
  const [selectedFileName, setSelectedFileName] = useState<string>('Structural_Detail_Drawing.dwg.pdf');
  const [selectedFileSize, setSelectedFileSize] = useState<string>('4.8 MB');
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['ADMIN', 'ENGINEER', 'CLIENT']);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/acad', 'text/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFileName(file.name);
        const sizeMb = file.size ? (file.size / (1024 * 1024)).toFixed(1) : '2.5';
        setSelectedFileSize(`${sizeMb} MB`);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (e) {
      console.warn('Document picker error:', e);
    }
  };

  const handleUpload = async () => {
    const targetProject = selectedProjectId || activeProject?.id || projects[0]?.id;
    if (!targetProject) {
      Alert.alert('Selection Error', 'Please select an active project.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Document title is required.');
      return;
    }
    if (selectedRoles.length === 0) {
      Alert.alert('Permission Error', 'Select at least one role with viewing permissions.');
      return;
    }

    setIsUploading(true);
    try {
      const created = await uploadDocument({
        projectId: targetProject,
        title: title.trim(),
        category,
        fileName: selectedFileName,
        fileSize: selectedFileSize,
        version: version.trim() || 'v1.0',
        roleVisibility: selectedRoles,
        tags: [category, 'MobileUpload'],
      });

      Alert.alert('Upload Complete', `"${title}" has been securely committed and indexed.`);
      onDocumentUploaded?.(created);
      onClose();
      // Reset form
      setTitle('');
      setVersion('v1.0');
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>BLUEPRINT VAULT</Text>
              <Text style={styles.title}>Upload Versioned Document</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Category Selector */}
            <Text style={styles.label}>DOCUMENT CATEGORY</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      category === cat && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Document Title */}
            <Text style={styles.label}>DOCUMENT TITLE</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Architectural Plan Level 2 Revision..."
              placeholderTextColor={colors.textMuted}
            />

            {/* Version & Project Row */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>VERSION TAG</Text>
                <TextInput
                  style={styles.input}
                  value={version}
                  onChangeText={setVersion}
                  placeholder="v1.0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <Text style={styles.label}>FILE SIZE</Text>
                <TextInput
                  style={[styles.input, { color: colors.textMuted }]}
                  value={selectedFileSize}
                  editable={false}
                />
              </View>
            </View>

            {/* Document File Attachment */}
            <Text style={styles.label}>ATTACH FILE / DRAWING</Text>
            <TouchableOpacity style={styles.fileBox} onPress={handlePickDocument}>
              <View style={styles.fileIconBox}>
                <UploadCloud size={20} color={colors.primaryAccent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {selectedFileName}
                </Text>
                <Text style={styles.fileSub}>Tap to browse device PDF / CAD files</Text>
              </View>
            </TouchableOpacity>

            {/* Role Visibility Gating */}
            <View style={styles.roleSection}>
              <View style={styles.roleHeader}>
                <ShieldCheck size={14} color={colors.primaryAccent} />
                <Text style={styles.label}>ROLE VISIBILITY GATING</Text>
              </View>
              <Text style={styles.roleSubtext}>
                Specify which technical stakeholders can access this document:
              </Text>

              <View style={styles.rolesGrid}>
                {ROLES.map((role) => {
                  const isChecked = selectedRoles.includes(role);
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleItem, isChecked && styles.roleItemActive]}
                      onPress={() => toggleRole(role)}
                    >
                      {isChecked ? (
                        <CheckSquare size={16} color={colors.primaryAccent} />
                      ) : (
                        <Square size={16} color={colors.textMuted} />
                      )}
                      <Text
                        style={[
                          styles.roleText,
                          isChecked && { color: colors.textPrimary, fontWeight: '700' },
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Submit Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isUploading && styles.submitDisabled]}
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#071224" />
              ) : (
                <>
                  <UploadCloud size={16} color="#071224" />
                  <Text style={styles.submitText}>COMMIT TO VAULT</Text>
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
    maxHeight: '90%',
    paddingBottom: 20,
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  label: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  categoryPill: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  categoryPillActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
  },
  categoryPillText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontWeight: '700',
  },
  categoryPillTextActive: {
    color: colors.primaryAccent,
    fontWeight: '800',
  },
  input: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 13,
    marginBottom: 14,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorder,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  fileSub: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  roleSection: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleSubtext: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 10,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    minWidth: '45%',
  },
  roleItemActive: {
    borderColor: colors.primaryAccent,
  },
  roleText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
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

