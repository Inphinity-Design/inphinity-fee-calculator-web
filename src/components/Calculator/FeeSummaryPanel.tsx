import { useState, useMemo } from "react";
import { Download, Clock, ChevronDown, ChevronUp, Users, Briefcase, TrendingUp, Info } from "lucide-react";
import {
  ProjectData,
  Task,
  Dwelling,
  TeamDistributionState,
  SubTask,
  MultiplierSettings,
  DEFAULT_DWELLING_MULTIPLIERS,
  DEFAULT_TASK_MULTIPLIERS,
  DwellingComplexityMultipliers,
  TaskComplexityMultipliers,
} from "@/types/calculator";
import {
  useCalculateFees,
  getPerSqmRates,
  useTotalProjectArea,
  getTaskWeightedCategoryFee
} from "@/hooks/use-fee-calculator";
import { getScalingMultiplier } from "@/utils/scaling-utils";
import { useConsultationCalculator } from "@/hooks/use-consultation-calculator";
import { useTimeEstimates } from "@/hooks/use-time-estimates";
import { calculateTotalConsultantsCost, calculateIncludedConsultantsCost } from "@/hooks/use-consultants";
import { parentTaskGroups, getGroupBaseHours } from "@/data/sub-task-data";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { generatePDF } from "@/utils/pdf-generator";
import { toast } from "@/components/ui/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FeeSummaryPanelProps {
  projectData: ProjectData;
  setProjectData: React.Dispatch<React.SetStateAction<ProjectData>>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

const formatHours = (hours: number): string => {
  return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
};

// Helper function to calculate team costs from saved team distribution state
const calculateTeamCosts = (
  teamDistribution: TeamDistributionState | undefined,
  tasks: Task[],
  sizeMultiplier: number = 1
): number => {
  if (!teamDistribution || !teamDistribution.teamMembers?.length) return 0;

  const { teamMembers, assignments, settings, customDistributions, customHours } = teamDistribution;

  // Create task weight map
  const taskWeightMap: Record<string, number> = {};
  tasks.forEach(task => {
    if (task.included) {
      taskWeightMap[task.id] = task.weight;
    }
  });

  // Get all sub-tasks
  const allSubTasks = parentTaskGroups.flatMap(group => group.subTasks);

  // Helper to get scaled hours for a sub-task
  const getScaledHours = (subTask: SubTask): number => {
    // Check for custom hours override
    const customOverride = customHours?.find(ch => ch.subTaskId === subTask.id);
    if (customOverride) {
      return customOverride.customHours;
    }

    // Calculate scaled hours
    const group = parentTaskGroups.find(g => g.appTaskId === subTask.parentTaskId);
    if (!group) return subTask.baseHours;

    const appWeight = taskWeightMap[group.appTaskId];
    if (!appWeight) return 0;

    const baseHours = getGroupBaseHours(group);
    if (baseHours === 0) return 0;

    // Apply scaling multiplier to the app weight (matching the hook logic)
    const scaledAppWeight = appWeight * sizeMultiplier;
    return subTask.baseHours * (scaledAppWeight / baseHours);
  };

  // Helper to normalize role (support old 'doer' -> 'implementer')
  const normalizeRole = (role: string): 'lead' | 'implementer' => {
    if (role === 'doer') return 'implementer';
    return role as 'lead' | 'implementer';
  };

  // Helper to get distribution share
  const getMemberDistributionShare = (subTaskId: string, role: 'lead' | 'implementer', memberId: string): number => {
    // Match both old 'doer' and new 'implementer' roles
    const roleAssignees = assignments.filter(a =>
      a.subTaskId === subTaskId && normalizeRole(a.role) === role
    );
    if (roleAssignees.length === 0) return 0;
    if (roleAssignees.length === 1) return 1;

    const customWeights = customDistributions?.filter(
      d => d.subTaskId === subTaskId && normalizeRole(d.role) === role
    ) || [];

    if (customWeights.length > 0) {
      const memberWeight = customWeights.find(w => w.teamMemberId === memberId)?.weight || 1;
      const totalWeight = customWeights.reduce((sum, w) => sum + w.weight, 0);
      if (totalWeight === 0) return 1 / roleAssignees.length;
      return memberWeight / totalWeight;
    }

    return 1 / roleAssignees.length;
  };

  // Calculate total cost
  let totalCost = 0;
  teamMembers.forEach(member => {
    const memberAssignments = assignments.filter(a => a.teamMemberId === member.id);

    memberAssignments.forEach(assignment => {
      const subTask = allSubTasks.find(st => st.id === assignment.subTaskId);
      if (!subTask) return;

      const scaledHours = getScaledHours(subTask);
      // Support both old doerPercentage and new implementerPercentage field names
      const implementerPct = (settings as any).implementerPercentage ?? (settings as any).doerPercentage ?? 80;
      const normalizedRole = normalizeRole(assignment.role);
      const rolePercentage = normalizedRole === 'lead'
        ? (settings.leadPercentage || 20) / 100
        : implementerPct / 100;

      const distributionShare = getMemberDistributionShare(
        assignment.subTaskId,
        normalizedRole,
        member.id
      );

      totalCost += scaledHours * rolePercentage * distributionShare * member.hourlyRate;
    });
  });

  return totalCost;
};

