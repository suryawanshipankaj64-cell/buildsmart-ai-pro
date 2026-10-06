import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import {
  Calculator,
  Building2,
  Sparkles,
  Truck,
  Hammer,
  Users,
  ShieldCheck,
  Zap,
  Plus,
  Minus,
  CheckCircle2,
  Tractor,
  Scissors,
  Layers,
  Droplet,
  Compass,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { AdminRates, fetchAdminRates } from '../api/rates';
import { formatIndianCurrency } from './ProjectCard';

interface AIPredictionWidgetProps {
  initialArea?: number;
  projectName?: string;
  refreshTrigger?: any;
  onAreaChange?: (area: number) => void;
}

export const AIPredictionWidget: React.FC<AIPredictionWidgetProps> = ({
  initialArea = 2000,
  projectName,
  refreshTrigger,
  onAreaChange,
}) => {
  const [area, setArea] = useState<number>(initialArea > 0 ? initialArea : 2000);
  const [areaInput, setAreaInput] = useState<string>(String(initialArea > 0 ? initialArea : 2000));
  const [qualityGrade, setQualityGrade] = useState<'STANDARD' | 'PREMIUM' | 'LUXURY'>('STANDARD');
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'labor' | 'equipment'>('equipment');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isSyncingRates, setIsSyncingRates] = useState<boolean>(false);
  const [adminRates, setAdminRates] = useState<AdminRates>({
    baseRatePerSqFt: 1800,
    standardRatePerSqFt: 1800,
    premiumRatePerSqFt: 2200,
    luxuryRatePerSqFt: 3100,
    cementBagRate: 380,
    steelKgRate: 65,
    sandCftRate: 55,
    aggregateCftRate: 42,
    brickRate: 9,
    masonDailyWage: 950,
    helperDailyWage: 550,
  });

  const loadRates = async () => {
    try {
      setIsSyncingRates(true);
      const data = await fetchAdminRates();
      if (data) {
        setAdminRates(data);
      }
    } finally {
      setIsSyncingRates(false);
    }
  };

  useEffect(() => {
    if (initialArea > 0) {
      setArea(initialArea);
      setAreaInput(String(initialArea));
    }
  }, [initialArea]);

  useEffect(() => {
    loadRates();
  }, [refreshTrigger]);

  const standardRate = adminRates.standardRatePerSqFt || adminRates.baseRatePerSqFt || 1700;
  const premiumRate = adminRates.premiumRatePerSqFt || 2200;
  const luxuryRate = adminRates.luxuryRatePerSqFt || 3100;

  const currentRate = qualityGrade === 'STANDARD' ? standardRate : qualityGrade === 'PREMIUM' ? premiumRate : luxuryRate;
  const predictedPrice = area * currentRate;

  // Material estimates
  const cementFactor = qualityGrade === 'STANDARD' ? 0.42 : qualityGrade === 'PREMIUM' ? 0.45 : 0.48;
  const steelFactor = qualityGrade === 'STANDARD' ? 3.8 : qualityGrade === 'PREMIUM' ? 4.2 : 4.8;
  const sandFactor = qualityGrade === 'STANDARD' ? 1.7 : qualityGrade === 'PREMIUM' ? 1.85 : 2.0;
  const aggregateFactor = qualityGrade === 'STANDARD' ? 1.3 : qualityGrade === 'PREMIUM' ? 1.4 : 1.55;
  const bricksFactor = qualityGrade === 'STANDARD' ? 19 : qualityGrade === 'PREMIUM' ? 19.5 : 21;

  const cementBags = Math.round(area * cementFactor);
  const steelKg = Math.round(area * steelFactor);
  const sandCft = Math.round(area * sandFactor);
  const aggregateCft = Math.round(area * aggregateFactor);
  const bricksCount = Math.round(area * bricksFactor);

  // Labor estimates
  const masons = Math.max(2, Math.round(area / 300));
  const helpers = Math.max(4, Math.round(area / 150));
  const electricians = Math.max(1, Math.round(area / 1000));
  const plumbers = Math.max(1, Math.round(area / 1000));
  const totalManHours = Math.round(area * (qualityGrade === 'LUXURY' ? 6.8 : qualityGrade === 'PREMIUM' ? 6.0 : 5.5));

  // Equipment calculations
  const mixerDays = Math.max(5, Math.round(area / 120));
  const vibratorDays = Math.max(5, Math.round(area / 120));
  const excavatorHours = Math.max(8, Math.round(area / 100));
  const plateCompactorDays = Math.max(3, Math.round(area / 500));
  const rebarBenderDays = Math.max(4, Math.round(area / 250));
  const scaffoldingUnits = Math.round(area * 1.1);
  const curingPumpDays = Math.max(21, Math.round(area / 80));
  const totalStationDays = 2;

  const equipmentItems = [
    {
      id: 'mixer',
      name: 'Concrete Batch Mixer (10/7 CFT)',
      category: 'Concreting',
      quantity: '1 Unit',
      duration: `${mixerDays} Days`,
      estCost: mixerDays * 1200,
      purpose: 'Homogeneous on-site RCC concrete mixing for columns, beams & slabs',
    },
    {
      id: 'vibrator',
      name: 'Needle Vibrator (40mm/60mm)',
      category: 'Concreting',
      quantity: '2 Units',
      duration: `${vibratorDays} Days`,
      estCost: vibratorDays * 450,
      purpose: 'De-aeration and compaction of poured concrete without voids',
    },
    {
      id: 'rebar',
      name: 'TMT Rebar Cutting & Bending Machine',
      category: 'Steel & Rebar',
      quantity: '1 Set',
      duration: `${rebarBenderDays} Days`,
      estCost: rebarBenderDays * 800,
      purpose: 'Precision cutting & bending of Fe-550D TMT reinforcement steel',
    },
    {
      id: 'jcb',
      name: 'Backhoe Excavator (JCB 3DX)',
      category: 'Earthwork',
      quantity: '1 Machine',
      duration: `${excavatorHours} Op-Hours`,
      estCost: excavatorHours * 1600,
      purpose: 'Footing trenches, column pit excavation & boundary soil leveling',
    },
    {
      id: 'scaffolding',
      name: 'Cuplock Scaffolding & Acrow Props',
      category: 'Formwork',
      quantity: `${scaffoldingUnits} sq.ft`,
      duration: 'Slab Staging',
      estCost: Math.round(scaffoldingUnits * 18),
      purpose: 'Falsework staging for RCC beam & ceiling slab casting',
    },
    {
      id: 'compactor',
      name: 'Vibratory Plate Compactor',
      category: 'Earthwork',
      quantity: '1 Unit',
      duration: `${plateCompactorDays} Days`,
      estCost: plateCompactorDays * 900,
      purpose: 'Compacting foundation subgrade, plinth murrum fill & floor base',
    },
    {
      id: 'curing',
      name: 'Water Curing Pump & Pipeline',
      category: 'Curing',
      quantity: '1 HP Kit',
      duration: `${curingPumpDays} Days`,
      estCost: curingPumpDays * 350,
      purpose: 'Continuous hydration curing for brick masonry walls & RCC structures',
    },
    {
      id: 'survey',
      name: 'Digital Total Station / Optical Level',
      category: 'Survey',
      quantity: '1 Kit',
      duration: `${totalStationDays} Days`,
      estCost: totalStationDays * 2500,
      purpose: 'Grid axis alignment, column plumb and benchmark transfer',
    },
  ];

  const totalEquipmentCost = equipmentItems.reduce((sum, item) => sum + item.estCost, 0);

  const handleManualAreaChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    setAreaInput(cleanText);
    const num = parseInt(cleanText, 10);
    const validNum = isNaN(num) ? 0 : num;
    setArea(validNum);
    if (onAreaChange) onAreaChange(validNum);
  };

  const handleAdjustArea = (delta: number) => {
    setArea((prev) => {
      const next = Math.max(100, prev + delta);
      setAreaInput(String(next));
      if (onAreaChange) onAreaChange(next);
      return next;
    });
  };

  const handleSelectPresetArea = (preset: number) => {
    setArea(preset);
    setAreaInput(String(preset));
    if (onAreaChange) onAreaChange(preset);
  };

  return (
    <View style={styles.cardContainer}>
      {/* 1. Header with Admin Master Badge */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Calculator size={15} color={colors.primaryAccent} />
            <Text style={styles.headerTitle}>AI HOUSE COST & EQUIPMENT FORECAST</Text>
          </View>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {projectName ? `${projectName} · Built-up Area Model` : 'Built-up Area Price Prediction'}
          </Text>
        </View>

        {/* Admin Master Baseline Rate Badge */}
        <TouchableOpacity
          style={[styles.adminRateBadge, isSyncingRates && { borderColor: colors.primaryAccent }]}
          onPress={loadRates}
          activeOpacity={0.7}
        >
          <ShieldCheck size={11} color={colors.primaryAccent} />
          <Text style={styles.adminRateText}>₹{currentRate}/sq.ft ({qualityGrade})</Text>
          <RefreshCw
            size={10}
            color={colors.primaryAccent}
            style={isSyncingRates ? { opacity: 0.5 } : { opacity: 0.9 }}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Construction Quality Grade Selector (Admin Baseline Driven) */}
      <View style={styles.gradeSection}>
        <Text style={styles.gradeSectionLabel}>CONSTRUCTION QUALITY GRADE (ADMIN BASELINE)</Text>
        <View style={styles.gradeButtonRow}>
          <TouchableOpacity
            style={[styles.gradeBtn, qualityGrade === 'STANDARD' && styles.gradeBtnActive]}
            onPress={() => setQualityGrade('STANDARD')}
            activeOpacity={0.8}
          >
            <Text style={[styles.gradeBtnTitle, qualityGrade === 'STANDARD' && styles.gradeBtnTitleActive]}>
              STANDARD
            </Text>
            <Text style={[styles.gradeBtnRate, qualityGrade === 'STANDARD' && styles.gradeBtnRateActive]}>
              ₹{standardRate}/sq.ft
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gradeBtn, qualityGrade === 'PREMIUM' && styles.gradeBtnActive]}
            onPress={() => setQualityGrade('PREMIUM')}
            activeOpacity={0.8}
          >
            <Text style={[styles.gradeBtnTitle, qualityGrade === 'PREMIUM' && styles.gradeBtnTitleActive]}>
              PREMIUM
            </Text>
            <Text style={[styles.gradeBtnRate, qualityGrade === 'PREMIUM' && styles.gradeBtnRateActive]}>
              ₹{premiumRate}/sq.ft
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gradeBtn, qualityGrade === 'LUXURY' && styles.gradeBtnActive]}
            onPress={() => setQualityGrade('LUXURY')}
            activeOpacity={0.8}
          >
            <Text style={[styles.gradeBtnTitle, qualityGrade === 'LUXURY' && styles.gradeBtnTitleActive]}>
              LUXURY
            </Text>
            <Text style={[styles.gradeBtnRate, qualityGrade === 'LUXURY' && styles.gradeBtnRateActive]}>
              ₹{luxuryRate}/sq.ft
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Manual Built-Up Area Enter & Stepper Section */}
      <View style={styles.areaInputSection}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={styles.gradeSectionLabel}>BUILT-UP AREA (MANUAL ENTER IN SQ.FT)</Text>
          <Text style={styles.areaCurrentBadge}>{area.toLocaleString()} sq.ft</Text>
        </View>

        <View style={styles.areaControlRow}>
          <TouchableOpacity
            style={styles.areaStepperBtn}
            onPress={() => handleAdjustArea(-250)}
            activeOpacity={0.7}
          >
            <Minus size={14} color={colors.textPrimary} />
            <Text style={styles.stepperSubText}>-250</Text>
          </TouchableOpacity>

          <View style={styles.areaTextInputBox}>
            <TextInput
              style={styles.areaTextInput}
              value={areaInput}
              onChangeText={handleManualAreaChange}
              keyboardType="numeric"
              placeholder="e.g. 2000"
              placeholderTextColor={colors.textMuted}
              maxLength={6}
            />
            <Text style={styles.areaUnitText}>sq.ft</Text>
          </View>

          <TouchableOpacity
            style={styles.areaStepperBtn}
            onPress={() => handleAdjustArea(250)}
            activeOpacity={0.7}
          >
            <Plus size={14} color={colors.textPrimary} />
            <Text style={styles.stepperSubText}>+250</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Area Presets */}
        <View style={styles.presetRow}>
          {[1000, 1500, 2000, 2500, 3500, 5000].map((preset) => {
            const isPresetActive = area === preset;
            return (
              <TouchableOpacity
                key={preset}
                style={[styles.presetChip, isPresetActive && styles.presetChipActive]}
                onPress={() => handleSelectPresetArea(preset)}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetChipText, isPresetActive && styles.presetChipTextActive]}>
                  {preset}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Main Price Forecast Result Banner */}
      <View style={styles.priceForecastBox}>
        <View style={styles.priceLeftCol}>
          <Text style={styles.priceLabel}>AI PREDICTED HOUSE PRICE</Text>
          <Text style={styles.priceValue}>{formatIndianCurrency(predictedPrice)}</Text>
          <Text style={styles.priceFormulaText}>
            {area.toLocaleString()} sq.ft × ₹{currentRate}/sq.ft · {qualityGrade}
          </Text>
        </View>
        <View style={styles.priceRightBadge}>
          <Sparkles size={16} color={colors.primaryAccent} />
          <Text style={styles.priceRightBadgeText}>Instant AI</Text>
        </View>
      </View>

      {/* 5. Collapsible Arrow Toggle for Detailed Breakdown */}
      <TouchableOpacity
        style={[styles.expandToggleBtn, isExpanded && styles.expandToggleBtnActive]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.expandToggleLeft}>
          <Text style={styles.expandToggleTitle}>
            {isExpanded ? 'DETAILED CIVIL BREAKDOWN' : 'VIEW DETAILED CIVIL BREAKDOWN'}
          </Text>
          <Text style={styles.expandToggleSubTitle}>
            {isExpanded
              ? 'Tap to collapse machinery, materials & labor'
              : `Equipment (${equipmentItems.length}) · Materials Takeoff · Labor Schedule`}
          </Text>
        </View>

        <View style={[styles.arrowBadge, isExpanded && styles.arrowBadgeActive]}>
          {isExpanded ? (
            <ChevronUp size={18} color={colors.primaryAccent} />
          ) : (
            <ChevronDown size={18} color={colors.primaryAccent} />
          )}
        </View>
      </TouchableOpacity>

      {/* 6. Expandable Content: Sub-Tabs & Detailed Forecast */}
      {isExpanded && (
        <View style={styles.expandableContainer}>
          {/* Sub-Tab Switcher (Materials / Labor / Equipment) */}
          <View style={styles.tabSelectorRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeSubTab === 'equipment' && styles.tabButtonActive]}
              onPress={() => setActiveSubTab('equipment')}
              activeOpacity={0.8}
            >
              <Truck size={12} color={activeSubTab === 'equipment' ? '#071224' : colors.primaryAccent} />
              <Text style={[styles.tabButtonText, activeSubTab === 'equipment' && styles.tabButtonTextActive]}>
                Required Equipment ({equipmentItems.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeSubTab === 'materials' && styles.tabButtonActive]}
              onPress={() => setActiveSubTab('materials')}
              activeOpacity={0.8}
            >
              <Hammer size={12} color={activeSubTab === 'materials' ? '#071224' : colors.primaryAccent} />
              <Text style={[styles.tabButtonText, activeSubTab === 'materials' && styles.tabButtonTextActive]}>
                Materials
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeSubTab === 'labor' && styles.tabButtonActive]}
              onPress={() => setActiveSubTab('labor')}
              activeOpacity={0.8}
            >
              <Users size={12} color={activeSubTab === 'labor' ? '#071224' : colors.primaryAccent} />
              <Text style={[styles.tabButtonText, activeSubTab === 'labor' && styles.tabButtonTextActive]}>
                Labor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content: Equipment & Machinery Schedule */}
          {activeSubTab === 'equipment' && (
            <View style={styles.contentBox}>
              <View style={styles.contentHeaderRow}>
                <Text style={styles.contentTitle}>REQUIRED CIVIL MACHINERY & TOOLS</Text>
                <Text style={styles.contentEstBadge}>Est. Total ₹{totalEquipmentCost.toLocaleString('en-IN')}</Text>
              </View>

              <View style={{ gap: 8 }}>
                {equipmentItems.map((item) => (
                  <View key={item.id} style={styles.equipmentCard}>
                    <View style={styles.equipmentTopRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <View style={styles.equipIconBox}>
                          {item.category === 'Concreting' && <Truck size={13} color={colors.primaryAccent} />}
                          {item.category === 'Earthwork' && <Tractor size={13} color={colors.secondaryInfo} />}
                          {item.category === 'Steel & Rebar' && <Scissors size={13} color={colors.outflowExpense} />}
                          {item.category === 'Formwork' && <Layers size={13} color="#A78BFA" />}
                          {item.category === 'Curing' && <Droplet size={13} color={colors.primaryAccent} />}
                          {item.category === 'Survey' && <Compass size={13} color={colors.primaryAccent} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.equipmentName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.equipmentCategory}>{item.category} · {item.quantity}</Text>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.equipmentDuration}>{item.duration}</Text>
                        <Text style={styles.equipmentCost}>~₹{item.estCost.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>
                    <Text style={styles.equipmentPurpose} numberOfLines={2}>{item.purpose}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tab Content: Materials Takeoff */}
          {activeSubTab === 'materials' && (
            <View style={styles.contentBox}>
              <View style={styles.contentHeaderRow}>
                <Text style={styles.contentTitle}>RAW MATERIAL TAKEOFF SCHEDULE</Text>
                <Text style={styles.contentEstBadge}>Admin Live Rates</Text>
              </View>

              <View style={styles.materialGrid}>
                <View style={styles.materialTile}>
                  <Text style={styles.matTileLabel}>CEMENT</Text>
                  <Text style={styles.matTileValue}>{cementBags.toLocaleString()} bags</Text>
                  <Text style={styles.matTileSub}>~₹{(cementBags * adminRates.cementBagRate).toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.materialTile}>
                  <Text style={styles.matTileLabel}>TMT STEEL</Text>
                  <Text style={styles.matTileValue}>{steelKg.toLocaleString()} kg</Text>
                  <Text style={styles.matTileSub}>~₹{(steelKg * adminRates.steelKgRate).toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.materialTile}>
                  <Text style={styles.matTileLabel}>RIVER SAND</Text>
                  <Text style={styles.matTileValue}>{sandCft.toLocaleString()} CFT</Text>
                  <Text style={styles.matTileSub}>~₹{(sandCft * adminRates.sandCftRate).toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.materialTile}>
                  <Text style={styles.matTileLabel}>AGGREGATE</Text>
                  <Text style={styles.matTileValue}>{aggregateCft.toLocaleString()} CFT</Text>
                  <Text style={styles.matTileSub}>~₹{(aggregateCft * adminRates.aggregateCftRate).toLocaleString('en-IN')}</Text>
                </View>

                <View style={[styles.materialTile, { width: '100%' }]}>
                  <Text style={styles.matTileLabel}>BRICKS / AAC BLOCKS</Text>
                  <Text style={styles.matTileValue}>{bricksCount.toLocaleString()} pcs</Text>
                  <Text style={styles.matTileSub}>~₹{(bricksCount * adminRates.brickRate).toLocaleString('en-IN')} (₹{adminRates.brickRate}/unit)</Text>
                </View>
              </View>
            </View>
          )}

          {/* Tab Content: Labor Force */}
          {activeSubTab === 'labor' && (
            <View style={styles.contentBox}>
              <View style={styles.contentHeaderRow}>
                <Text style={styles.contentTitle}>LABOR CREW & MAN-HOURS</Text>
                <Text style={styles.contentEstBadge}>{totalManHours.toLocaleString()} Total Hours</Text>
              </View>

              <View style={styles.materialGrid}>
                <View style={styles.materialTile}>
                  <Text style={styles.matTileLabel}>SKILLED MASONS</Text>
                  <Text style={styles.matTileValue}>{masons} Masons</Text>
                  <Text style={styles.matTileSub}>₹{adminRates.masonDailyWage}/day wage</Text>
                </View>

                <View style={styles.materialTile}>
                  <Text style={styles.matTileLabel}>GENERAL HELPERS</Text>
                  <Text style={styles.matTileValue}>{helpers} Helpers</Text>
                  <Text style={styles.matTileSub}>₹{adminRates.helperDailyWage}/day wage</Text>
                </View>

                <View style={styles.materialTile}>
                  <Text style={styles.matTileLabel}>ELECTRICIANS</Text>
                  <Text style={styles.matTileValue}>{electricians} Tech</Text>
                  <Text style={styles.matTileSub}>Conduit & DB lines</Text>
                </View>

                <View style={styles.materialTile}>
                  <Text style={styles.matTileLabel}>PLUMBERS</Text>
                  <Text style={styles.matTileValue}>{plumbers} Tech</Text>
                  <Text style={styles.matTileSub}>CPVC & Drainage</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
    paddingBottom: 10,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  adminRateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 191, 158, 0.12)',
    borderColor: 'rgba(45, 191, 158, 0.4)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  adminRateText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
  },
  gradeSection: {
    marginBottom: 10,
  },
  gradeSectionLabel: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  gradeButtonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  gradeBtn: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBtnActive: {
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
    borderColor: colors.primaryAccent,
  },
  gradeBtnTitle: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
  },
  gradeBtnTitleActive: {
    color: colors.primaryAccent,
  },
  gradeBtnRate: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  gradeBtnRateActive: {
    color: colors.primaryAccent,
    fontWeight: '800',
  },
  areaInputSection: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  areaCurrentBadge: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
  },
  areaControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  areaStepperBtn: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  stepperSubText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 1,
  },
  areaTextInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderColor: colors.primaryAccent,
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 44,
  },
  areaTextInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: '800',
    paddingVertical: 0,
  },
  areaUnitText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.primaryAccent,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  presetChipActive: {
    backgroundColor: 'rgba(45, 191, 158, 0.15)',
    borderColor: colors.primaryAccent,
  },
  presetChipText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textMuted,
  },
  presetChipTextActive: {
    color: colors.primaryAccent,
    fontWeight: '800',
  },
  priceForecastBox: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLeftCol: {
    flex: 1,
    paddingRight: 8,
  },
  priceRightBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 191, 158, 0.12)',
    borderColor: 'rgba(45, 191, 158, 0.4)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  priceRightBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
  },
  priceLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primaryAccent,
    marginVertical: 2,
  },
  priceFormulaText: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  areaStepperBox: {
    alignItems: 'center',
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    minWidth: 96,
  },
  areaLabel: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
  },
  areaNumber: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textPrimary,
    marginVertical: 2,
  },
  stepperBtnRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  stepperBtn: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundDeep,
    borderColor: 'rgba(45, 191, 158, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  expandToggleBtnActive: {
    backgroundColor: 'rgba(45, 191, 158, 0.08)',
    borderColor: colors.primaryAccent,
  },
  expandToggleLeft: {
    flex: 1,
    paddingRight: 8,
  },
  expandToggleTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
    letterSpacing: 0.5,
  },
  expandToggleSubTitle: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginTop: 2,
  },
  arrowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(45, 191, 158, 0.12)',
    borderColor: 'rgba(45, 191, 158, 0.35)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBadgeActive: {
    backgroundColor: 'rgba(45, 191, 158, 0.22)',
    borderColor: colors.primaryAccent,
  },
  expandableContainer: {
    marginTop: 4,
  },
  tabSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 7,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  tabButtonText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabButtonTextActive: {
    color: '#071224',
    fontWeight: '900',
  },
  contentBox: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  contentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.blueprintBorderMuted,
    paddingBottom: 6,
    marginBottom: 8,
  },
  contentTitle: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  contentEstBadge: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.primaryAccent,
  },
  equipmentCard: {
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  equipmentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equipIconBox: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 4,
    padding: 4,
  },
  equipmentName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  equipmentCategory: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginTop: 1,
  },
  equipmentDuration: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.primaryAccent,
  },
  equipmentCost: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  equipmentPurpose: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 55, 84, 0.3)',
    paddingTop: 3,
  },
  materialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  materialTile: {
    width: '48.5%',
    backgroundColor: colors.cardSurface,
    borderColor: colors.blueprintBorderMuted,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  matTileLabel: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textMuted,
  },
  matTileValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  matTileSub: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.primaryAccent,
    marginTop: 2,
  },
});

