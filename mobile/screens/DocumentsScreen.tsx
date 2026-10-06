import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import {
  FolderKanban,
  Search,
  FileText,
  Download,
  Share2,
  Trash2,
  UploadCloud,
  History,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  Building2,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { DocumentRecord, DocumentCategory } from '../types';
import { fetchDocuments, deleteDocument } from '../api/documents';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { UploadDocumentModal } from '../components/UploadDocumentModal';
import { Banner } from '../components/Banner';
import { LoadingSpinner } from '../components/LoadingSpinner';

const CATEGORIES = ['ALL', 'PLANS', 'PERMITS', 'CONTRACTS', 'BILLS'];

export const DocumentsScreen = () => {
  const route = useRoute<any>();
  const { user, isClient } = useAuth();
  const { projects, activeProject, setActiveProjectId } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    route.params?.projectId || activeProject?.id || (projects[0]?.id ?? '')
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    route.params?.category || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [uploadModalVisible, setUploadModalVisible] = useState<boolean>(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.projectId && route.params.projectId !== selectedProjectId) {
      setSelectedProjectId(route.params.projectId);
      setActiveProjectId(route.params.projectId);
    } else if (activeProject?.id && !selectedProjectId) {
      setSelectedProjectId(activeProject.id);
    }
  }, [route.params?.projectId, activeProject?.id]);

  const currentProject = projects.find((p) => p.id === selectedProjectId) || activeProject;

  const loadDocuments = useCallback(async (targetId?: string) => {
    const pId = targetId || selectedProjectId;
    setLoading(true);
    try {
      const data = await fetchDocuments({
        projectId: pId,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        search: searchQuery || undefined,
      });
      setDocuments(data);
      if (data.length > 0 && (!selectedDoc || !data.some((d) => d.id === selectedDoc.id))) {
        setSelectedDoc(data[0]);
      }
    } catch (err: any) {
      console.warn('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedCategory, searchQuery, selectedDoc]);

  useEffect(() => {
    loadDocuments(selectedProjectId);
  }, [selectedProjectId, loadDocuments]);

  const handleSelectProject = (projId: string) => {
    if (projId === selectedProjectId) return;
    setSelectedProjectId(projId);
    setActiveProjectId(projId);
    setDocuments([]);
    setSelectedDoc(null);
    loadDocuments(projId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments(selectedProjectId);
    setRefreshing(false);
  };

  const handleDocumentUploaded = (newDoc: DocumentRecord) => {
    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
    setBannerMsg(`Document "${newDoc.title}" added to blueprint vault.`);
  };

  const handleDownload = (doc: DocumentRecord) => {
    Alert.alert(
      'Download Blueprint',
      `Downloading "${doc.fileName}" (${doc.fileSize}). Saved to local engineering cache.`
    );
  };

  const handleShare = async (doc: DocumentRecord) => {
    try {
      await Share.share({
        title: doc.title,
        message: `BuildSmart AI Blueprint: ${doc.title} (${doc.version}) - ${doc.url}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleDelete = async (doc: DocumentRecord) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to permanently delete "${doc.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(doc.id);
              setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
              if (selectedDoc?.id === doc.id) {
                setSelectedDoc(null);
              }
              setBannerMsg(`Document "${doc.title}" deleted.`);
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete document.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Blueprint & Document Vault"
        subtitle={`${currentProject?.name || 'Project Documents'} · Version Controlled`}
      />

      {/* Multi-Project Selector Header (If more than 1 project exists) */}
      {projects.length > 1 && (
        <View style={styles.projectSelectorBar}>
          <Text style={styles.projectSelectorLabel}>ACTIVE PROJECT:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {projects.map((proj) => {
              const isSelected = proj.id === selectedProjectId;
              return (
                <TouchableOpacity
                  key={proj.id}
                  style={[styles.projTabPill, isSelected && styles.projTabPillActive]}
                  onPress={() => handleSelectProject(proj.id)}
                >
                  <Building2 size={11} color={isSelected ? '#071224' : colors.primaryAccent} />
                  <Text style={[styles.projTabPillText, isSelected && styles.projTabPillTextActive]}>
                    {proj.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryAccent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {bannerMsg && (
          <Banner
            type="success"
            message={bannerMsg}
            onDismiss={() => setBannerMsg(null)}
          />
        )}

        {/* Search & Upload Header Bar */}
        <View style={styles.topActionsRow}>
          <View style={styles.searchContainer}>
            <Search size={14} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search drawings, permits, contracts..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {!isClient && (
            <TouchableOpacity
              style={styles.uploadTriggerBtn}
              onPress={() => setUploadModalVisible(true)}
              activeOpacity={0.8}
            >
              <UploadCloud size={16} color="#071224" />
              <Text style={styles.uploadTriggerText}>UPLOAD</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills */}
        <View style={styles.categoryPillsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isActive && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat === 'ALL' ? 'All Documents' : cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Document Preview Card (if any selected) */}
        {selectedDoc && (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.previewTagRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{selectedDoc.category}</Text>
                  </View>
                  <View style={styles.versionBadge}>
                    <Text style={styles.versionBadgeText}>{selectedDoc.version}</Text>
                  </View>
                </View>
                <Text style={styles.previewTitle} numberOfLines={2}>
                  {selectedDoc.title}
                </Text>
              </View>
            </View>

            {/* Document Details Grid */}
            <View style={styles.metaGrid}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>FILE NAME</Text>
                <Text style={styles.metaValue} numberOfLines={1}>
                  {selectedDoc.fileName}
                </Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>SIZE & DATE</Text>
                <Text style={styles.metaValue}>
                  {selectedDoc.fileSize} ·{' '}
                  {new Date(selectedDoc.uploadedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
            </View>

            {/* Metadata Tags */}
            {selectedDoc.tags && selectedDoc.tags.length > 0 && (
              <View style={styles.tagSection}>
                <Tag size={11} color={colors.textMuted} />
                <View style={styles.tagWrap}>
                  {selectedDoc.tags.map((t, idx) => (
                    <View key={idx} style={styles.tagPill}>
                      <Text style={styles.tagPillText}>#{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Version History Log */}
            {selectedDoc.history && selectedDoc.history.length > 0 && (
              <View style={styles.historySection}>
                <View style={styles.historyHeader}>
                  <History size={12} color={colors.primaryAccent} />
                  <Text style={styles.historyHeading}>VERSION AUDIT LOG</Text>
                </View>
                {selectedDoc.history.map((h, i) => (
                  <View key={i} style={styles.historyItem}>
                    <View style={styles.historyDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyVer}>
                        {h.version} · {h.changedBy} ({h.date})
                      </Text>
                      <Text style={styles.historyNote}>{h.note}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Preview Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.actionBtnDownload}
                onPress={() => handleDownload(selectedDoc)}
              >
                <Download size={14} color="#071224" />
                <Text style={styles.actionBtnDownloadText}>DOWNLOAD</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnShare}
                onPress={() => handleShare(selectedDoc)}
              >
                <Share2 size={14} color={colors.secondaryInfo} />
                <Text style={styles.actionBtnShareText}>SHARE</Text>
              </TouchableOpacity>

              {!isClient && (
                <TouchableOpacity
                  style={styles.actionBtnDelete}
                  onPress={() => handleDelete(selectedDoc)}
                >
                  <Trash2 size={14} color={colors.criticalDelete} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Document List Section */}
        <View style={styles.listSection}>
          <Text style={styles.listHeading}>
            INDEXED BLUEPRINTS & REPORTS ({documents.length})
          </Text>

          {loading && !refreshing ? (
            <LoadingSpinner message="Querying document vault..." />
          ) : documents.length === 0 ? (
            <View style={styles.emptyCard}>
              <FileText size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>NO DOCUMENTS FOUND</Text>
              <Text style={styles.emptySub}>
                Upload structural blueprints, municipal permits, or contractor bills using the button above.
              </Text>
            </View>
          ) : (
            documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.docItem, isSelected && styles.docItemSelected]}
                  onPress={() => setSelectedDoc(doc)}
                  activeOpacity={0.7}
                >
                  <View style={styles.docIconBox}>
                    <FileText
                      size={20}
                      color={
                        doc.category === 'PLANS'
                          ? colors.primaryAccent
                          : doc.category === 'BILLS'
                          ? colors.outflowExpense
                          : colors.secondaryInfo
                      }
                    />
                  </View>

                  <View style={styles.docInfo}>
                    <Text style={styles.docTitle} numberOfLines={1}>
                      {doc.title}
                    </Text>
                    <View style={styles.docMeta}>
                      <Text style={styles.docMetaText}>
                        {doc.fileName} · {doc.fileSize}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.docRight}>
                    <View style={styles.versionBadgeSmall}>
                      <Text style={styles.versionBadgeSmallText}>{doc.version}</Text>
                    </View>
                    <ChevronRight size={14} color={colors.textMuted} style={{ marginTop: 4 }} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onDocumentUploaded={handleDocumentUploaded}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
    paddingVertical: 10,
  },
  uploadTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryAccent,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 8,
    gap: 6,
  },
  uploadTriggerText: {
    color: '#071224',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  categoryPillsContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  categoryPill: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  categoryPillActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
  },
  categoryPillText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  categoryPillTextActive: {
    color: colors.primaryAccent,
    fontWeight: '800',
  },
  previewCard: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  previewTagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.primaryAccent,
    fontWeight: '800',
  },
  versionBadge: {
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    borderColor: colors.secondaryInfo,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  versionBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.secondaryInfo,
    fontWeight: '800',
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaGrid: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginVertical: 10,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontWeight: '700',
  },
  metaValue: {
    fontSize: 11,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    fontWeight: '600',
    marginTop: 2,
  },
  tagSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagPill: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagPillText: {
    fontSize: 9,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  historySection: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  historyHeading: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
    letterSpacing: 0.8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  historyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primaryAccent,
    marginTop: 4,
  },
  historyVer: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textPrimary,
    fontWeight: '700',
  },
  historyNote: {
    fontSize: 10,
    color: colors.textMuted,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtnDownload: {
    flex: 2,
    backgroundColor: colors.primaryAccent,
    borderRadius: 6,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnDownloadText: {
    color: '#071224',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  actionBtnShare: {
    flex: 1.5,
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.secondaryInfo,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnShareText: {
    color: colors.secondaryInfo,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  actionBtnDelete: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.criticalDelete,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listSection: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  listHeading: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  docItem: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  docItemSelected: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(45, 191, 158, 0.08)',
  },
  docIconBox: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.blueprintBorderMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  docMetaText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  docRight: {
    alignItems: 'flex-end',
  },
  versionBadgeSmall: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  versionBadgeSmallText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'monospace',
    marginTop: 8,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  projectSelectorBar: {
    backgroundColor: colors.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  projectSelectorLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  projTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.blueprintBorderMuted,
    marginRight: 8,
  },
  projTabPillActive: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  projTabPillText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textMuted,
  },
  projTabPillTextActive: {
    color: '#071224',
    fontWeight: '800',
  },
});

