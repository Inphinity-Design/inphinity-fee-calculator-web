
export type TaskComplexity = 'low' | 'normal' | 'high';
export type TaskCategory = 'baseline' | 'addon-interiors' | 'addon-masterplan';

export interface Task {
  id: string;
  name: string;
  weight: number;
  included: boolean;
  complexity: TaskComplexity;
  category: TaskCategory;
}

export interface Dwelling {
  id: string;
  size: number;
  complexity: number;
  description: string;
  fee: number;
  timeEstimate?: number;     // Added for time estimates
  cappedHours?: number;      // Added for capped hours
  hourlyRate?: number;       // Added for hourly rate
}

export interface Stage2Estimate {
  constructionCostPerSqm: number;
  feePercentage: number;
  manualConstructionCost?: number;
}

export interface ConsultationTimeEstimate {
  hourlyRate: number;
  hours: number;
}

export interface ProjectData {
  clientName: string;
  projectName: string;
  location?: string;
  date: Date | undefined;
  dwellings: Dwelling[];
  tasks: Task[];
  consultationEstimate?: ConsultationTimeEstimate;
  timeEstimatesLocked?: boolean;
  teamDistribution?: TeamDistributionState;
  consultants?: Consultant[];
  multiplierSettings?: MultiplierSettings;
}

// Hook for stage 2 calculator
export interface Stage2CalculatorResult {
  totalConstructionCost: number;
  stage2Fee: number;
  feePercentage: number;
}

// Hook for consultation time calculator
export interface ConsultationTimeResult {
  totalConsultationFee: number;
  hourlyRate: number;
  hours: number;
}

// Task breakdown item for detailed time estimates
export interface TaskBreakdownItem {
  taskId: string;
  taskName: string;
  weight: number;
  complexity: TaskComplexity;
  estimatedHours: number;
  estimatedCost: number;
}

// New interface for time estimate calculations
export interface TimeEstimateResult {
  totalEstimatedHours: number;
  taskBreakdown: TaskBreakdownItem[];
  hourlyRate: number;
  dwellingsWithTimeEstimates?: Dwelling[];  // Optional for backwards compatibility
}

// Team Distribution Types
export interface SubTask {
  id: string;
  name: string;
  baseHours: number;
  parentTaskId: string; // maps to app's task-1, task-2, etc.
}

export interface ParentTaskGroup {
  id: string;
  name: string;
  appTaskId: string; // maps to Task.id in the app
  subTasks: SubTask[];
}

export interface TeamMember {
  id: string;
  name: string;
  hourlyRate: number; // USD per hour
  role?: string; // Job title/role (e.g., "Senior Designer", "Project Manager")
  photoUrl?: string; // Profile photo URL (base64 data URL or external URL)
}

export interface TaskAssignment {
  subTaskId: string;
  teamMemberId: string;
  role: 'lead' | 'implementer';
}

export interface TeamDistributionSettings {
  leadPercentage: number; // default 20
  implementerPercentage: number; // default 80
}

// Custom distribution weight for sharing roles among multiple assignees
export interface RoleDistributionWeight {
  subTaskId: string;
  role: 'lead' | 'implementer';
  teamMemberId: string;
  weight: number; // Relative weight (e.g., 1, 2, 3) - used for proportional distribution
}

// Custom hours override for manually adjusting sub-task hours
export interface SubTaskHoursOverride {
  subTaskId: string;
  customHours: number; // Manually set hours for this sub-task
}

export interface TeamDistributionState {
  teamMembers: TeamMember[];
  assignments: TaskAssignment[];
  settings: TeamDistributionSettings;
  customDistributions?: RoleDistributionWeight[]; // Optional for backward compatibility
  customHours?: SubTaskHoursOverride[]; // Optional for manually overridden hours
}

// Saved Team Configuration for Export/Import
export interface SavedTeamConfiguration {
  id: string;
  name: string;
  exportDate: string;
  teamMembers: TeamMember[];
  assignments: TaskAssignment[];
  settings: TeamDistributionSettings;
  customDistributions?: RoleDistributionWeight[];
  customHours?: SubTaskHoursOverride[];
}

// 3rd Party Consultants Types
export type ConsultantFeeType = 'fixed' | 'hourly';

export interface Consultant {
  id: string;
  name: string;
  feeType: ConsultantFeeType;
  fixedFee?: number;
  hourlyRate?: number;
  hours?: number;
  includeInProjectFee: boolean;
}

// Multiplier Settings Types
export interface DwellingComplexityMultipliers {
  1: number; // Simple
  2: number; // Below Average
  3: number; // Standard
  4: number; // Above Average
  5: number; // Complex
}

export interface TaskComplexityMultipliers {
  low: number;
  normal: number;
  high: number;
}

// Scaling Tiers
export interface ScalingTier {
  limit: number; // Square meters
  multiplier: number; // Fee multiplier (e.g. 1.0, 1.5)
}

export interface MultiplierSettings {
  dwellingComplexity: DwellingComplexityMultipliers;
  taskComplexity: TaskComplexityMultipliers;
  projectSizeScaling?: ScalingTier[];
}

// Default multiplier values
export const DEFAULT_DWELLING_MULTIPLIERS: DwellingComplexityMultipliers = {
  1: 0.75,
  2: 0.9,
  3: 1.0,
  4: 1.2,
  5: 1.4,
};

export const DEFAULT_TASK_MULTIPLIERS: TaskComplexityMultipliers = {
  low: 0.8,
  normal: 1.0,
  high: 1.2,
};

export const DEFAULT_SCALING_TIERS: ScalingTier[] = [
  { limit: 100, multiplier: 1.0 },
  { limit: 200, multiplier: 1.2 },
  { limit: 300, multiplier: 1.5 },
  { limit: 500, multiplier: 2.0 },
  { limit: 800, multiplier: 2.8 },
  { limit: 1000, multiplier: 3.5 },
  { limit: 5000, multiplier: 8.0 },
];