// Default weights for each category (used as baseline for fee calculation)
const DEFAULT_CATEGORY_WEIGHTS: Record<string, number> = {
  baseline: 173,
  'addon-interiors': 65,
  'addon-masterplan': 69,
};

// Calculate individual task fee
const calculateTaskFee = (
  task: Task,
  totalSqm: number,
  rates: { baseline: number; interiors: number; masterplan: number },
  dwellingComplexity: number,
  multiplierSettings?: MultiplierSettings
): number => {
  if (!task.included || totalSqm <= 0) return 0;

  const rate = task.category === 'baseline' ? rates.baseline
    : task.category === 'addon-interiors' ? rates.interiors
    : rates.masterplan;

  const defaultWeight = DEFAULT_CATEGORY_WEIGHTS[task.category] || 100;

  // Use configurable multipliers or fall back to defaults
  const taskMultipliers = multiplierSettings?.taskComplexity || DEFAULT_TASK_MULTIPLIERS;
  const dwellingMultipliers = multiplierSettings?.dwellingComplexity || DEFAULT_DWELLING_MULTIPLIERS;

  const taskComplexityMult = taskMultipliers[task.complexity] || 1.0;
  const dwellingComplexityMult = dwellingMultipliers[dwellingComplexity as keyof DwellingComplexityMultipliers] || 1.0;

  return (task.weight / defaultWeight) * totalSqm * rate * taskComplexityMult * dwellingComplexityMult;
};

// Short task names for display
const getShortTaskName = (name: string): string => {
  const shortNames: Record<string, string> = {
    'Land Evaluation and Site Analysis': 'Land Evaluation',
    'Consultant & Contractors Research': 'Consultant Research',
    'Design Ideation': 'Design Ideation',
    'Design Testing & Refinement': 'Design Testing',
    'Visualization': 'Visualization',
    'Masterplan': 'Masterplan',
    'Interior Design': 'Interior Design',
  };
  return shortNames[name] || name;
};

