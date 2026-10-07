import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
} from 'react-native';
import {
  Layers,
  CheckCircle2,
  Clock,
  CircleDot,
  Filter,
  Search,
  ChevronRight,
  User,
  Calendar,
  Sparkles,
  Zap,
  Plus,
  X,
  TrendingUp,
  Save,
  Camera,
  MapPin,
  Eye,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Building2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { Task, SitePhoto } from '../types';
import { fetchTasks, createTask, updateTask, deleteTask, seedProjectTasks, clearProjectTasks } from '../api/tasks';
import { fetchSitePhotos, uploadSitePhoto, deleteSitePhoto } from '../api/photos';
import { dispatchRecord } from '../api/records';
import { Header } from '../components/Header';
import { TaskProofModal } from '../components/TaskProofModal';
import { Banner } from '../components/Banner';
import { LoadingSpinner } from '../components/LoadingSpinner';

const TRADES = [
  'Civil Contractor',
];

const STANDARD_PHASES = [
  'Planning',
  'Substructure & Foundation',
  'Superstructure & Masonry',
  'Plumbing Work',
  'Electrical Work',
  'Paint & Finishing Work',
  'Interior & Woodwork',
  'Handover & Commissioning',
];

const CUSTOM_PHASE_PRESETS = [
  'Landscape & Hardscaping',
  'HVAC Air Conditioning',
  'Solar Energy & Rooftop Grid',
  'Waterproofing & Terrace Screed',
  'Firefighting & Security Gate',
  'Swimming Pool & Decking',
];

const PROGRESS_STEPS = [0, 25, 50, 75, 100];

const SAMPLE_PHOTO_PRESETS = [
  {
    label: 'Planning & Layout',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80',
    caption: 'Planning site boundary pegging & excavation grid verified',
    phase: 'Planning',
  },
  {
    label: 'Excavation & Footing',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    caption: 'Substructure footing pit excavation & soil compaction inspection',
    phase: 'Substructure & Foundation',
  },
  {
    label: 'Rebar & Framing',
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    caption: 'Superstructure column reinforcement steel rebar tied to spec',
    phase: 'Superstructure & Masonry',
  },
  {
    label: 'Plumbing Lines',
    url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80',
    caption: 'Concealed CPVC plumbing water lines & drainage pipeline inspection',
    phase: 'Plumbing Work',
  },
  {
    label: 'Electrical Conduits',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    caption: 'PVC conduit chasing, distribution box & circuit wiring inspection',
    phase: 'Electrical Work',
  },
  {
    label: 'Paint & Facade',
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Paint & wall putty primer coat application inspection',
    phase: 'Paint & Finishing Work',
  },
  {
    label: 'Interior Millwork',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    caption: 'Interior ceiling panelling and custom millwork cabinetry fitting',
    phase: 'Interior & Woodwork',
  },
];

// Helper to normalize any incoming legacy phase name into the canonical 8 standard phases
const normalizePhaseName = (phase?: string | null): string => {
  if (!phase) return 'Planning';
  const p = phase.trim().toLowerCase();

  if (p.includes('plan')) return 'Planning';
  if (p.includes('found') || p.includes('substruct') || p.includes('excavat') || p.includes('footing') || p.includes('pile')) {
    return 'Substructure & Foundation';
  }
  if (p.includes('superstruct') || p.includes('rcc') || p.includes('structure') || p.includes('mason') || p.includes('brick') || p.includes('block') || p.includes('slab') || p.includes('column')) {
    return 'Superstructure & Masonry';
  }
  if (p.includes('plumb') || p.includes('drain') || p.includes('sanitar') || p.includes('pipe')) {
    return 'Plumbing Work';
  }
  if (p.includes('electr') || p.includes('conduit') || p.includes('wir') || p.includes('switch')) {
    return 'Electrical Work';
  }
  if (p.includes('paint') || p.includes('finish') || p.includes('plaster') || p.includes('putty') || p.includes('coat')) {
    return 'Paint & Finishing Work';
  }
  if (p.includes('interior') || p.includes('wood') || p.includes('tile') || p.includes('marble') || p.includes('door') || p.includes('cabinet') || p.includes('ceiling')) {
    return 'Interior & Woodwork';
  }
  if (p.includes('handover') || p.includes('commission') || p.includes('clean') || p.includes('final')) {
    return 'Handover & Commissioning';
  }

  const match = STANDARD_PHASES.find((sp) => sp.toLowerCase() === p);
  if (match) return match;

  return phase.trim();
};

export const ProjectProgressScreen = () => {
  const route = useRoute<any>();
  const { projects, activeProject, setActiveProjectId, refreshProjects } = useProjects();
  const { user, isClient, isAdmin, canEditData } = useAuth();

  // Selected Project ID
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    route.params?.projectId || activeProject?.id || (projects[0]?.id ?? '')
  );

  const [selectedPhase, setSelectedPhase] = useState<string>('All Phases');
  const [selectedPhotoFilterPhase, setSelectedPhotoFilterPhase] = useState<string>('All Photos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sitePhotos, setSitePhotos] = useState<SitePhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState<boolean>(false);
  const [uploadPhotoModalVisible, setUploadPhotoModalVisible] = useState<boolean>(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<SitePhoto | null>(null);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Auto-seed tasks ON / OFF toggle state (Engineers/Admins only)
  const [autoSeedTasksEnabled, setAutoSeedTasksEnabled] = useState<boolean>(true);
  const [isClearingTasks, setIsClearingTasks] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskPhase, setNewTaskPhase] = useState<string>('Planning');
  const [isCustomPhaseMode, setIsCustomPhaseMode] = useState<boolean>(false);
  const [customPhaseInput, setCustomPhaseInput] = useState<string>('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('Civil Contractor');
  const [isCustomTradeMode, setIsCustomTradeMode] = useState<boolean>(false);
  const [customTradeInput, setCustomTradeInput] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newTaskProgressPercent, setNewTaskProgressPercent] = useState<number>(0);
  const [isCreatingTask, setIsCreatingTask] = useState<boolean>(false);

  // New photo upload form state
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [photoPhase, setPhotoPhase] = useState<string>('Planning');
  const [photoCoords, setPhotoCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  // Keep route param or active project synchronized
  useEffect(() => {
    if (route.params?.projectId && route.params.projectId !== selectedProjectId) {
      setSelectedProjectId(route.params.projectId);
      setActiveProjectId(route.params.projectId);
    } else if (activeProject?.id && !selectedProjectId) {
      setSelectedProjectId(activeProject.id);
    }
  }, [route.params?.projectId, activeProject?.id]);

  const currentProject = projects.find((p) => p.id === selectedProjectId) || activeProject;

  const loadData = useCallback(async (targetId?: string) => {
    const pId = targetId || selectedProjectId;
    if (!pId) return;
    setLoading(true);
    try {
      const [tasksData, photosData] = await Promise.all([
        fetchTasks(pId),
        fetchSitePhotos(pId),
      ]);
      // Normalize task phase names to canonical standard phases
      const normalizedTasks = (tasksData || [])
        .filter((t) => !t.projectId || t.projectId === pId)
        .map((t) => ({ ...t, phaseName: normalizePhaseName(t.phaseName) }));

      setTasks(normalizedTasks);
      setSitePhotos((photosData || []).filter((p) => !p.projectId || p.projectId === pId));
    } catch (err: any) {
      console.warn('Failed to load tasks and photos:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadData(selectedProjectId);
  }, [selectedProjectId, loadData]);

  const handleSelectProject = (projId: string) => {
    if (projId === selectedProjectId) return;
    setSelectedProjectId(projId);
    setActiveProjectId(projId);
    setTasks([]);
    setSitePhotos([]);
    loadData(projId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(selectedProjectId), refreshProjects()]);
    setRefreshing(false);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask, phaseName: normalizePhaseName(updatedTask.phaseName) } : t))
    );
    setBannerMsg(`Task "${updatedTask.title}" updated (${updatedTask.progressPercent}%).`);
    refreshProjects();
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    if (isClient) {
      Alert.alert('Read-Only Clearance', 'Client accounts cannot delete tasks.');
      return;
    }
    Alert.alert(
      'Delete Milestone Task',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
              setTasks((prev) => prev.filter((t) => t.id !== taskId));
              setBannerMsg(`Task "${title}" removed.`);
              await Promise.all([loadData(selectedProjectId), refreshProjects()]);
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete task.');
            }
          },
        },
      ]
    );
  };

  const handleAutoSeedTradeTasks = async () => {
    if (isClient) {
      Alert.alert('Read-Only Clearance', 'Auto-seed is restricted to field engineers and administrators.');
      return;
    }
    if (!selectedProjectId) return;
    setIsSeeding(true);
    try {
      await seedProjectTasks(selectedProjectId, 'seed');
      setAutoSeedTasksEnabled(true);
      setBannerMsg('Standard milestone deliverables for Civil Contractor across all phases generated!');
      await Promise.all([loadData(selectedProjectId), refreshProjects()]);
    } catch (err: any) {
      Alert.alert('Auto-generation Failed', err?.message || 'Failed to generate phase tasks.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleToggleAutoSeed = async (enable: boolean) => {
    if (isClient) return;
    setAutoSeedTasksEnabled(enable);
    if (enable && tasks.length === 0 && selectedProjectId) {
      await handleAutoSeedTradeTasks();
    } else {
      setBannerMsg(
        enable
          ? 'Auto-Seed Tasks enabled (Displaying all phase deliverables).'
          : 'Direct Phase Mode active (Auto-seeded sub-tasks hidden).'
      );
    }
  };

  const handleClearSeededTasks = async () => {
    if (isClient) {
      Alert.alert('Read-Only Clearance', 'Client accounts cannot clear tasks.');
      return;
    }
    if (!selectedProjectId) return;
    Alert.alert(
      'Clear Standard Tasks',
      'Are you sure you want to remove all standard milestone tasks for this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Tasks',
          style: 'destructive',
          onPress: async () => {
            setIsClearingTasks(true);
            try {
              await clearProjectTasks(selectedProjectId);
              setBannerMsg('Standard milestone deliverables cleared.');
              await Promise.all([loadData(selectedProjectId), refreshProjects()]);
            } catch (err: any) {
              Alert.alert('Clear Failed', err?.message || 'Could not clear tasks.');
            } finally {
              setIsClearingTasks(false);
            }
          },
        },
      ]
    );
  };

  // Direct Phase Progress quick-tap updater (0% - 25% - 50% - 75% - 100%)
  const handlePhaseQuickUpdate = async (phaseName: string, targetPercent: number) => {
    if (isClient) {
      Alert.alert('Read-Only Clearance', 'Client accounts have read-only access into live phase progress.');
      return;
    }
    if (!selectedProjectId) return;
    const targetAssignee = 'Civil Contractor';
    try {
      await dispatchRecord({
        actionType: 'phase_update',
        projectId: selectedProjectId,
        payload: {
          phaseName,
          progressPercent: targetPercent,
          assignee: targetAssignee,
          notes: `Phase "${phaseName}" updated to ${targetPercent}% from mobile.`,
        },
      });

      // Update local task state immediately for instant feedback
      setTasks((prev) => {
        const hasExisting = prev.some(
          (t) => t.phaseName.trim().toLowerCase() === phaseName.trim().toLowerCase()
        );
        if (hasExisting) {
          return prev.map((t) =>
            t.phaseName.trim().toLowerCase() === phaseName.trim().toLowerCase()
              ? { ...t, progressPercent: targetPercent, isCompleted: targetPercent >= 100, assignee: 'Civil Contractor' }
              : t
          );
        } else {
          const newTaskItem: Task = {
            id: `temp-phase-${Date.now()}`,
            projectId: selectedProjectId,
            phaseName,
            title: `${phaseName} · Civil Contractor Deliverables`,
            assignee: targetAssignee,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            progressPercent: targetPercent,
            isCompleted: targetPercent >= 100,
          };
          return [newTaskItem, ...prev];
        }
      });

      setBannerMsg(`Phase "${phaseName}" updated to ${targetPercent}%. Synchronized with Web Admin.`);
      await Promise.all([loadData(selectedProjectId), refreshProjects()]);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update phase progress.');
    }
  };

  // Direct single task percentage quick-tap updater
  const handleTaskQuickPercent = async (task: Task, targetPercent: number) => {
    if (isClient) {
      Alert.alert('Read-Only Clearance', 'Client accounts cannot modify task deliverables.');
      return;
    }
    try {
      const updated = await updateTask(task.id, {
        progressPercent: targetPercent,
        isCompleted: targetPercent >= 100,
      });
      handleTaskUpdated(updated);
      await Promise.all([loadData(selectedProjectId), refreshProjects()]);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Failed to update task progress.');
    }
  };

  // Direct checkbox completion toggle
  const handleTaskToggleComplete = async (task: Task) => {
    if (isClient) {
      handleTaskClick(task);
      return;
    }
    const nextCompleted = !task.isCompleted;
    const nextPercent = nextCompleted ? 100 : 0;
    try {
      const updated = await updateTask(task.id, {
        isCompleted: nextCompleted,
        progressPercent: nextPercent,
      });
      handleTaskUpdated(updated);
      await Promise.all([loadData(selectedProjectId), refreshProjects()]);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Failed to toggle task completion.');
    }
  };

  // Add Task to Phase (Standard or Custom)
  const handleCreateNewTask = async () => {
    if (isClient) {
      Alert.alert('Read-Only Clearance', 'Client accounts cannot create new milestone tasks.');
      return;
    }
    if (!selectedProjectId) {
      Alert.alert('Error', 'No active project selected.');
      return;
    }
    if (!newTaskTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a task title.');
      return;
    }

    const finalPhase = (isCustomPhaseMode && customPhaseInput.trim())
      ? normalizePhaseName(customPhaseInput.trim())
      : normalizePhaseName(newTaskPhase);

    const finalAssignee = (isCustomTradeMode && customTradeInput.trim())
      ? customTradeInput.trim()
      : newTaskAssignee;

    setIsCreatingTask(true);
    try {
      const created = await createTask({
        projectId: selectedProjectId,
        phaseName: finalPhase,
        title: newTaskTitle.trim(),
        assignee: finalAssignee,
        dueDate: new Date(newTaskDueDate).toISOString(),
        progressPercent: newTaskProgressPercent,
      });

      const normalizedCreated = { ...created, phaseName: normalizePhaseName(created.phaseName) };
      setTasks((prev) => [normalizedCreated, ...prev]);
      setBannerMsg(`Task "${normalizedCreated.title}" added to ${finalPhase}.`);
      setNewTaskTitle('');
      setIsCustomPhaseMode(false);
      setCustomPhaseInput('');
      setIsCustomTradeMode(false);
      setCustomTradeInput('');
      setNewTaskProgressPercent(0);
      setAddTaskModalVisible(false);
      await Promise.all([loadData(selectedProjectId), refreshProjects()]);
    } catch (err: any) {
      Alert.alert('Creation Failed', err?.message || 'Could not create task.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Open photo modal for a specific phase
  const handleOpenPhotoModalForPhase = (phase: string) => {
    setPhotoPhase(normalizePhaseName(phase));
    setPhotoCaption('');
    setPhotoUri(null);
    captureGps();
    setUploadPhotoModalVisible(true);
  };

  // Photo Capture Flow
  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.6, base64: true });
        if (!res.canceled && res.assets && res.assets.length > 0) {
          const asset = res.assets[0];
          const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
          setPhotoUri(uri);
          captureGps();
          return;
        }
      }
    } catch {}

    // Fallback to library
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.6, base64: true });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setPhotoUri(uri);
        captureGps();
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const captureGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setPhotoCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
      }
    } catch {}
  };

  const handleUploadPhotoSubmit = async () => {
    if (!selectedProjectId) {
      Alert.alert('Error', 'No project selected.');
      return;
    }
    if (!photoUri) {
      Alert.alert('Error', 'Please capture or select a photo.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const uploaded = await uploadSitePhoto({
        projectId: selectedProjectId,
        imageUrl: photoUri,
        caption: photoCaption.trim() ? `[${photoPhase}] ${photoCaption.trim()}` : `[${photoPhase}] Proof of work inspection`,
        latitude: photoCoords?.lat,
        longitude: photoCoords?.lon,
      });

      setSitePhotos((prev) => [uploaded, ...prev]);
      setBannerMsg(`Proof-of-work photo for ${photoPhase} uploaded & synchronized with web!`);
      setPhotoUri(null);
      setPhotoCaption('');
      setUploadPhotoModalVisible(false);
      await Promise.all([loadData(selectedProjectId), refreshProjects()]);
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.message || 'Could not upload site photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Photo Delete Handler
  const handleDeletePhoto = (photoId: string) => {
    if (isClient) {
      Alert.alert('Read-Only Clearance', 'Client accounts cannot delete photos.');
      return;
    }
    Alert.alert(
      'Delete Inspection Photo',
      'Are you sure you want to delete this inspection photo? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSitePhoto(photoId);
              setSitePhotos((prev) => prev.filter((p) => p.id !== photoId));
              if (selectedPhotoPreview?.id === photoId) {
                setSelectedPhotoPreview(null);
              }
              setBannerMsg('Inspection photo deleted successfully.');
              await refreshProjects();
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete site photo.');
            }
          },
        },
      ]
    );
  };

  // Canonical active phases (Exactly the standard 8 phases + any non-standard custom phase)
  const activePhaseNames = useMemo(() => {
    const customPhases = Array.from(
      new Set(
        tasks
          .map((t) => normalizePhaseName(t.phaseName))
          .filter((p) => !STANDARD_PHASES.includes(p))
      )
    );
    return [...STANDARD_PHASES, ...customPhases];
  }, [tasks]);

  // Overall Progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted || t.progressPercent >= 100).length;
  const overallProgress = totalTasks
    ? Math.round(
        tasks.reduce((sum, t) => sum + (t.isCompleted ? 100 : t.progressPercent || 0), 0) /
          totalTasks
      )
    : Math.round(currentProject?.progressPercent || 0);

  // Per-project phase completion breakdown
  let completedPhasesCount = 0;
  let inProgressPhasesCount = 0;
  let notStartedPhasesCount = 0;

  activePhaseNames.forEach((phase) => {
    const pTasks = tasks.filter((t) => t.phaseName.toLowerCase() === phase.toLowerCase());
    const pAvg = pTasks.length
      ? Math.round(
          pTasks.reduce((s, t) => s + (t.isCompleted ? 100 : t.progressPercent || 0), 0) / pTasks.length
        )
      : 0;
    if (pAvg >= 100) completedPhasesCount++;
    else if (pAvg > 0) inProgressPhasesCount++;
    else notStartedPhasesCount++;
  });

  // Filter Site Photos for gallery
  const filteredSitePhotos = sitePhotos.filter((photo) => {
    if (selectedPhotoFilterPhase === 'All Photos') return true;
    const captionLower = (photo.caption || '').toLowerCase();
    const filterLower = selectedPhotoFilterPhase.toLowerCase();
    return captionLower.includes(`[${filterLower}]`) || captionLower.includes(filterLower);
  });

  return (
    <View style={styles.container}>
      <Header
        title="Project Progress & Phases"
        subtitle={`${currentProject?.name || 'Site Timeline'} · Phase & Task Supervision`}
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
                    {proj.name} ({Math.round(proj.progressPercent)}%)
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

        {projects.length === 0 ? (
          <View style={[styles.progressCard, { alignItems: 'center', paddingVertical: 36, marginTop: 16 }]}>
            <Building2 size={40} color={colors.primaryAccent} style={{ marginBottom: 14 }} />
            <Text style={[styles.headerLabel, { fontSize: 13, color: colors.textPrimary }]}>NO ACTIVE PROJECTS FOUND</Text>
            <Text style={[styles.projectNameTitle, { fontSize: 12, textAlign: 'center', marginTop: 8, color: colors.textMuted, fontWeight: '400', lineHeight: 18, paddingHorizontal: 16 }]}>
              {isClient
                ? 'No project is currently assigned to your client view. Please check with your contractor or admin.'
                : 'Please create a project from the Dashboard or Web console to start monitoring progress phases and tasks.'}
            </Text>
          </View>
        ) : (
          <>
        {/* 1. Overall Execution Card with Visual Fill Bar & Detailed Breakdown */}
        <View style={styles.progressCard}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerLabel}>PROJECT PHYSICAL EXECUTION</Text>
              <Text style={styles.projectNameTitle} numberOfLines={1}>
                {currentProject?.name || 'Active Project Construction'}
              </Text>
            </View>
            <View style={styles.progressPercentBox}>
              <Text style={styles.progressPercentNumber}>{overallProgress}%</Text>
            </View>
          </View>

          {/* Visual Fill Bar */}
          <View style={styles.fillBarTrack}>
            <View
              style={[
                styles.fillBarFill,
                {
                  width: `${overallProgress}%`,
                  backgroundColor:
                    overallProgress >= 80
                      ? colors.primaryAccent
                      : overallProgress >= 40
                      ? colors.secondaryInfo
                      : colors.outflowExpense,
                },
              ]}
            />
          </View>

          {/* 4-Column Executive Summary Grid */}
          <View style={styles.kpiSummaryRow}>
            <View style={styles.kpiTile}>
              <Text style={styles.kpiValue}>{activePhaseNames.length}</Text>
              <Text style={styles.kpiLabel}>PHASES</Text>
            </View>
            <View style={styles.kpiTile}>
              <Text style={[styles.kpiValue, { color: colors.primaryAccent }]}>{completedPhasesCount}</Text>
              <Text style={styles.kpiLabel}>DONE</Text>
            </View>
            <View style={styles.kpiTile}>
              <Text style={[styles.kpiValue, { color: colors.secondaryInfo }]}>{inProgressPhasesCount}</Text>
              <Text style={styles.kpiLabel}>ACTIVE</Text>
            </View>
            <View style={styles.kpiTile}>
              <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                {completedTasks}/{totalTasks}
              </Text>
              <Text style={styles.kpiLabel}>TASKS</Text>
            </View>
          </View>
        </View>

        {/* 2. Top Global Quick Actions Row (Admin/Engineer vs Client View) */}
        {!isClient ? (
          <View style={styles.topQuickActionsRow}>
            <View style={styles.autoSeedToggleContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Zap size={13} color={autoSeedTasksEnabled ? colors.primaryAccent : colors.textMuted} />
                <Text style={styles.autoSeedToggleLabel}>Auto-Seed Tasks:</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.togglePillBtn,
                  autoSeedTasksEnabled ? styles.togglePillBtnOn : styles.togglePillBtnOff,
                ]}
                onPress={() => handleToggleAutoSeed(!autoSeedTasksEnabled)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.toggleDot,
                    autoSeedTasksEnabled ? styles.toggleDotOn : styles.toggleDotOff,
                  ]}
                />
                <Text
                  style={[
                    styles.togglePillText,
                    autoSeedTasksEnabled ? styles.togglePillTextOn : styles.togglePillTextOff,
                  ]}
                >
                  {autoSeedTasksEnabled ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {autoSeedTasksEnabled && (
                <TouchableOpacity
                  style={styles.autoSeedSmallActionBtn}
                  onPress={handleAutoSeedTradeTasks}
                  disabled={isSeeding}
                  activeOpacity={0.7}
                >
                  <Zap size={11} color={colors.primaryAccent} />
                  <Text style={styles.autoSeedSmallActionText}>
                    {isSeeding ? 'SEEDING...' : 'RE-SEED'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.addTaskPrimaryBtn}
                onPress={() => {
                  setIsCustomPhaseMode(false);
                  setAddTaskModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Plus size={13} color="#071224" />
                <Text style={styles.addTaskPrimaryBtnText}>+ ADD TASK</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.clientBanner}>
            <Eye size={14} color="#60A5FA" />
            <Text style={styles.clientBannerText}>
              CLIENT VIEW: Tap any task or site photo below to inspect proof and verification notes.
            </Text>
          </View>
        )}

        {/* 3. Phase Filter & Search Bar */}
        <View style={styles.phaseFilterSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.filterTitle}>FILTER BY PHASE</Text>
            {selectedPhase !== 'All Phases' && (
              <TouchableOpacity onPress={() => setSelectedPhase('All Phases')}>
                <Text style={styles.clearFilterLink}>Show All ({activePhaseNames.length})</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tradePillsRow}
          >
            <TouchableOpacity
              style={[
                styles.phasePill,
                selectedPhase === 'All Phases' && styles.phasePillActive,
              ]}
              onPress={() => setSelectedPhase('All Phases')}
            >
              <Text
                style={[
                  styles.phasePillText,
                  selectedPhase === 'All Phases' && styles.phasePillTextActive,
                ]}
              >
                All Phases
              </Text>
            </TouchableOpacity>
            {activePhaseNames.map((phase) => {
              const isActive = selectedPhase === phase;
              return (
                <TouchableOpacity
                  key={phase}
                  style={[styles.phasePill, isActive && styles.phasePillActive]}
                  onPress={() => setSelectedPhase(phase)}
                >
                  <Text
                    style={[
                      styles.phasePillText,
                      isActive && styles.phasePillTextActive,
                    ]}
                  >
                    {phase}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <Search size={14} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search milestone tasks by title..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 4. Direct Canonical Phase Progress Matrix & Deliverables */}
        <View style={styles.phaseMatrixSection}>
          <View style={styles.matrixHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <TrendingUp size={14} color={colors.primaryAccent} />
              <Text style={styles.filterTitle}>
                {isClient
                  ? 'PROJECT PHASE PROGRESSION'
                  : autoSeedTasksEnabled
                  ? 'PHASE EXECUTION & DELIVERABLES'
                  : 'DIRECT PHASE MATRIX (0-100%)'}
              </Text>
            </View>
          </View>

          {loading && !refreshing ? (
            <LoadingSpinner message="Fetching canonical phases & tasks..." />
          ) : (
            activePhaseNames
              .filter((phase) => selectedPhase === 'All Phases' || phase.toLowerCase() === selectedPhase.toLowerCase())
              .map((phase) => {
                const phaseAllTasks = tasks.filter(
                  (t) => t.phaseName.toLowerCase() === phase.toLowerCase()
                );
                const phaseMatchingTasks = phaseAllTasks.filter((t) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    t.title.toLowerCase().includes(q) ||
                    (t.assignee && t.assignee.toLowerCase().includes(q))
                  );
                });

                // If user searched for something and no tasks match in this phase, hide the phase card
                if (searchQuery.trim() && phaseMatchingTasks.length === 0 && !phase.toLowerCase().includes(searchQuery.toLowerCase())) {
                  return null;
                }

                const phasePhotos = sitePhotos.filter((p) =>
                  (p.caption || '').toLowerCase().includes(`[${phase.toLowerCase()}]`) ||
                  (p.caption || '').toLowerCase().includes(phase.toLowerCase())
                );

                const phaseAvg = phaseAllTasks.length
                  ? Math.round(
                      phaseAllTasks.reduce(
                        (s, t) => s + (t.isCompleted ? 100 : t.progressPercent || 0),
                        0
                      ) / phaseAllTasks.length
                    )
                  : 0;

                const isPhaseDone = phaseAvg >= 100;
                const isPhaseActive = !isPhaseDone && phaseAvg > 0;

                return (
                  <View key={phase} style={styles.phaseCard}>
                    <View style={styles.phaseCardTop}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.phaseNameText}>{phase}</Text>
                          {/* Phase Status Pill */}
                          <View
                            style={[
                              styles.phaseStatusChip,
                              isPhaseDone
                                ? styles.phaseChipDone
                                : isPhaseActive
                                ? styles.phaseChipActive
                                : styles.phaseChipTodo,
                            ]}
                          >
                            <Text
                              style={[
                                styles.phaseChipText,
                                isPhaseDone
                                  ? { color: colors.primaryAccent }
                                  : isPhaseActive
                                  ? { color: colors.secondaryInfo }
                                  : { color: colors.textMuted },
                              ]}
                            >
                              {isPhaseDone ? 'DONE' : isPhaseActive ? 'ACTIVE' : 'TODO'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.phaseSubText}>
                          {phaseAllTasks.filter((t) => t.isCompleted || t.progressPercent >= 100).length} of {phaseAllTasks.length} task(s) done · {phasePhotos.length} photo(s)
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {!isClient && (
                          <TouchableOpacity
                            style={styles.phaseSnapBtn}
                            onPress={() => handleOpenPhotoModalForPhase(phase)}
                          >
                            <Camera size={11} color={colors.primaryAccent} />
                            <Text style={styles.phaseSnapBtnText}>PHOTO</Text>
                          </TouchableOpacity>
                        )}

                        <View style={styles.phasePercentPill}>
                          <Text style={styles.phasePercentText}>{phaseAvg}%</Text>
                        </View>
                      </View>
                    </View>

                    {/* Mini Visual Fill Track */}
                    <View style={styles.miniTrack}>
                      <View
                        style={[
                          styles.miniFill,
                          {
                            width: `${phaseAvg}%`,
                            backgroundColor:
                              phaseAvg >= 100
                                ? colors.primaryAccent
                                : phaseAvg > 0
                                ? colors.secondaryInfo
                                : colors.blueprintBorderMuted,
                          },
                        ]}
                      />
                    </View>

                    {/* Inline Proof Photos Thumbnails Strip */}
                    {phasePhotos.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.phasePhotosStrip}
                      >
                        {phasePhotos.map((photo) => (
                          <TouchableOpacity
                            key={photo.id}
                            style={styles.phasePhotoThumb}
                            onPress={() => setSelectedPhotoPreview(photo)}
                            activeOpacity={0.8}
                          >
                            <Image source={{ uri: photo.imageUrl }} style={styles.phasePhotoThumbImg} />
                            <View style={styles.phasePhotoThumbOverlay}>
                              <Eye size={10} color="#F5F3ED" />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    {/* Direct 0% - 25% - 50% - 75% - 100% Stepper Buttons (Interactive for Engineer/Admin, Clean Status for Client) */}
                    {!isClient ? (
                      <View style={styles.stepBtnRow}>
                        {PROGRESS_STEPS.map((step) => {
                          const isStepActive = phaseAvg === step;
                          return (
                            <TouchableOpacity
                              key={step}
                              style={[
                                styles.stepBtn,
                                isStepActive && styles.stepBtnActive,
                              ]}
                              onPress={() => handlePhaseQuickUpdate(phase, step)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.stepBtnText,
                                  isStepActive && styles.stepBtnTextActive,
                                ]}
                              >
                                {step}%
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.clientPhaseStatusBar}>
                        <Text style={styles.clientPhaseStatusLabel}>
                          PHASE STATUS:
                        </Text>
                        <Text style={[styles.clientPhaseStatusValue, isPhaseDone && { color: colors.primaryAccent }]}>
                          {phaseAvg}% {isPhaseDone ? '· COMPLETED' : isPhaseActive ? '· IN PROGRESS' : '· PENDING'}
                        </Text>
                      </View>
                    )}

                    {/* Inline Milestone Tasks under this Phase (Cleanly organized once, no duplicates) */}
                    {(autoSeedTasksEnabled || isClient) ? (
                      phaseMatchingTasks.length > 0 ? (
                        <View style={styles.phaseTaskListContainer}>
                          {phaseMatchingTasks.map((t) => {
                            const isTaskDone = t.isCompleted || (t.progressPercent || 0) >= 100;
                            const taskPercent = t.progressPercent || (isTaskDone ? 100 : 0);
                            return (
                              <View key={t.id} style={styles.phaseTaskRow}>
                                <TouchableOpacity
                                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}
                                  onPress={() => {
                                    if (isClient) {
                                      handleTaskClick(t);
                                    } else {
                                      handleTaskToggleComplete(t);
                                    }
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <View style={[styles.taskCheckbox, isTaskDone && styles.taskCheckboxDone]}>
                                    {isTaskDone && <CheckCircle2 size={12} color="#071224" />}
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text
                                      style={[
                                        styles.phaseTaskTitle,
                                        isTaskDone && styles.phaseTaskTitleDone,
                                      ]}
                                      numberOfLines={2}
                                    >
                                      {t.title}
                                    </Text>
                                    <Text style={styles.phaseTaskMeta}>
                                      {t.assignee || 'Civil Contractor'} · Due {new Date(t.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                    </Text>
                                  </View>
                                </TouchableOpacity>

                                {/* Task Stepper Buttons (Interactive for Engineer/Admin vs Clean Pill for Client) */}
                                {!isClient ? (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View style={styles.taskMiniStepRow}>
                                      {PROGRESS_STEPS.map((step) => {
                                        const isStepActive = taskPercent === step;
                                        return (
                                          <TouchableOpacity
                                            key={step}
                                            style={[
                                              styles.taskMiniStepBtn,
                                              isStepActive && styles.taskMiniStepBtnActive,
                                            ]}
                                            onPress={() => handleTaskQuickPercent(t, step)}
                                          >
                                            <Text
                                              style={[
                                                styles.taskMiniStepBtnText,
                                                isStepActive && styles.taskMiniStepBtnTextActive,
                                              ]}
                                            >
                                              {step}%
                                            </Text>
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>
                                    <TouchableOpacity
                                      onPress={() => handleDeleteTask(t.id, t.title)}
                                      style={{ padding: 4 }}
                                    >
                                      <Trash2 size={13} color={colors.outflowExpense} />
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    style={[
                                      styles.clientTaskPill,
                                      isTaskDone ? styles.clientTaskPillDone : styles.clientTaskPillProg,
                                    ]}
                                    onPress={() => handleTaskClick(t)}
                                  >
                                    <Text style={[styles.clientTaskPillText, isTaskDone ? { color: colors.primaryAccent } : { color: colors.secondaryInfo }]}>
                                      {taskPercent}%
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      ) : !isClient ? (
                        <View style={styles.phaseEmptyTaskRow}>
                          <Text style={styles.phaseEmptyTaskText}>No milestone tasks in this phase yet.</Text>
                          <TouchableOpacity
                            onPress={() => {
                              setNewTaskPhase(phase);
                              setIsCustomPhaseMode(false);
                              setAddTaskModalVisible(true);
                            }}
                          >
                            <Text style={styles.phaseAddTaskInlineLink}>+ Add Task to {phase}</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null
                    ) : (
                      <View style={styles.phaseDirectModeRow}>
                        <Text style={styles.phaseDirectModeText}>
                          ⚡ Direct Phase Control · Tasks hidden ({phaseAllTasks.length} task{phaseAllTasks.length === 1 ? '' : 's'})
                        </Text>
                        <TouchableOpacity onPress={() => handleToggleAutoSeed(true)}>
                          <Text style={styles.phaseDirectModeLink}>Turn ON Tasks</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
          )}

          {/* Prominent Add Custom Phase / Milestone Task Card at Bottom (Hidden for Client) */}
          {!isClient && (
            <TouchableOpacity
              style={styles.addCustomPhaseCard}
              onPress={() => {
                setIsCustomPhaseMode(true);
                setAddTaskModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Plus size={16} color={colors.primaryAccent} />
                <Text style={styles.addCustomPhaseTitle}>ADD CUSTOM PHASE & TASK</Text>
              </View>
              <Text style={styles.addCustomPhaseSub}>
                Tap to add a custom work stage like Landscaping, Solar Grid, HVAC, or Custom Interiors.
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 5. Proof-of-Work Site Photos Section Below Phases */}
        <View style={styles.photoGallerySection}>
          <View style={styles.matrixHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Camera size={14} color={colors.primaryAccent} />
              <Text style={styles.filterTitle}>
                PROOF-OF-WORK SITE PHOTOS ({filteredSitePhotos.length})
              </Text>
            </View>
            {!isClient && (
              <TouchableOpacity
                style={styles.uploadPhotoTriggerBtn}
                onPress={() => handleOpenPhotoModalForPhase(selectedPhase !== 'All Phases' ? selectedPhase : 'Planning')}
              >
                <Camera size={12} color="#071224" />
                <Text style={styles.addTaskBtnText}>UPLOAD PHOTO</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Photo Phase Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
          >
            <TouchableOpacity
              style={[
                styles.phasePill,
                selectedPhotoFilterPhase === 'All Photos' && styles.phasePillActive,
              ]}
              onPress={() => setSelectedPhotoFilterPhase('All Photos')}
            >
              <Text
                style={[
                  styles.phasePillText,
                  selectedPhotoFilterPhase === 'All Photos' && styles.phasePillTextActive,
                ]}
              >
                All ({sitePhotos.length})
              </Text>
            </TouchableOpacity>
            {activePhaseNames.map((phase) => {
              const count = sitePhotos.filter((p) =>
                (p.caption || '').toLowerCase().includes(`[${phase.toLowerCase()}]`) ||
                (p.caption || '').toLowerCase().includes(phase.toLowerCase())
              ).length;
              const isActive = selectedPhotoFilterPhase === phase;
              return (
                <TouchableOpacity
                  key={phase}
                  style={[styles.phasePill, isActive && styles.phasePillActive]}
                  onPress={() => setSelectedPhotoFilterPhase(phase)}
                >
                  <Text
                    style={[
                      styles.phasePillText,
                      isActive && styles.phasePillTextActive,
                    ]}
                  >
                    {phase} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {filteredSitePhotos.length === 0 ? (
            <View style={styles.emptyBox}>
              <ImageIcon size={28} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>NO INSPECTION PHOTOS YET</Text>
              <Text style={styles.emptySub}>
                {isClient
                  ? 'No inspection photos uploaded for this filter.'
                  : 'Capture on-site progress photos with GPS geotags. They will sync live to the Web Admin dashboard.'}
              </Text>
              {!isClient && (
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => handleOpenPhotoModalForPhase('Planning')}
                >
                  <Camera size={14} color="#071224" />
                  <Text style={styles.emptyAddText}>CAPTURE SITE PHOTO</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.photosGrid}>
              {filteredSitePhotos.map((photo) => (
                <View key={photo.id} style={styles.photoCardWrapper}>
                  <TouchableOpacity
                    style={styles.photoCard}
                    onPress={() => setSelectedPhotoPreview(photo)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: photo.imageUrl }} style={styles.photoImage} />
                    
                    {/* Delete button overlay on photo (Hidden for Client) */}
                    {!isClient && (
                      <TouchableOpacity
                        style={styles.photoCardDeleteBtn}
                        onPress={() => handleDeletePhoto(photo.id)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={12} color="#FFF" />
                      </TouchableOpacity>
                    )}

                    <View style={styles.photoInfoBox}>
                      <Text style={styles.photoCaptionText} numberOfLines={2}>
                        {photo.caption || 'Site Inspection Proof'}
                      </Text>

                      <View style={styles.photoMetaRow}>
                        {photo.latitude && photo.longitude ? (
                          <View style={styles.photoGpsBadge}>
                            <MapPin size={9} color={colors.primaryAccent} />
                            <Text style={styles.photoGpsText}>
                              {photo.latitude.toFixed(2)}, {photo.longitude.toFixed(2)}
                            </Text>
                          </View>
                        ) : (
                          <View />
                        )}
                        <Text style={styles.photoDateText}>
                          {new Date(photo.uploadedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Task Proof Modal */}
      <TaskProofModal
        visible={modalVisible}
        task={selectedTask}
        readOnly={isClient}
        onClose={() => setModalVisible(false)}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Add Task Modal with Custom Phase & Trade Option */}
      <Modal
        visible={addTaskModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddTaskModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSub}>
                  {isCustomPhaseMode ? 'CUSTOM WORK CREATOR' : 'MILESTONE TASK CREATOR'}
                </Text>
                <Text style={styles.modalTitle}>
                  {isCustomPhaseMode ? 'Add Custom Phase & Task' : 'Add Project Task'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setAddTaskModalVisible(false)}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Phase Mode Selector */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.fieldLabel}>PHASE CATEGORY</Text>
                <TouchableOpacity onPress={() => setIsCustomPhaseMode(!isCustomPhaseMode)}>
                  <Text style={{ color: colors.primaryAccent, fontSize: 10, fontFamily: 'monospace', fontWeight: '800' }}>
                    {isCustomPhaseMode ? '← Standard Phases' : '➕ Custom Phase'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isCustomPhaseMode ? (
                <View>
                  <TextInput
                    style={[styles.input, { borderColor: colors.primaryAccent }]}
                    value={customPhaseInput}
                    onChangeText={setCustomPhaseInput}
                    placeholder="e.g. Landscape & Hardscaping or Solar Grid"
                    placeholderTextColor={colors.textMuted}
                  />
                  {/* Quick Custom Phase Presets */}
                  <Text style={[styles.fieldLabel, { marginBottom: 4 }]}>QUICK PRESETS:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {CUSTOM_PHASE_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        style={[
                          styles.presetSampleBtn,
                          customPhaseInput === preset && { borderColor: colors.primaryAccent },
                        ]}
                        onPress={() => setCustomPhaseInput(preset)}
                      >
                        <Text style={styles.presetSampleText}>{preset}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {activePhaseNames.map((phase) => (
                    <TouchableOpacity
                      key={phase}
                      style={[
                        styles.modalPill,
                        newTaskPhase === phase && styles.modalPillActive,
                      ]}
                      onPress={() => setNewTaskPhase(phase)}
                    >
                      <Text
                        style={[
                          styles.modalPillText,
                          newTaskPhase === phase && styles.modalPillTextActive,
                        ]}
                      >
                        {phase}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Task Title */}
              <Text style={styles.fieldLabel}>TASK TITLE</Text>
              <TextInput
                style={styles.input}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="e.g. Planning site boundary pegging & municipal layout"
                placeholderTextColor={colors.textMuted}
              />

              {/* Trade Assignee */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.fieldLabel}>SUBCONTRACTOR TRADE</Text>
                <TouchableOpacity onPress={() => setIsCustomTradeMode(!isCustomTradeMode)}>
                  <Text style={{ color: colors.primaryAccent, fontSize: 10, fontFamily: 'monospace', fontWeight: '800' }}>
                    {isCustomTradeMode ? '← Standard Trade' : '➕ Custom Trade'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isCustomTradeMode ? (
                <TextInput
                  style={styles.input}
                  value={customTradeInput}
                  onChangeText={setCustomTradeInput}
                  placeholder="e.g. Landscape Architect or HVAC Lead"
                  placeholderTextColor={colors.textMuted}
                />
              ) : (
                <View style={styles.tradeGrid}>
                  {TRADES.filter((t) => t !== 'All Trades').map((trade) => (
                    <TouchableOpacity
                      key={trade}
                      style={[
                        styles.modalPill,
                        newTaskAssignee === trade && styles.modalPillActive,
                        { minWidth: '45%', marginBottom: 6 },
                      ]}
                      onPress={() => setNewTaskAssignee(trade)}
                    >
                      <Text
                        style={[
                          styles.modalPillText,
                          newTaskAssignee === trade && styles.modalPillTextActive,
                        ]}
                      >
                        {trade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Due Date */}
              <Text style={[styles.fieldLabel, { marginTop: 8 }]}>DUE DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={newTaskDueDate}
                onChangeText={setNewTaskDueDate}
                placeholder="2027-12-31"
                placeholderTextColor={colors.textMuted}
              />

              {/* Initial Progress */}
              <Text style={styles.fieldLabel}>INITIAL PROGRESS: {newTaskProgressPercent}%</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {PROGRESS_STEPS.map((step) => {
                  const isActive = newTaskProgressPercent === step;
                  return (
                    <TouchableOpacity
                      key={step}
                      style={[
                        styles.stepBtn,
                        isActive && styles.stepBtnActive,
                      ]}
                      onPress={() => setNewTaskProgressPercent(step)}
                    >
                      <Text
                        style={[
                          styles.stepBtnText,
                          isActive && styles.stepBtnTextActive,
                        ]}
                      >
                        {step}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.createBtn, isCreatingTask && styles.createBtnDisabled]}
                onPress={handleCreateNewTask}
                disabled={isCreatingTask}
              >
                {isCreatingTask ? (
                  <ActivityIndicator size="small" color="#071224" />
                ) : (
                  <>
                    <Save size={16} color="#071224" />
                    <Text style={styles.createBtnText}>SAVE MILESTONE TASK</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Upload Site Photo Modal */}
      <Modal
        visible={uploadPhotoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadPhotoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSub}>PROOF OF WORK CAMERA</Text>
                <Text style={styles.modalTitle}>Upload Site Inspection Photo</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setUploadPhotoModalVisible(false)}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Photo Preview or Picker Button */}
              {photoUri ? (
                <View style={styles.modalPhotoBox}>
                  <Image source={{ uri: photoUri }} style={styles.modalPhotoImg} />
                  <TouchableOpacity style={styles.retakeBtn} onPress={handlePickPhoto}>
                    <Camera size={14} color="#FFF" />
                    <Text style={styles.retakeBtnText}>Change Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <TouchableOpacity style={styles.photoPickerBox} onPress={handlePickPhoto}>
                    <Camera size={32} color={colors.primaryAccent} />
                    <Text style={styles.photoPickerTitle}>Tap to Snap / Select Inspection Photo</Text>
                    <Text style={styles.photoPickerSub}>Automatically records GPS geotag</Text>
                  </TouchableOpacity>

                  {/* Sample presets for fast testing */}
                  <Text style={[styles.fieldLabel, { marginTop: 4 }]}>OR SELECT QUICK SAMPLE PROOF:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {SAMPLE_PHOTO_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={preset.label}
                        style={styles.presetSampleBtn}
                        onPress={() => {
                          setPhotoUri(preset.url);
                          setPhotoCaption(preset.caption);
                          setPhotoPhase(preset.phase);
                          setPhotoCoords({ lat: 19.076, lon: 72.8777 });
                        }}
                      >
                        <Text style={styles.presetSampleText}>{preset.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Target Phase */}
              <Text style={[styles.fieldLabel, { marginTop: 8 }]}>RELATED PHASE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {activePhaseNames.map((phase) => (
                  <TouchableOpacity
                    key={phase}
                    style={[
                      styles.modalPill,
                      photoPhase === phase && styles.modalPillActive,
                    ]}
                    onPress={() => setPhotoPhase(phase)}
                  >
                    <Text
                      style={[
                        styles.modalPillText,
                        photoPhase === phase && styles.modalPillTextActive,
                      ]}
                    >
                      {phase}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Caption / Remarks */}
              <Text style={styles.fieldLabel}>CAPTION / OBSERVATION REMARKS</Text>
              <TextInput
                style={styles.input}
                value={photoCaption}
                onChangeText={setPhotoCaption}
                placeholder="e.g. Planning site boundary pegging & excavation line marked"
                placeholderTextColor={colors.textMuted}
              />

              {/* GPS Geotag info */}
              {photoCoords && (
                <View style={styles.gpsReadoutBox}>
                  <MapPin size={12} color={colors.primaryAccent} />
                  <Text style={styles.gpsReadoutText}>
                    GPS Tagged: {photoCoords.lat.toFixed(4)}, {photoCoords.lon.toFixed(4)}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.createBtn, isUploadingPhoto && styles.createBtnDisabled]}
                onPress={handleUploadPhotoSubmit}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator size="small" color="#071224" />
                ) : (
                  <>
                    <UploadCloud size={16} color="#071224" />
                    <Text style={styles.createBtnText}>UPLOAD PROOF PHOTO</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full Photo Zoom Preview Modal */}
      {selectedPhotoPreview && (
        <Modal
          visible={!!selectedPhotoPreview}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedPhotoPreview(null)}
        >
          <View style={styles.fullPreviewOverlay}>
            <TouchableOpacity
              style={styles.fullPreviewClose}
              onPress={() => setSelectedPhotoPreview(null)}
            >
              <X size={24} color="#FFF" />
            </TouchableOpacity>

            <Image
              source={{ uri: selectedPhotoPreview.imageUrl }}
              style={styles.fullPreviewImage}
              resizeMode="contain"
            />

            <View style={styles.fullPreviewFooter}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.fullPreviewCaption}>
                  {selectedPhotoPreview.caption || 'Site Inspection Photo'}
                </Text>
                <Text style={styles.fullPreviewDate}>
                  Uploaded on: {new Date(selectedPhotoPreview.uploadedAt).toLocaleString('en-IN')}
                  {selectedPhotoPreview.latitude && selectedPhotoPreview.longitude
                    ? ` · GPS: ${selectedPhotoPreview.latitude.toFixed(4)}, ${selectedPhotoPreview.longitude.toFixed(4)}`
                    : ''}
                </Text>
              </View>

              {!isClient && (
                <TouchableOpacity
                  style={styles.fullPreviewDeleteBtn}
                  onPress={() => handleDeletePhoto(selectedPhotoPreview.id)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={14} color="#FFF" />
                  <Text style={styles.fullPreviewDeleteText}>DELETE</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
  },
  projectSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  projectSelectorLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
    letterSpacing: 0.5,
  },
  projTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
  },
  projTabPillActive: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  projTabPillText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontWeight: '700',
  },
  projTabPillTextActive: {
    color: '#071224',
    fontWeight: '900',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  progressCard: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
    letterSpacing: 1,
  },
  projectNameTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  progressPercentBox: {
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
    borderColor: colors.primaryAccent,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  progressPercentNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryAccent,
    fontFamily: 'monospace',
  },
  fillBarTrack: {
    height: 8,
    backgroundColor: colors.backgroundDeep,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.blueprintBorderMuted,
    marginBottom: 12,
  },
  fillBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  kpiSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  kpiTile: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.blueprintBorderMuted,
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  kpiLabel: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '700',
  },
  topQuickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  autoSeedToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 8,
  },
  autoSeedToggleLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  togglePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 4,
    borderWidth: 1,
  },
  togglePillBtnOn: {
    backgroundColor: 'rgba(45, 191, 158, 0.2)',
    borderColor: colors.primaryAccent,
  },
  togglePillBtnOff: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
  },
  toggleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  toggleDotOn: {
    backgroundColor: colors.primaryAccent,
  },
  toggleDotOff: {
    backgroundColor: colors.textMuted,
  },
  togglePillText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  togglePillTextOn: {
    color: colors.primaryAccent,
  },
  togglePillTextOff: {
    color: colors.textMuted,
  },
  autoSeedSmallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(45, 191, 158, 0.1)',
    borderColor: colors.primaryAccent,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  autoSeedSmallActionText: {
    color: colors.primaryAccent,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  addTaskPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryAccent,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addTaskPrimaryBtnText: {
    color: '#071224',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '900',
  },
  clientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#172554',
    borderWidth: 1,
    borderColor: '#1D4ED8',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
  },
  clientBannerText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  phaseFilterSection: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  filterTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
    letterSpacing: 0.5,
  },
  clearFilterLink: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.secondaryInfo,
    fontWeight: '700',
  },
  tradePillsRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 8,
  },
  phasePill: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
  },
  phasePillActive: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  phasePillText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontWeight: '700',
  },
  phasePillTextActive: {
    color: '#071224',
    fontWeight: '900',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
    padding: 0,
  },
  phaseMatrixSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseCard: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  phaseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  phaseNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  phaseStatusChip: {
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 0.5,
  },
  phaseChipDone: {
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
    borderColor: colors.primaryAccent,
  },
  phaseChipActive: {
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    borderColor: colors.secondaryInfo,
  },
  phaseChipTodo: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
  },
  phaseChipText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  phaseSnapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.primaryAccent,
    borderWidth: 0.8,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  phaseSnapBtnText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
  },
  phaseSubText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  phasePercentPill: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  phasePercentText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
  },
  miniTrack: {
    height: 4,
    backgroundColor: colors.backgroundDeep,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
  },
  phasePhotosStrip: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  phasePhotoThumb: {
    width: 48,
    height: 36,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.primaryAccent,
    position: 'relative',
    backgroundColor: colors.backgroundDeep,
  },
  phasePhotoThumbImg: {
    width: '100%',
    height: '100%',
  },
  phasePhotoThumbOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(7, 18, 36, 0.7)',
    borderRadius: 2,
    padding: 1,
  },
  stepBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 6,
    alignItems: 'center',
  },
  stepBtnActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
  },
  stepBtnText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontWeight: '700',
  },
  stepBtnTextActive: {
    color: colors.primaryAccent,
    fontWeight: '900',
  },
  clientPhaseStatusBar: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 115, 232, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 232, 0.2)',
  },
  clientPhaseStatusLabel: {
    color: colors.secondaryInfo,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  clientPhaseStatusValue: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  phaseTaskListContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.blueprintBorderMuted,
    gap: 8,
  },
  phaseTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    gap: 8,
  },
  taskCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.blueprintBorderMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundDeep,
  },
  taskCheckboxDone: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  phaseTaskTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  phaseTaskTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  phaseTaskMeta: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  taskMiniStepRow: {
    flexDirection: 'row',
    gap: 3,
  },
  taskMiniStepBtn: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  taskMiniStepBtnActive: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  taskMiniStepBtnText: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontWeight: '700',
  },
  taskMiniStepBtnTextActive: {
    color: '#071224',
    fontWeight: '900',
  },
  clientTaskPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  clientTaskPillDone: {
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
    borderColor: colors.primaryAccent,
  },
  clientTaskPillProg: {
    backgroundColor: 'rgba(26, 115, 232, 0.15)',
    borderColor: colors.secondaryInfo,
  },
  clientTaskPillText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  phaseEmptyTaskRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.blueprintBorderMuted,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseEmptyTaskText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  phaseAddTaskInlineLink: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
  },
  phaseDirectModeRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.blueprintBorderMuted,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseDirectModeText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  phaseDirectModeLink: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
  },
  addCustomPhaseCard: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  addCustomPhaseTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
  },
  addCustomPhaseSub: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  photoGallerySection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  uploadPhotoTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryAccent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  addTaskBtnText: {
    color: '#071224',
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCardWrapper: {
    width: '48%',
  },
  photoCard: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 110,
    backgroundColor: colors.backgroundDeep,
  },
  photoCardDeleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderRadius: 4,
    padding: 4,
  },
  photoInfoBox: {
    padding: 8,
  },
  photoCaptionText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  photoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  photoGpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  photoGpsText: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  photoDateText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  emptyBox: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  emptyTitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryAccent,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  emptyAddText: {
    color: '#071224',
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 18, 36, 0.85)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.blueprintBorder,
    maxHeight: '90%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
  },
  modalSub: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    color: colors.textPrimary,
    fontSize: 13,
    marginBottom: 12,
  },
  modalPill: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  modalPillActive: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  modalPillText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    fontWeight: '700',
  },
  modalPillTextActive: {
    color: '#071224',
    fontWeight: '900',
  },
  tradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  presetSampleBtn: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  presetSampleText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryAccent,
    borderRadius: 6,
    paddingVertical: 12,
    gap: 6,
    marginTop: 10,
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    color: '#071224',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  modalPhotoBox: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    height: 180,
    marginBottom: 12,
  },
  modalPhotoImg: {
    width: '100%',
    height: '100%',
  },
  retakeBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7, 18, 36, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  retakeBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  photoPickerBox: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  photoPickerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  photoPickerSub: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginTop: 2,
  },
  gpsReadoutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 191, 158, 0.12)',
    borderColor: colors.primaryAccent,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    gap: 6,
    marginBottom: 12,
  },
  gpsReadoutText: {
    color: colors.primaryAccent,
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  fullPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 18, 36, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPreviewClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullPreviewImage: {
    width: '95%',
    height: '75%',
  },
  fullPreviewFooter: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullPreviewDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.outflowExpense,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fullPreviewDeleteText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  fullPreviewCaption: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  fullPreviewDate: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 3,
  },
});
