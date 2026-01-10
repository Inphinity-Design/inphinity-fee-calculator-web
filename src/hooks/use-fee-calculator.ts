
import { useMemo } from "react";
import {
  Dwelling,
  Task,
  TaskComplexity,
  TaskCategory,
  MultiplierSettings,
  DwellingComplexityMultipliers,
  TaskComplexityMultipliers,
  DEFAULT_DWELLING_MULTIPLIERS as DWELLING_MULTIPLIERS,
  DEFAULT_TASK_MULTIPLIERS as TASK_MULTIPLIERS,
} from "@/types/calculator";

// Re-export for external use
export const DEFAULT_DWELLING_MULTIPLIERS = DWELLING_MULTIPLIERS;
export const DEFAULT_TASK_MULTIPLIERS = TASK_MULTIPLIERS;

export const useComplexityMultiplier = (
  complexity: number,
  customMultipliers?: DwellingComplexityMultipliers
): number => {
  const multipliers = customMultipliers || DEFAULT_DWELLING_MULTIPLIERS;
  return multipliers[complexity as keyof DwellingComplexityMultipliers] || 1.0;
};

export const useTaskComplexityMultiplier = (
  complexity: TaskComplexity,
  customMultipliers?: TaskComplexityMultipliers
): number => {
  const multipliers = customMultipliers || DEFAULT_TASK_MULTIPLIERS;
  return multipliers[complexity];
};

export const useTotalProjectArea = (dwellings: Dwelling[]): number => {
  if (!dwellings || !Array.isArray(dwellings)) return 0;
  return dwellings.reduce((sum, dwelling) => sum + dwelling.size, 0);
};

// Get per-sqm rates based on project size
export const getPerSqmRates = (totalSqm: number): { baseline: number; interiors: number; masterplan: number } => {
  if (totalSqm <= 100) return { baseline: 260, interiors: 120, masterplan: 25 };
  if (totalSqm <= 200) return { baseline: 186, interiors: 100, masterplan: 17.5 };
  if (totalSqm <= 400) return { baseline: 135.5, interiors: 80, masterplan: 12.5 };
  if (totalSqm <= 600) return { baseline: 109, interiors: 65, masterplan: 12.5 };
  if (totalSqm <= 815) return { baseline: 93, interiors: 60, masterplan: 12 };
  return { baseline: 84, interiors: 55, masterplan: 12 }; // 1000+ sqm
};

// Default weights for each category (used as baseline for time-based fee adjustment)
const DEFAULT_CATEGORY_WEIGHTS = {
  baseline: 173, // task-1: 37 + task-2: 6 + task-3: 34 + task-5: 45 + task-6: 51 = 173
  'addon-interiors': 65, // task-7: 65
  'addon-masterplan': 69, // task-4: 69
};

// Calculate fee for a category based on individual task weights and complexity
// Task weights represent hours - increasing hours increases the fee proportionally
export const getTaskWeightedCategoryFee = (
  tasks: Task[],
  category: TaskCategory,
  totalSqm: number,
  rates: { baseline: number; interiors: number; masterplan: number },
  taskMultipliers?: TaskComplexityMultipliers
): number => {
  const categoryTasks = tasks.filter(t => t.category === category);
  const includedTasks = categoryTasks.filter(t => t.included);

  if (includedTasks.length === 0 || totalSqm <= 0) return 0;

  const rate = category === 'baseline' ? rates.baseline
             : category === 'addon-interiors' ? rates.interiors
             : rates.masterplan;

  // Base fee for this category at default hours
  const baseCategoryFee = totalSqm * rate;

  // Calculate the sum of included task weights (hours)
  const includedWeight = includedTasks.reduce((sum, t) => sum + t.weight, 0);

  // Get the default weight for this category
  const defaultWeight = DEFAULT_CATEGORY_WEIGHTS[category] || 100;

  // Calculate time-based multiplier: more hours = proportionally higher fee
  // If total included hours are higher than default, fee increases proportionally
  const timeMultiplier = includedWeight / defaultWeight;

  // Use configurable task multipliers or defaults
  const multipliers = taskMultipliers || DEFAULT_TASK_MULTIPLIERS;

  // Apply average complexity multiplier for included tasks
  const avgComplexityMult = includedTasks.reduce((sum, task) => {
    const complexityMult = multipliers[task.complexity];
    return sum + complexityMult;
  }, 0) / includedTasks.length;

  return baseCategoryFee * timeMultiplier * avgComplexityMult;
};

export const useBaseFee = (totalSqm: number, tasks: Task[]): number => {
  if (totalSqm <= 0) return 0;
  
  const rates = getPerSqmRates(totalSqm);
  
  // Calculate weighted fees for each category
  const baselineFee = getTaskWeightedCategoryFee(tasks, 'baseline', totalSqm, rates);
  const interiorsFee = getTaskWeightedCategoryFee(tasks, 'addon-interiors', totalSqm, rates);
  const masterplanFee = getTaskWeightedCategoryFee(tasks, 'addon-masterplan', totalSqm, rates);
  
  return baselineFee + interiorsFee + masterplanFee;
};

export const useServiceFactor = (tasks: Task[]): number => {
  if (!Array.isArray(tasks)) return 0;
  
  return tasks
    .filter(task => task.included)
    .reduce((sum, task) => {
      const complexityMultiplier = useTaskComplexityMultiplier(task.complexity);
      return sum + (task.weight * complexityMultiplier);
    }, 0);
};

export const useDwellingFee = (
  dwelling: Dwelling,
  tasks: Task[],
  totalProjectArea: number
): number => {
  if (!tasks || !Array.isArray(tasks)) return 0;
  
  // Calculate the base fee using the new per-sqm rates
  const baseFee = useBaseFee(totalProjectArea, tasks);
  const complexityMultiplier = useComplexityMultiplier(dwelling.complexity);
  
  // Calculate dwelling fee as a proportion of the total base fee based on square meters
  const dwellingProportion = totalProjectArea > 0 ? dwelling.size / totalProjectArea : 0;
  
  return baseFee * dwellingProportion * complexityMultiplier;
};

export const useTotalFee = (
  dwellings: Dwelling[],
  tasks: Task[]
): number => {
  if (!dwellings || !Array.isArray(dwellings) || !tasks || !Array.isArray(tasks)) return 0;
  
  const totalProjectArea = useTotalProjectArea(dwellings);
  
  return dwellings.reduce((sum, dwelling) => {
    return sum + useDwellingFee({...dwelling}, tasks, totalProjectArea);
  }, 0);
};

export const useCalculateFees = (
  dwellings: Dwelling[],
  tasks: Task[]
): { dwellingsWithFees: Dwelling[], totalFee: number, totalProjectArea: number } => {
  return useMemo(() => {
    // Ensure dwellings and tasks are arrays
    const safelyTypedDwellings = Array.isArray(dwellings) ? dwellings : [];
    const safelyTypedTasks = Array.isArray(tasks) ? tasks : [];
    
    // Get the total project area
    const totalProjectArea = useTotalProjectArea(safelyTypedDwellings);
    
    const dwellingsWithFees = safelyTypedDwellings.map(dwelling => ({
      ...dwelling,
      fee: useDwellingFee(dwelling, safelyTypedTasks, totalProjectArea),
    }));
    
    const totalFee = dwellingsWithFees.reduce((sum, dwelling) => sum + dwelling.fee, 0);
    
    return { dwellingsWithFees, totalFee, totalProjectArea };
  }, [dwellings, tasks]);
};

// Utility function for formatting numeric values
export const useFormattedValue = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
};
