import { useState, useEffect } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Assignee {
    memberId: string;
    memberName: string;
    memberHourlyRate: number;
    weight: number;
}

interface DistributionPopoverProps {
    subTaskId: string;
    role: 'lead' | 'implementer';
    assignees: Assignee[];
    totalPercentage: number; // 20 for lead, 80 for implementer
    scaledHours: number; // Total hours for this sub-task
    onUpdateDistribution: (weights: { memberId: string; weight: number }[]) => void;
    isCustom: boolean;
}

const DistributionPopover = ({
    role,
    assignees,
    totalPercentage,
    scaledHours,
    onUpdateDistribution,
    isCustom,
}: DistributionPopoverProps) => {
    const [open, setOpen] = useState(false);
    // Local weights state for UI manipulation (normalized 0-100 scale for first assignee)
    const [localWeights, setLocalWeights] = useState<Record<string, number>>({});

    // Initialize local weights when popover opens or assignees change
    useEffect(() => {
        if (assignees.length >= 2) {
            const totalWeight = assignees.reduce((sum, a) => sum + a.weight, 0);
            const weights: Record<string, number> = {};
            assignees.forEach(a => {
                // Convert to percentage (0-100)
                weights[a.memberId] = totalWeight > 0 ? (a.weight / totalWeight) * 100 : 100 / assignees.length;
            });
            setLocalWeights(weights);
        }
    }, [assignees, open]);

    if (assignees.length < 2) return null;

    // Calculate total weight
    const totalLocalWeight = Object.values(localWeights).reduce((sum, w) => sum + w, 0);

    // Get percentage for a member
    const getPercentage = (memberId: string): number => {
        if (totalLocalWeight === 0) return 100 / assignees.length;
        return (localWeights[memberId] || 0);
    };

    // Get actual task percentage (percentage of total hours)
    const getActualPercentage = (memberId: string): number => {
        const share = getPercentage(memberId) / 100;
        return share * totalPercentage;
    };

    // Get dollar amount for a member based on their distribution
    const getDollarAmount = (memberId: string): number => {
        const assignee = assignees.find(a => a.memberId === memberId);
        if (!assignee) return 0;

        const share = getPercentage(memberId) / 100;
        const rolePercentage = totalPercentage / 100;
        const hours = scaledHours * rolePercentage * share;
        return hours * assignee.memberHourlyRate;
    };

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Handle slider change for a member
    // When one slider changes, adjust others proportionally
    const handleSliderChange = (memberId: string, newValue: number) => {
        const otherAssignees = assignees.filter(a => a.memberId !== memberId);
        const remainingPercentage = 100 - newValue;

        // Distribute remaining percentage equally among others
        const perOther = remainingPercentage / otherAssignees.length;

        const newWeights: Record<string, number> = {
            [memberId]: newValue,
        };
        otherAssignees.forEach(a => {
            newWeights[a.memberId] = perOther;
        });

        setLocalWeights(newWeights);
    };

    // Apply changes
    const handleApply = () => {
        // Convert percentages to weights (can use raw percentages as weights)
        const weights = assignees.map(a => ({
            memberId: a.memberId,
            weight: localWeights[a.memberId] || 0,
        }));
        onUpdateDistribution(weights);
        setOpen(false);
    };

    // Reset to equal distribution
    const handleReset = () => {
        const equalWeight = 100 / assignees.length;
        const weights: Record<string, number> = {};
        assignees.forEach(a => {
            weights[a.memberId] = equalWeight;
        });
        setLocalWeights(weights);
        // Apply immediately
        const resetWeights = assignees.map(a => ({
            memberId: a.memberId,
            weight: 1, // Equal weights
        }));
        onUpdateDistribution(resetWeights);
    };

    const roleLabel = role === 'lead' ? 'Lead' : 'Implementer';
    const roleColor = role === 'lead' ? 'text-amber-400' : 'text-blue-400';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-6 w-6 ml-1",
                        isCustom ? "text-amber-400 hover:text-amber-300" : "text-muted-foreground hover:text-foreground"
                    )}
                    title={`Adjust ${roleLabel} distribution`}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                            <span className={roleColor}>{roleLabel}</span> Distribution ({totalPercentage}%)
                        </h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={handleReset}
                        >
                            <RotateCcw className="h-3 w-3" />
                            Reset
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Adjust how the {totalPercentage}% {roleLabel.toLowerCase()} portion is split between team members.
                    </p>

                    <div className="space-y-4">
                        {assignees.map((assignee) => (
                            <div key={assignee.memberId} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium truncate max-w-[100px]">{assignee.memberName}</span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-muted-foreground">
                                            {getPercentage(assignee.memberId).toFixed(0)}%
                                            <span className="text-xs ml-1">
                                                ({getActualPercentage(assignee.memberId).toFixed(1)}% of task)
                                            </span>
                                        </span>
                                        <span className="text-xs font-semibold text-gold">
                                            {formatCurrency(getDollarAmount(assignee.memberId))}
                                        </span>
                                    </div>
                                </div>
                                <Slider
                                    value={[getPercentage(assignee.memberId)]}
                                    onValueChange={(values) => handleSliderChange(assignee.memberId, values[0])}
                                    min={0}
                                    max={100}
                                    step={5}
                                    className="cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleApply}>
                            Apply
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default DistributionPopover;
