import { useState } from 'react';
import { TeamMember, TaskAssignment, TeamDistributionSettings, Task, MultiplierSettings, DEFAULT_DWELLING_MULTIPLIERS, DEFAULT_TASK_MULTIPLIERS, DwellingComplexityMultipliers } from '@/types/calculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Clock, Users, Maximize2, Minimize2, LayoutPanelTop, ChevronDown, ChevronRight, Crown, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getPerSqmRates, useTotalProjectArea, useCalculateFees } from '@/hooks/use-fee-calculator';
import { useConsultationCalculator } from '@/hooks/use-consultation-calculator';
import { calculateIncludedConsultantsCost } from '@/hooks/use-consultants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Default weights for each category (used as baseline for fee calculation)
const DEFAULT_CATEGORY_WEIGHTS: Record<string, number> = {
    baseline: 173,
    'addon-interiors': 65,
    'addon-masterplan': 69,
};

// Calculate individual task fee with multipliers
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

interface MemberTaskBreakdown {
    taskName: string;
    role: 'lead' | 'implementer';
    hours: number;
    cost: number;
}

interface CostSummaryPanelProps {
    teamMembers: TeamMember[];
    getMemberCost: (memberId: string) => number;
    getMemberHours: (memberId: string) => { leadHours: number; implementerHours: number; totalHours: number };
    getTotalProjectCost: () => number;
    settings: TeamDistributionSettings;
    onSettingsChange: (settings: Partial<TeamDistributionSettings>) => void;
    fullView?: boolean;
    projectData?: any;
    onMaximize?: () => void;
    onCollapse?: () => void;
    onMoveToSidebar?: () => void;
    // New props for task breakdown
    getMemberTaskBreakdown?: (memberId: string) => MemberTaskBreakdown[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Math.round(amount));
};

