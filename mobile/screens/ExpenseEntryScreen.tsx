import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Receipt,
  Coins,
  Calendar,
  Layers,
  FileText,
  PlusCircle,
  Tag,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  TrendingDown,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { ExpenseCategory, Expense } from '../types';
import { createExpense, fetchExpenses } from '../api/expenses';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Banner } from '../components/Banner';
import { formatIndianCurrency } from '../components/ProjectCard';

const CATEGORIES: Array<{ key: ExpenseCategory; label: string; color: string }> = [
  { key: 'MATERIAL', label: 'Material', color: colors.outflowExpense },
  { key: 'LABOUR', label: 'Labour', color: colors.secondaryInfo },
  { key: 'EQUIPMENT', label: 'Equipment', color: '#A78BFA' },
  { key: 'OVERHEADS', label: 'Overheads', color: '#38BDF8' },
  { key: 'OTHER', label: 'Other', color: colors.textMuted },
];

export const ExpenseEntryScreen = () => {
  const route = useRoute<any>();
  const { isClient, isAdmin, isEngineer } = useAuth();
  const { projects, activeProject, refreshProjects } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    route.params?.projectId || activeProject?.id || ''
  );
  const [category, setCategory] = useState<ExpenseCategory>('MATERIAL');
  const [itemName, setItemName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [dateOption, setDateOption] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loadingFeed, setLoadingFeed] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const targetProjectId = selectedProjectId || activeProject?.id;

  const loadExpenses = useCallback(async () => {
    if (!targetProjectId) return;
    setLoadingFeed(true);
    try {
      const data = await fetchExpenses(targetProjectId);
      setRecentExpenses(data);
    } catch (err) {
      console.warn('Failed to load expenses:', err);
    } finally {
      setLoadingFeed(false);
    }
  }, [targetProjectId]);

  useEffect(() => {
    if (activeProject?.id && !selectedProjectId) {
      setSelectedProjectId(activeProject.id);
    }
    loadExpenses();
  }, [activeProject, selectedProjectId, loadExpenses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadExpenses(), refreshProjects()]);
    setRefreshing(false);
  };

  const calculateEffectiveDate = (): string => {
    if (dateOption === 'today') return new Date().toISOString();
    if (dateOption === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString();
    }
    return new Date(customDate).toISOString();
  };

  const handleLogExpense = async () => {
    if (isClient) {
      Alert.alert('Read-Only Clearance', 'Client accounts cannot record expenses. This view is read-only for budget tracking and verification.');
      return;
    }
    if (!targetProjectId) {
      Alert.alert('Selection Error', 'Please select a project before logging an expense.');
      return;
    }
    if (!itemName.trim()) {
      Alert.alert('Validation Error', 'Please enter the item name or transaction description.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid numeric transaction amount (₹).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadDate = calculateEffectiveDate();
      const newExpense = await createExpense({
        projectId: targetProjectId,
        category,
        itemName: itemName.trim(),
        amount: numAmount,
        date: payloadDate,
      });

      setBannerMsg(`Logged ₹${numAmount.toLocaleString('en-IN')} for "${itemName.trim()}".`);
      setItemName('');
      setAmount('');

      // Refresh list and global project state
      await Promise.all([loadExpenses(), refreshProjects()]);
    } catch (err: any) {
      Alert.alert('Logging Failed', err?.message || 'Failed to submit expense transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalLoggedAmount = recentExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  return (
    <View style={styles.container}>
      <Header
        title="Direct Expense Logger"
        subtitle={`${activeProject?.name || 'Site Accounts'} · Financial Outflow Ledger`}
      />

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

        {/* Transaction Logger Card */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Receipt size={16} color={isClient ? colors.secondaryInfo : colors.outflowExpense} />
              <Text style={[styles.cardTitle, isClient && { color: colors.secondaryInfo }]}>
                {isClient ? 'PROJECT FINANCIAL LEDGER' : 'RECORD SITE OUTFLOW'}
              </Text>
            </View>
            <View style={[styles.outflowPill, isClient && { borderColor: colors.secondaryInfo, backgroundColor: `${colors.secondaryInfo}15` }]}>
              <TrendingDown size={10} color={isClient ? colors.secondaryInfo : colors.outflowExpense} />
              <Text style={[styles.outflowText, isClient && { color: colors.secondaryInfo }]}>
                {isClient ? 'AUDITED LEDGER' : 'DIRECT DEBIT'}
              </Text>
            </View>
          </View>

          {/* 1. Target Project Selector */}
          <Text style={styles.fieldLabel}>TARGET PROJECT</Text>
          {projects.length === 0 ? (
            <View style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontFamily: 'monospace', textAlign: 'center' }}>
                No active projects found. Create a project on Dashboard first.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.projectPillsRow}
            >
              {projects.map((p) => {
                const isSelected = (selectedProjectId || activeProject?.id) === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.projPill, isSelected && styles.projPillActive]}
                    onPress={() => setSelectedProjectId(p.id)}
                  >
                    <Layers
                      size={11}
                      color={isSelected ? colors.primaryAccent : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.projPillText,
                        isSelected && styles.projPillTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {isClient ? (
            <View style={{ marginTop: 14, padding: 12, borderRadius: 8, backgroundColor: `${colors.secondaryInfo}15`, borderWidth: 1, borderColor: `${colors.secondaryInfo}40` }}>
              <Text style={{ color: colors.secondaryInfo, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>
                CLIENT AUDIT MODE · VERIFIED EXPENSES
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 17 }}>
                Direct expense logging is reserved for site engineers and administrators. You have live read-only visibility into all audited materials, equipment, and labour costs logged below.
              </Text>
            </View>
          ) : (
            <>
              {/* 2. Category Dropdown Selector */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            EXPENSE CATEGORY
          </Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryPill,
                    isSelected && {
                      borderColor: cat.color,
                      backgroundColor: `${cat.color}15`,
                    },
                  ]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Tag
                    size={12}
                    color={isSelected ? cat.color : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && { color: cat.color, fontWeight: '800' },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 3. Item / Description Input */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            ITEM / TRANSACTION DESCRIPTION
          </Text>
          <View style={styles.inputWrapper}>
            <FileText size={16} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g., 50 Bags UltraTech Cement / Mason Wages"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* 4. Amount Numeric Field */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            TRANSACTION AMOUNT (₹)
          </Text>
          <View style={styles.inputWrapper}>
            <Coins
              size={16}
              color={colors.outflowExpense}
              style={styles.inputIcon}
            />
            <TextInput
              style={[
                styles.input,
                { color: colors.outflowExpense, fontWeight: '800', fontFamily: 'monospace' },
              ]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>

          {/* 5. Date Selector */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>
            TRANSACTION DATE
          </Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[
                styles.datePill,
                dateOption === 'today' && styles.datePillActive,
              ]}
              onPress={() => setDateOption('today')}
            >
              <Text
                style={[
                  styles.datePillText,
                  dateOption === 'today' && styles.datePillTextActive,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.datePill,
                dateOption === 'yesterday' && styles.datePillActive,
              ]}
              onPress={() => setDateOption('yesterday')}
            >
              <Text
                style={[
                  styles.datePillText,
                  dateOption === 'yesterday' && styles.datePillTextActive,
                ]}
              >
                Yesterday
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.datePill,
                dateOption === 'custom' && styles.datePillActive,
              ]}
              onPress={() => setDateOption('custom')}
            >
              <Text
                style={[
                  styles.datePillText,
                  dateOption === 'custom' && styles.datePillTextActive,
                ]}
              >
                Custom Date
              </Text>
            </TouchableOpacity>
          </View>

          {dateOption === 'custom' && (
            <TextInput
              style={[styles.input, styles.customDateInput]}
              value={customDate}
              onChangeText={setCustomDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          )}

          {/* Submit Action */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
            onPress={handleLogExpense}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#071224" />
            ) : (
              <>
                <PlusCircle size={16} color="#071224" />
                <Text style={styles.submitText}>COMMIT SITE TRANSACTION</Text>
              </>
            )}
          </TouchableOpacity>
          </>
          )}
        </View>

        {/* Recent Site Expense Feed */}
        <View style={styles.feedSection}>
          <View style={styles.feedHeader}>
            <View>
              <Text style={styles.feedTitle}>RECENT AUDITED OUTFLOWS</Text>
              <Text style={styles.feedSub}>
                Total Site Outflow: {formatIndianCurrency(totalLoggedAmount)}
              </Text>
            </View>
          </View>

          {loadingFeed && !refreshing ? (
            <ActivityIndicator size="small" color={colors.primaryAccent} style={{ marginVertical: 16 }} />
          ) : recentExpenses.length === 0 ? (
            <View style={styles.emptyFeedBox}>
              <Text style={styles.emptyFeedText}>No site expenses logged yet.</Text>
            </View>
          ) : (
            recentExpenses.map((exp) => (
              <View key={exp.id} style={styles.expenseItem}>
                <View style={styles.expenseLeft}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{exp.category}</Text>
                  </View>
                  <Text style={styles.itemNameText}>{exp.itemName}</Text>
                  <Text style={styles.itemDateText}>
                    {new Date(exp.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <View style={styles.expenseRight}>
                  <Text style={styles.amountText}>
                    -₹{Number(exp.amount).toLocaleString('en-IN')}
                  </Text>
                  <View style={styles.auditedBadge}>
                    <CheckCircle2 size={10} color={colors.primaryAccent} />
                    <Text style={styles.auditedText}>Audited</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  formCard: {
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
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  outflowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: colors.outflowExpense,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  outflowText: {
    color: colors.outflowExpense,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  projectPillsRow: {
    flexDirection: 'row',
  },
  projPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    gap: 4,
  },
  projPillActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(45, 191, 158, 0.12)',
  },
  projPillText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  projPillTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    minWidth: '30%',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    paddingVertical: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  datePill: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  datePillActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
  },
  datePillText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  datePillTextActive: {
    color: colors.primaryAccent,
    fontWeight: '800',
  },
  customDateInput: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  submitButton: {
    backgroundColor: colors.primaryAccent,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#071224',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
  feedSection: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  feedHeader: {
    marginBottom: 8,
  },
  feedTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
    letterSpacing: 1,
  },
  feedSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  emptyFeedBox: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  emptyFeedText: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  expenseItem: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseLeft: {
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 8,
    color: colors.primaryAccent,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  itemNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  itemDateText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.outflowExpense,
    fontFamily: 'monospace',
  },
  auditedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  auditedText: {
    fontSize: 9,
    color: colors.primaryAccent,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
});

