import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  FolderKanban,
  Coins,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Bell,
  ChevronRight,
  Layers,
  Globe,
  Building2,
  Eye,
  Plus,
  X,
  Sparkles,
  MapPin,
  Save,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { WeatherWidget } from '../components/WeatherWidget';
import { MetricCard } from '../components/MetricCard';
import { ProjectCard, formatIndianCurrency } from '../components/ProjectCard';
import { AIPredictionWidget } from '../components/AIPredictionWidget';
import { Banner } from '../components/Banner';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { calculateProjectRisk, createProject } from '../api/projects';
import { Modal, TextInput, ActivityIndicator, Alert } from 'react-native';

export const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user, isClient, role } = useAuth();
  const {
    projects,
    activeProject,
    isLoading,
    error,
    metrics,
    setActiveProjectId,
    refreshProjects,
  } = useProjects();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isOverallMode, setIsOverallMode] = useState<boolean>(false);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectLocation, setNewProjectLocation] = useState<string>('');
  const [newProjectArea, setNewProjectArea] = useState<string>('3000');
  const [newProjectBudget, setNewProjectBudget] = useState<string>('5400000');
  const [isSubmittingProject, setIsSubmittingProject] = useState<boolean>(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !newProjectLocation.trim()) {
      Alert.alert('Validation Error', 'Please enter project name and location.');
      return;
    }
    const area = parseFloat(newProjectArea) || 2000;
    const budget = parseFloat(newProjectBudget) || (area * 1800);

    setIsSubmittingProject(true);
    try {
      const created = await createProject({
        name: newProjectName.trim(),
        location: newProjectLocation.trim(),
        builtUpAreaSqFt: area,
        budget: budget,
        autoSeed: true,
      });

      setBannerMsg(`Project "${created.name}" created successfully with auto-seeded milestones.`);
      setCreateModalVisible(false);
      setNewProjectName('');
      setNewProjectLocation('');
      await refreshProjects();
      if (created.id) {
        setActiveProjectId(created.id);
      }
    } catch (err: any) {
      Alert.alert('Creation Failed', err?.message || 'Failed to create new project.');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    await refreshProjects();
    setRefreshing(false);
  };

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  const handleNavigateToProgress = (projectId?: string) => {
    const targetId = projectId || activeProject?.id;
    if (targetId) setActiveProjectId(targetId);
    navigation.navigate('ProjectProgress', { projectId: targetId });
  };

  const handleNavigateToExpenses = (projectId?: string) => {
    const targetId = projectId || activeProject?.id;
    if (targetId) setActiveProjectId(targetId);
    navigation.navigate('ExpenseEntry', { projectId: targetId });
  };

  const handleNavigateToDocuments = (projectId?: string) => {
    const targetId = projectId || activeProject?.id;
    if (targetId) setActiveProjectId(targetId);
    navigation.navigate('Documents', { projectId: targetId });
  };

  // Compute dynamic metrics depending on whether "Overall" or "Single Project" is selected
  const singleProjectRisk = activeProject ? calculateProjectRisk(activeProject) : null;

  const displayBudget = isOverallMode || !activeProject
    ? metrics.totalBudget
    : Number(activeProject.budget) || 0;

  const displaySpent = isOverallMode || !activeProject
    ? metrics.totalSpent
    : Number(activeProject.spent) || 0;

  const displayProgress = isOverallMode || !activeProject
    ? metrics.averageProgress
    : Math.round(Number(activeProject.progressPercent) || 0);

  const displayRisk = isOverallMode || !activeProject || !singleProjectRisk
    ? metrics.riskLevel
    : singleProjectRisk.level;

  return (
    <View style={styles.container}>
      {/* 1. Header Bar with Greeting & Actions */}
      <Header
        title={`Hello, ${user?.name ? user.name.split(' ')[0] : 'Engineer'} 👋`}
        subtitle={`Role: ${user?.role || 'ENGINEER'} · Technical Field Suite`}
        onMenuPress={handleOpenSettings}
        onNotificationsPress={() => {}}
        unreadNotifications={metrics.notificationsCount}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryAccent}
            colors={[colors.primaryAccent]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Connection or Synchronization Error Banner */}
        {error && (
          <Banner
            type="warning"
            message={error}
            actionText="Retry Sync"
            onAction={refreshProjects}
          />
        )}

        {bannerMsg && (
          <Banner
            type="success"
            message={bannerMsg}
            onDismiss={() => setBannerMsg(null)}
          />
        )}

        {/* Client Transparency Suite Banner */}
        {isClient && (
          <View style={styles.clientBanner}>
            <Eye size={14} color="#60A5FA" />
            <Text style={styles.clientBannerText}>
              CLIENT TRANSPARENCY: Live milestone monitoring and construction forecast reports (Read-Only).
            </Text>
          </View>
        )}

        {/* 2. Weather Telemetry Widget */}
        <WeatherWidget
          projectId={isOverallMode ? undefined : activeProject?.id}
          cityName={isOverallMode ? (activeProject?.location || 'Regional Site') : activeProject?.location}
          projectName={isOverallMode ? 'All Projects' : activeProject?.name}
        />

        {/* 3. Project Scope Switcher Pill Bar */}
        {projects.length > 0 ? (
          <View style={styles.projectFilterSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>WORKSPACE SCOPE FILTER</Text>
              {!isClient && (
                <TouchableOpacity
                  style={styles.addProjectHeaderBtn}
                  onPress={() => setCreateModalVisible(true)}
                >
                  <Plus size={12} color="#071224" />
                  <Text style={styles.addProjectHeaderBtnText}>NEW SITE</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectPillsRow}>
              {/* Overall Portfolio Option */}
              <TouchableOpacity
                style={[styles.projectPill, isOverallMode && styles.projectPillActive]}
                onPress={() => setIsOverallMode(true)}
              >
                <Globe size={12} color={isOverallMode ? '#071224' : colors.primaryAccent} />
                <Text style={[styles.projectPillText, isOverallMode && styles.projectPillTextActive]}>
                  All Projects ({projects.length})
                </Text>
              </TouchableOpacity>

              {/* Individual Projects */}
              {projects.map((proj) => {
                const isActive = !isOverallMode && activeProject?.id === proj.id;
                return (
                  <TouchableOpacity
                    key={proj.id}
                    style={[styles.projectPill, isActive && styles.projectPillActive]}
                    onPress={() => {
                      setIsOverallMode(false);
                      setActiveProjectId(proj.id);
                    }}
                  >
                    <Building2 size={12} color={isActive ? '#071224' : colors.textMuted} />
                    <Text
                      style={[styles.projectPillText, isActive && styles.projectPillTextActive]}
                      numberOfLines={1}
                    >
                      {proj.name} ({Math.round(proj.progressPercent)}%)
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : !isClient ? (
          <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
            <TouchableOpacity
              style={styles.createProjectTopBar}
              onPress={() => setCreateModalVisible(true)}
            >
              <Plus size={16} color="#071224" />
              <Text style={styles.createProjectTopBarText}>+ CREATE FIRST CONSTRUCTION PROJECT</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* 4. 2x3 Metric Cards Grid (Dynamically scoped) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isOverallMode ? 'PORTFOLIO KPI MATRIX' : `SITE KPI MATRIX (${activeProject?.name || 'ACTIVE'})`}
          </Text>
          <Text style={styles.sectionBadge}>LIVE TELEMETRY</Text>
        </View>

        <View style={styles.metricsGrid}>
          {/* 1. Projects Count / Location */}
          <View style={styles.metricCell}>
            <MetricCard
              label={isOverallMode ? "Active Sites" : "Location"}
              value={isOverallMode ? String(metrics.activeProjects) : (activeProject?.location || 'Kolhapur')}
              subtext={isOverallMode ? `${projects.length} Total sites` : `${activeProject?.builtUpAreaSqFt || 0} sq.ft`}
              icon={<FolderKanban size={18} color={colors.primaryAccent} />}
              accentColor={colors.primaryAccent}
              badgeType="success"
              badge={isOverallMode ? "PORTFOLIO" : "ACTIVE"}
              onPress={() => handleNavigateToProgress()}
            />
          </View>

          {/* 2. Total Budget */}
          <View style={styles.metricCell}>
            <MetricCard
              label={isOverallMode ? "Portfolio Budget" : "Site Budget"}
              value={formatIndianCurrency(displayBudget)}
              subtext="Capital allocation"
              icon={<Coins size={18} color={colors.secondaryInfo} />}
              accentColor={colors.secondaryInfo}
              badgeType="info"
              badge="ESTIMATED"
            />
          </View>

          {/* 3. Expenses Logged */}
          <View style={styles.metricCell}>
            <MetricCard
              label="Expenses Logged"
              value={formatIndianCurrency(displaySpent)}
              subtext="Audited site outflow"
              icon={<Receipt size={18} color={colors.outflowExpense} />}
              accentColor={colors.outflowExpense}
              badgeType="warning"
              badge="OUTFLOW"
              onPress={() => handleNavigateToExpenses()}
            />
          </View>

          {/* 4. Progress % */}
          <View style={styles.metricCell}>
            <MetricCard
              label={isOverallMode ? "Avg Progress" : "Execution"}
              value={`${displayProgress}%`}
              subtext="Milestone completion"
              icon={<TrendingUp size={18} color={colors.primaryAccent} />}
              accentColor={colors.primaryAccent}
              badgeType="success"
              badge="ON TRACK"
              onPress={() => handleNavigateToProgress()}
            />
          </View>

          {/* 5. AI Risk Indicator */}
          <View style={styles.metricCell}>
            <MetricCard
              label="AI Risk Index"
              value={displayRisk}
              subtext="Variance calculation"
              icon={<AlertTriangle size={18} color={displayRisk === 'High' ? colors.criticalDelete : displayRisk === 'Medium' ? colors.outflowExpense : colors.primaryAccent} />}
              accentColor={displayRisk === 'High' ? colors.criticalDelete : displayRisk === 'Medium' ? colors.outflowExpense : colors.primaryAccent}
              badgeType={displayRisk === 'High' ? 'danger' : displayRisk === 'Medium' ? 'warning' : 'success'}
              badge={displayRisk.toUpperCase()}
            />
          </View>

          {/* 6. Notifications Counter */}
          <View style={styles.metricCell}>
            <MetricCard
              label="Alerts / Audits"
              value={`${metrics.notificationsCount} Unread`}
              subtext="Safety notices"
              icon={<Bell size={18} color="#A78BFA" />}
              accentColor="#A78BFA"
              badgeType="info"
              badge="ACTION REQ"
            />
          </View>
        </View>

        {/* 5. AI House Price Prediction & Equipment Forecast Card */}
        <AIPredictionWidget
          initialArea={Number(activeProject?.builtUpAreaSqFt) || 2000}
          projectName={isOverallMode ? 'Portfolio Aggregate Model' : activeProject?.name}
          refreshTrigger={refreshTrigger}
        />

        {/* 6. Project Card Preview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isOverallMode ? 'PORTFOLIO SITES OVERVIEW' : 'ACTIVE SITE TIMELINE'}
          </Text>
          {projects.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllRow}
              onPress={() => handleNavigateToProgress()}
            >
              <Text style={styles.viewAllText}>VIEW ALL PHASES</Text>
              <ChevronRight size={14} color={colors.primaryAccent} />
            </TouchableOpacity>
          )}
        </View>

        {isLoading && !refreshing && projects.length === 0 ? (
          <LoadingSpinner message="Querying live project telemetry..." />
        ) : isOverallMode ? (
          <View style={{ gap: 10 }}>
            {projects.map((proj) => (
              <ProjectCard
                key={proj.id}
                project={proj}
                isSelected={activeProject?.id === proj.id}
                onPress={() => {
                  setIsOverallMode(false);
                  setActiveProjectId(proj.id);
                  handleNavigateToProgress(proj.id);
                }}
              />
            ))}
          </View>
        ) : activeProject ? (
          <ProjectCard
            project={activeProject}
            isSelected={true}
            onPress={() => handleNavigateToProgress(activeProject.id)}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Building2 size={36} color={colors.primaryAccent} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>NO ACTIVE PROJECTS</Text>
            <Text style={styles.emptySub}>
              {isClient
                ? 'No project is currently linked to your account. Your site engineer will onboard your project shortly.'
                : 'No projects registered yet. Create your first project to begin tracking milestone phases and expenses.'}
            </Text>
            {!isClient && (
              <TouchableOpacity
                style={styles.createProjectBtn}
                onPress={() => setCreateModalVisible(true)}
              >
                <Plus size={15} color="#071224" />
                <Text style={styles.createProjectBtnText}>+ CREATE FIRST PROJECT</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Extra Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Project Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSub}>CONSTRUCTION SITE ONBOARDING</Text>
                <Text style={styles.modalTitle}>Create New Project</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setCreateModalVisible(false)}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>PROJECT NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Skyline Imperial Tower"
                placeholderTextColor={colors.textMuted}
                value={newProjectName}
                onChangeText={setNewProjectName}
              />

              <Text style={styles.fieldLabel}>LOCATION / CITY *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Hyderabad, Financial District"
                placeholderTextColor={colors.textMuted}
                value={newProjectLocation}
                onChangeText={setNewProjectLocation}
              />

              <Text style={styles.fieldLabel}>BUILT-UP AREA (SQ.FT)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 3500"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={newProjectArea}
                onChangeText={(text) => {
                  setNewProjectArea(text);
                  const sqft = parseFloat(text) || 0;
                  if (sqft > 0) {
                    setNewProjectBudget(String(sqft * 1800));
                  }
                }}
              />

              <Text style={styles.fieldLabel}>ESTIMATED BUDGET (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 6300000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={newProjectBudget}
                onChangeText={setNewProjectBudget}
              />

              <View style={styles.infoBox}>
                <Sparkles size={14} color={colors.primaryAccent} />
                <Text style={styles.infoBoxText}>
                  Standard execution phases (Planning, Foundation, Superstructure, Plumbing, Electrical, Finishing, Interior) will be auto-generated.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, isSubmittingProject && styles.saveBtnDisabled]}
                onPress={handleCreateProject}
                disabled={isSubmittingProject}
              >
                {isSubmittingProject ? (
                  <ActivityIndicator size="small" color="#071224" />
                ) : (
                  <>
                    <Save size={16} color="#071224" />
                    <Text style={styles.saveBtnText}>INITIALIZE & CREATE PROJECT</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  clientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  clientBannerText: {
    flex: 1,
    color: '#93C5FD',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    lineHeight: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  sectionBadge: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.primaryAccent,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    rowGap: 10,
  },
  metricCell: {
    width: '48.5%',
  },
  projectFilterSection: {
    marginTop: 14,
    paddingHorizontal: 16,
  },
  projectPillsRow: {
    flexDirection: 'row',
  },
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  projectPillActive: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  projectPillText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  projectPillTextActive: {
    color: '#071224',
    fontWeight: '900',
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.primaryAccent,
  },
  emptyCard: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  createProjectTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryAccent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  createProjectTopBarText: {
    color: '#071224',
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  createProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryAccent,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  createProjectBtnText: {
    color: '#071224',
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 11,
  },
  addProjectHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryAccent,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addProjectHeaderBtnText: {
    color: '#071224',
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.cardSurface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: colors.blueprintBorder,
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
    fontWeight: '700',
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
    padding: 6,
  },
  modalBody: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.backgroundDeep,
    borderWidth: 1,
    borderColor: colors.blueprintBorderMuted,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: `${colors.primaryAccent}10`,
    borderWidth: 1,
    borderColor: `${colors.primaryAccent}30`,
    borderRadius: 6,
    padding: 10,
    marginTop: 14,
    marginBottom: 16,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 14,
    fontFamily: 'monospace',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryAccent,
    borderRadius: 6,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#071224',
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

