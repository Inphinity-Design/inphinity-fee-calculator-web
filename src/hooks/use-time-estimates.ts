
import { useMemo } from "react";
import { Dwelling, TimeEstimateResult, Task, TaskBreakdownItem } from "@/types/calculator";

export const useTimeEstimates = (
  dwellings: Dwelling[],
  tasks: Task[],
  totalProjectFee: number,
  hourlyRate: number
): TimeEstimateResult => {
  return useMemo(() => {
    // Ensure valid inputs
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeHourlyRate = hourlyRate > 0 ? hourlyRate : 150;
    const safeTotalFee = totalProjectFee > 0 ? totalProjectFee : 0;

    // PRIMARY CALCULATION: Simple and intuitive
    const totalEstimatedHours = safeHourlyRate > 0 ? safeTotalFee / safeHourlyRate : 0;

    // Calculate total task weight for proportional breakdown
    const includedTasks = safeTasks.filter(t => t.included);
    const totalWeight = includedTasks.reduce((sum, task) => sum + task.weight, 0);

    // SECONDARY BREAKDOWN: Task-by-task detail
    const taskBreakdown: TaskBreakdownItem[] = includedTasks.map(task => {
      // Calculate proportion of hours based on task weight
      const taskProportion = totalWeight > 0 ? task.weight / totalWeight : 0;
      const estimatedHours = totalEstimatedHours * taskProportion;
      const estimatedCost = estimatedHours * safeHourlyRate;

      return {
        taskId: task.id,
        taskName: task.name,
        weight: task.weight,
        complexity: task.complexity,
        estimatedHours,
        estimatedCost
      };
    });

    // For backwards compatibility, calculate dwelling estimates if needed
    const safeDwellings = Array.isArray(dwellings) ? dwellings : [];
    const dwellingsWithTimeEstimates = safeDwellings.map(dwelling => ({
      ...dwelling,
      timeEstimate: totalEstimatedHours,
      cappedHours: totalEstimatedHours,
      hourlyRate: safeHourlyRate
    }));

    return {
      totalEstimatedHours,
      taskBreakdown,
      hourlyRate: safeHourlyRate,
      dwellingsWithTimeEstimates
    };
  }, [dwellings, tasks, totalProjectFee, hourlyRate]);
};
