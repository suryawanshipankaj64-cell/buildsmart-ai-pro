export type Role = 'ADMIN' | 'ENGINEER' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  isApproved: boolean;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';

export interface Estimate {
  id: string;
  projectId: string;
  cementBags: number;
  steelKg: number;
  sandCft: number;
  bricksCount: number;
  aggregateCft: number;
  masonCount: number;
  electricianCount: number;
  plumberCount: number;
  helperCount: number;
  totalManHours: number;
  equipmentCost: number;
  materialCost: number;
  labourCost: number;
  overheadCost: number;
  totalEstimatedCost: number;
  costPerSqFt: number;
}

export interface Task {
  id: string;
  projectId: string;
  phaseName: string;
  title: string;
  assignee?: string | null;
  dueDate: string;
  isCompleted: boolean;
  progressPercent: number;
  notes?: string | null;
  proofImageUrl?: string | null;
  createdAt?: string;
}

export type ExpenseCategory = 'MATERIAL' | 'LABOUR' | 'EQUIPMENT' | 'OVERHEADS' | 'OTHER';

export interface Expense {
  id: string;
  projectId: string;
  category: ExpenseCategory | string;
  itemName: string;
  amount: number;
  date: string;
  receiptUrl?: string | null;
  createdAt?: string;
  project?: {
    name: string;
  };
}

export interface SitePhoto {
  id: string;
  projectId: string;
  imageUrl: string;
  caption?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  uploadedAt: string;
  project?: {
    name: string;
    location: string;
  };
}

export interface Project {
  id: string;
  userId: string;
  clientId?: string | null;
  name: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  builtUpAreaSqFt: number;
  budget: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus | string;
  progressPercent: number;
  createdAt?: string;
  updatedAt?: string;
  estimate?: Estimate | null;
  tasks?: Task[];
  expenses?: Expense[];
  sitePhotos?: SitePhoto[];
  spent?: number;
}

export type DocumentCategory = 'PLANS' | 'PERMITS' | 'CONTRACTS' | 'BILLS';

export interface DocumentHistoryEntry {
  version: string;
  date: string;
  changedBy: string;
  note: string;
}

export interface DocumentRecord {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  roleVisibility: Array<'ADMIN' | 'ENGINEER' | 'CONTRACTOR' | 'CUSTOMER'>;
  tags: string[];
  history: DocumentHistoryEntry[];
}

export interface WeatherInfo {
  temp: number;
  condition: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
  advisory?: string;
}

export interface RiskAnalysis {
  overallScore: number;
  level: 'Low' | 'Medium' | 'High';
  budgetOverrunScore: number;
  delayScore: number;
  materialVolatilityScore: number;
  labourShortageScore: number;
  flags: string[];
}

export type QuickActionType =
  | 'expense'
  | 'sitelog'
  | 'phase_update'
  | 'photo'
  | 'voice_note'
  | 'document';

export interface DashboardMetrics {
  activeProjects: number;
  totalBudget: number;
  totalSpent: number;
  averageProgress: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  notificationsCount: number;
}