const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`;
};

const CostSummaryPanel = ({
    teamMembers,
    getMemberCost,
    getMemberHours,
    getTotalProjectCost,
    settings,
    onSettingsChange,
    fullView,
    projectData,
    onMaximize,
    onCollapse,
    onMoveToSidebar,
    getMemberTaskBreakdown,
}: CostSummaryPanelProps) => {
    // Track expanded state for each team member
    const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

    const toggleMemberExpanded = (memberId: string) => {
        setExpandedMembers(prev => {
            const next = new Set(prev);
            if (next.has(memberId)) {
                next.delete(memberId);
            } else {
                next.add(memberId);
            }
            return next;
        });
    };

    // Calculate Project Fee correctly using multiplier settings
    const dwellings = projectData?.dwellings || [];
    const tasks = projectData?.tasks || [];
    const multiplierSettings = projectData?.multiplierSettings;
    const consultants = projectData?.consultants || [];

    // Get total project area
    const totalProjectArea = dwellings.reduce((sum: number, d: any) => sum + (d.size || 0), 0);
    const dwelling = dwellings[0];
    const dwellingComplexity = dwelling?.complexity || 3;

    // Get per-sqm rates
    const rates = getPerSqmRates(totalProjectArea);

    // Calculate task fees with multipliers
    const calculatedTotalFee = tasks
        .filter((task: Task) => task.included)
        .reduce((sum: number, task: Task) => {
            return sum + calculateTaskFee(task, totalProjectArea, rates, dwellingComplexity, multiplierSettings);
        }, 0);

    // Get consultation fee
    const { totalConsultationFee } = useConsultationCalculator(
        projectData?.consultationEstimate
    );

    // Get included consultants cost
    const includedConsultantsCost = calculateIncludedConsultantsCost(consultants);

    // Total project fee (matches FeeSummaryPanel calculation)
    const totalProjectFee = calculatedTotalFee + totalConsultationFee + includedConsultantsCost;
    const totalTeamFees = getTotalProjectCost();
    const netProfit = totalProjectFee - totalTeamFees;
    return (
        <Card className={cn("h-fit", !fullView && "sticky top-4")}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <DollarSign className="h-5 w-5 text-primary" />
                    {fullView ? 'Detailed Cost Breakdown' : 'Cost Summary'}
                </CardTitle>
                <div className="flex items-center gap-1">
                    {!fullView && onMaximize && (
                        <Button variant="ghost" size="sm" onClick={onMaximize} className="h-8 w-8 p-0 text-muted-foreground hover:text-white">
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    )}
                    {!fullView && onCollapse && (
                        <Button variant="ghost" size="sm" onClick={onCollapse} className="h-8 w-8 p-0 text-muted-foreground hover:text-white">
                            <Minimize2 className="h-4 w-4" />
                        </Button>
                    )}
                    {fullView && onMoveToSidebar && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onMoveToSidebar}
                            className="h-8 gap-2 bg-white/5 border-white/10 text-xs text-muted-foreground hover:text-white"
                        >
                            <LayoutPanelTop className="h-4 w-4" />
                            MOVE TO SIDEBAR
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Top Row: Settings & Grant Total in Full View */}
                <div className={cn("grid gap-6", fullView ? "lg:grid-cols-2" : "grid-cols-1")}>
                    {/* Settings */}
                    <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
                        <h4 className="text-sm font-medium text-muted-foreground">Lead/Implementer Split</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="lead-pct" className="text-xs text-muted-foreground uppercase tracking-wider">Lead %</Label>
                                <Input
                                    id="lead-pct"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={settings.leadPercentage}
                                    onChange={(e) => {
                                        const lead = parseInt(e.target.value) || 0;
                                        onSettingsChange({
                                            leadPercentage: lead,
                                            implementerPercentage: 100 - lead
                                        });
                                    }}
                                    className="h-9 bg-black/20 border-white/10"
                                />
                            </div>
                            <div>
                                <Label htmlFor="implementer-pct" className="text-xs text-muted-foreground uppercase tracking-wider">Implementer %</Label>
                                <Input
                                    id="implementer-pct"
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={settings.implementerPercentage}
                                    onChange={(e) => {
                                        const implementer = parseInt(e.target.value) || 0;
                                        onSettingsChange({
                                            implementerPercentage: implementer,
                                            leadPercentage: 100 - implementer
                                        });
                                    }}
                                    className="h-9 bg-black/20 border-white/10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fees & Profit Summary */}
                    <div className={cn("space-y-4", fullView ? "lg:col-span-1" : "")}>
                        {/* Total Team Fees (Redesigned) */}
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-bold block">Total Team Fees</span>
                            <span className="text-2xl font-black text-amber-500 tracking-tight">
                                {formatCurrency(totalTeamFees)}
                            </span>
                        </div>

                        {fullView && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-bold block">Total Project Fee</span>
                                    <span className="text-xl font-bold text-white tracking-tight">
                                        {formatCurrency(totalProjectFee)}
                                    </span>
                                </div>
                                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-bold block">Net Profit</span>
                                    <span className="text-xl font-black text-green-500 tracking-tight">
                                        {formatCurrency(netProfit)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {!fullView && projectData && (
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground font-medium uppercase tracking-wider">Net Profit</span>
                                    <span className={cn("font-bold", netProfit >= 0 ? "text-green-500" : "text-red-500")}>
                                        {formatCurrency(netProfit)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <Separator className="opacity-10" />

                {/* Team Members Breakdown */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 px-1">
                        <Users className="h-4 w-4" />
                        Team Costs Breakdown
                    </h4>

                    {teamMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic p-4 text-center border border-dashed border-white/10 rounded-lg">
                            No team members added yet
                        </p>
                    ) : (
                        <div className={cn("grid gap-4", fullView ? "md:grid-cols-2" : "grid-cols-1")}>
                            {teamMembers.map((member) => {
                                const cost = getMemberCost(member.id);
                                const hours = getMemberHours(member.id);
                                const taskBreakdown = getMemberTaskBreakdown?.(member.id) || [];
                                const isExpanded = expandedMembers.has(member.id);

                                return (
                                    <div key={member.id} className="rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all overflow-hidden">
                                        {/* Main member info */}
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-base text-white">{member.name}</span>
                                                    <span className="text-xs text-muted-foreground">${member.hourlyRate}/hr</span>
                                                </div>
                                                <span className="text-xl font-bold text-primary">
                                                    {formatCurrency(cost)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                                    <Clock className="h-3 w-3" />
                                                    {formatHours(hours.totalHours)} total
                                                </span>
                                            </div>

                                            <div className="flex gap-2">
                                                <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 border-none">
                                                    Lead: {formatHours(hours.leadHours)}
                                                </Badge>
                                                <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-500 border-none">
                                                    Implementer: {formatHours(hours.implementerHours)}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Expandable task breakdown */}
                                        {taskBreakdown.length > 0 && (
                                            <Collapsible open={isExpanded} onOpenChange={() => toggleMemberExpanded(member.id)}>
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full h-8 rounded-none border-t border-white/5 text-xs text-muted-foreground hover:text-white hover:bg-white/5 flex items-center justify-center gap-2"
                                                    >
                                                        {isExpanded ? (
                                                            <>
                                                                <ChevronDown className="h-3 w-3" />
                                                                Hide Task Details
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronRight className="h-3 w-3" />
                                                                Show Task Details ({taskBreakdown.length} tasks)
                                                            </>
                                                        )}
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <div className="px-4 pb-4 space-y-2 bg-black/20">
                                                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold pt-3 pb-1">
                                                            Task Allocations
                                                        </div>
                                                        {taskBreakdown.map((task, idx) => (
                                                            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                                                                <div className="flex items-center gap-2">
                                                                    {task.role === 'lead' ? (
                                                                        <Crown className="h-3 w-3 text-amber-500" />
                                                                    ) : (
                                                                        <Wrench className="h-3 w-3 text-blue-500" />
                                                                    )}
                                                                    <span className="text-xs text-white/80">{task.taskName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {formatHours(task.hours)}
                                                                    </span>
                                                                    <span className={cn(
                                                                        "text-xs font-semibold min-w-[60px] text-right",
                                                                        task.role === 'lead' ? "text-amber-500" : "text-blue-500"
                                                                    )}>
                                                                        {formatCurrency(task.cost)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CostSummaryPanel;