const FeeSummaryPanel = ({ projectData, setProjectData }: FeeSummaryPanelProps) => {
  const [exporting, setExporting] = useState(false);
  const [showRates, setShowRates] = useState(true);
  const [showTime, setShowTime] = useState(false);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showServices, setShowServices] = useState(true);

  const validProjectData = {
    ...projectData,
    dwellings: Array.isArray(projectData.dwellings) ? projectData.dwellings : [],
    tasks: Array.isArray(projectData.tasks) ? projectData.tasks : [],
  };

  const { dwellingsWithFees, totalFee, totalProjectArea } = useCalculateFees(
    validProjectData.dwellings,
    validProjectData.tasks
  );

  const { totalConsultationFee, hourlyRate: consultationHourlyRate, hours } = useConsultationCalculator(
    validProjectData.consultationEstimate
  );

  const rates = getPerSqmRates(totalProjectArea);

  // Calculate task-weighted service fees (responds to individual task toggles and complexity)
  const baselineFee = getTaskWeightedCategoryFee(validProjectData.tasks, 'baseline', totalProjectArea, rates);
  const interiorsFee = getTaskWeightedCategoryFee(validProjectData.tasks, 'addon-interiors', totalProjectArea, rates);
  const masterplanFee = getTaskWeightedCategoryFee(validProjectData.tasks, 'addon-masterplan', totalProjectArea, rates);

  // Check if any tasks are included per category
  const baselineEnabled = validProjectData.tasks.some(t => t.category === 'baseline' && t.included);
  const interiorsEnabled = validProjectData.tasks.some(t => t.category === 'addon-interiors' && t.included);
  const masterplanEnabled = validProjectData.tasks.some(t => t.category === 'addon-masterplan' && t.included);

  const dwelling = dwellingsWithFees[0];
  const dwellingComplexity = dwelling?.complexity || 3;

  // Get multiplier settings from project data or use defaults
  const multiplierSettings = projectData.multiplierSettings;
  const dwellingMultipliers = multiplierSettings?.dwellingComplexity || DEFAULT_DWELLING_MULTIPLIERS;

  const complexityMultiplier = dwellingMultipliers[dwellingComplexity as keyof DwellingComplexityMultipliers] || 1.0;

  // Calculate project size scaling multiplier
  const sizeMultiplier = useMemo(() => {
    const area = totalProjectArea > 0 ? totalProjectArea : 100;
    return getScalingMultiplier(area, projectData.multiplierSettings?.projectSizeScaling);
  }, [totalProjectArea, projectData.multiplierSettings]);

  // Calculate consultant costs
  const consultants = projectData.consultants || [];
  const totalConsultantsCost = calculateTotalConsultantsCost(consultants);
  const includedConsultantsCost = calculateIncludedConsultantsCost(consultants);

  // Calculate team costs
  const teamCosts = useMemo(() =>
    calculateTeamCosts(projectData.teamDistribution, validProjectData.tasks, sizeMultiplier),
    [projectData.teamDistribution, validProjectData.tasks, sizeMultiplier]
  );

  // Total expenses (what you pay out)
  const totalExpenses = teamCosts + totalConsultantsCost;

  // Calculate individual task fees (maintain original task order)
  const taskFees = useMemo(() => {
    return validProjectData.tasks
      .filter(task => task.included)
      .map(task => ({
        task,
        fee: calculateTaskFee(task, totalProjectArea, rates, dwellingComplexity, multiplierSettings)
      }));
  }, [validProjectData.tasks, totalProjectArea, rates, dwellingComplexity, multiplierSettings]);

  // Calculate total fee from taskFees (this respects the configurable multipliers)
  const calculatedTotalFee = useMemo(() => {
    return taskFees.reduce((sum, { fee }) => sum + fee, 0);
  }, [taskFees]);

  // Total fee includes consultants that are marked to include in project fee
  // Using calculatedTotalFee which respects configurable multipliers
  const combinedTotalFee = calculatedTotalFee + totalConsultationFee + includedConsultantsCost;

  // Get studio hourly rate (use consultation rate or default to 150)
  const studioHourlyRate = validProjectData.consultationEstimate?.hourlyRate || 150;

  // Calculate time estimates AFTER combinedTotalFee is calculated
  const { totalEstimatedHours, taskBreakdown, hourlyRate } = useTimeEstimates(
    dwellingsWithFees,
    validProjectData.tasks,
    combinedTotalFee,  // Total project fee (now defined)
    studioHourlyRate   // Studio hourly rate
  );

  // Net profit (recalculated with the correct total fee)
  const netProfit = combinedTotalFee - totalExpenses;

  const tasksArray = Array.isArray(validProjectData.tasks) ? validProjectData.tasks : [];
  const includedTasksCount = tasksArray.filter(task => task.included).length;

  const hasRequiredFields =
    validProjectData.clientName?.trim() &&
    validProjectData.projectName?.trim() &&
    validProjectData.date !== undefined &&
    validProjectData.dwellings.length > 0 &&
    includedTasksCount > 0;

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await generatePDF(
        validProjectData,
        dwellingsWithFees, // Fixed: Using dwellingsWithFees instead of undefined dwellingsWithTimeEstimates
        totalFee, 
        totalConsultationFee
      );
      
      toast({ description: "PDF proposal exported successfully." });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error generating the PDF proposal.",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="text-center pb-4 border-b">
        <p className="text-sm text-muted-foreground">Total Project Fee</p>
        <h2 className="text-3xl font-bold text-primary">{formatCurrency(combinedTotalFee)}</h2>
        {totalProjectArea > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {totalProjectArea} sqm • {formatCurrency(combinedTotalFee / totalProjectArea)}/sqm
          </p>
        )}
      </div>

      {/* Fee Breakdown */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {/* Service Fees - Individual Tasks */}
        <Collapsible open={showServices} onOpenChange={setShowServices}>
          <CollapsibleTrigger className="flex w-full justify-between items-center py-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Services</h3>
            {showServices ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-2">
            {taskFees.map(({ task, fee }) => (
              <div key={task.id} className="flex justify-between items-center text-sm py-0.5">
                <span className="text-muted-foreground truncate max-w-[140px]" title={task.name}>
                  {getShortTaskName(task.name)}
                  {task.complexity !== 'normal' && (
                    <span className="text-xs ml-1 opacity-60">
                      ({task.complexity === 'high' ? '↑' : '↓'})
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs">{formatCurrency(fee)}</span>
              </div>
            ))}

            {taskFees.length > 0 && (totalConsultationFee > 0 || includedConsultantsCost > 0) && (
              <Separator className="my-2" />
            )}

            {totalConsultationFee > 0 && (
              <div className="flex justify-between items-center text-sm py-0.5">
                <span className="text-muted-foreground">Consultation</span>
                <span className="font-mono text-xs">{formatCurrency(totalConsultationFee)}</span>
              </div>
            )}

            {includedConsultantsCost > 0 && (
              <div className="flex justify-between items-center text-sm py-0.5">
                <span className="text-muted-foreground">3rd Party Consultants</span>
                <span className="font-mono text-xs">{formatCurrency(includedConsultantsCost)}</span>
              </div>
            )}

            {taskFees.length === 0 && totalConsultationFee === 0 && includedConsultantsCost === 0 && (
              <p className="text-xs text-muted-foreground italic">No services selected</p>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Rates Section */}
        <Collapsible open={showRates} onOpenChange={setShowRates}>
          <CollapsibleTrigger className="flex w-full justify-between items-center py-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Per-SQM Rates</h3>
            {showRates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-2">
            <div className="flex justify-between text-sm">
              <span>Baseline:</span>
              <span className="font-mono">{formatCurrency(rates.baseline)}/sqm</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Interiors:</span>
              <span className="font-mono">{formatCurrency(rates.interiors)}/sqm</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Masterplan:</span>
              <span className="font-mono">{formatCurrency(rates.masterplan)}/sqm</span>
            </div>
            {dwelling && (
              <div className="flex justify-between text-sm pt-2 border-t mt-2">
                <span>Complexity:</span>
                <span className="font-mono">{complexityMultiplier}x</span>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Time Estimates */}
        <Collapsible open={showTime} onOpenChange={setShowTime}>
          <CollapsibleTrigger className="flex w-full justify-between items-center py-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Estimates
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <div className="space-y-2">
                      <p className="font-semibold">How Time Estimates are Calculated:</p>
                      <p className="text-sm">
                        <strong>Total Hours</strong> = Total Project Fee ÷ Hourly Rate
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Example: {formatCurrency(combinedTotalFee)} ÷ {formatCurrency(hourlyRate)}/hr = {formatHours(totalEstimatedHours)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Expand to see task-by-task hour breakdown based on task weights.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
            {showTime ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pt-2">
            <div className="flex justify-between text-sm">
              <span>Total Hours:</span>
              <span className="font-mono font-semibold">{formatHours(totalEstimatedHours)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Hourly Rate:</span>
              <span className="font-mono">{formatCurrency(hourlyRate)}/hr</span>
            </div>

            {/* Task Breakdown */}
            {taskBreakdown.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Task Breakdown</p>
                {taskBreakdown.map(task => (
                  <div key={task.taskId} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{task.taskName}</span>
                    <div className="flex gap-3">
                      <span className="font-mono">{formatHours(task.estimatedHours)}</span>
                      <span className="font-mono text-muted-foreground w-20 text-right">{formatCurrency(task.estimatedCost)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Expenses & Profit Section */}
        <Collapsible open={showExpenses} onOpenChange={setShowExpenses}>
          <CollapsibleTrigger className="flex w-full justify-between items-center py-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Expenses & Profit
            </h3>
            {showExpenses ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {teamCosts > 0 && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Team Fees:
                </span>
                <span className="font-mono text-amber-500">{formatCurrency(teamCosts)}</span>
              </div>
            )}
            {totalConsultantsCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  3rd Party Consultants:
                </span>
                <span className="font-mono text-orange-500">{formatCurrency(totalConsultantsCost)}</span>
              </div>
            )}
            {totalExpenses > 0 && (
              <>
                <div className="flex justify-between text-sm pt-1 border-t">
                  <span className="font-medium">Total Expenses:</span>
                  <span className="font-mono font-medium">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="font-bold">Net Profit:</span>
                  <span className={`font-mono font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(netProfit)}
                  </span>
                </div>
              </>
            )}
            {totalExpenses === 0 && (
              <p className="text-xs text-muted-foreground italic">
                Add team members or consultants to see profit calculation
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Project Info Summary */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Client:</span>
            <span className="truncate max-w-[150px]">{projectData.clientName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Project:</span>
            <span className="truncate max-w-[150px]">{projectData.projectName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tasks:</span>
            <span>{includedTasksCount} selected</span>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="pt-4 border-t mt-auto">
        <Button 
          onClick={handleExportPDF} 
          disabled={!hasRequiredFields || exporting}
          className="w-full"
        >
          {exporting ? (
            <>
              <span className="animate-spin mr-2">◌</span>
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Proposal
            </>
          )}
        </Button>
        {!hasRequiredFields && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Complete project info & add dwelling to export
          </p>
        )}
      </div>
    </div>
  );
};

export default FeeSummaryPanel;
