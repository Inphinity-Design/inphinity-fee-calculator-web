import { useState, useRef } from 'react';
import { Task, TeamMember, TaskAssignment, SubTask, ParentTaskGroup, TeamDistributionSettings } from '@/types/calculator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronRight, ChevronDown, X, Crown, Wrench, Clock, Settings2, Lock, Unlock, RotateCcw, Camera, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TaskComplexity } from '@/types/calculator';
import DistributionPopover from './DistributionPopover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeamDistributionMatrixProps {
    parentTaskGroups: ParentTaskGroup[];
    teamMembers: TeamMember[];
    assignments: TaskAssignment[];
    settings: TeamDistributionSettings;
    getScaledHours: (subTask: SubTask) => number;
    getSubTaskAssignments: (subTaskId: string) => TaskAssignment[];
    toggleAssignment: (subTaskId: string, teamMemberId: string, role: 'lead' | 'implementer') => void;
    onRemoveMember: (id: string) => void;
    onUpdateMember?: (id: string, updates: Partial<TeamMember>) => void;
    appTasks: Task[];
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
    // Distribution-related props
    getRoleAssignees: (subTaskId: string, role: 'lead' | 'implementer') => TaskAssignment[];
    updateDistribution: (subTaskId: string, role: 'lead' | 'implementer', weights: { memberId: string; weight: number }[]) => void;
    hasCustomDistribution: (subTaskId: string, role: 'lead' | 'implementer') => boolean;
    getMemberDistributionShare: (subTaskId: string, role: 'lead' | 'implementer', memberId: string) => number;
    // Custom hours-related props
    setCustomHours: (subTaskId: string, hours: number) => void;
    clearCustomHours: (subTaskId: string) => void;
    hasCustomHours: (subTaskId: string) => boolean;
}

// Helper to get initials from name
const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const formatHours = (hours: number) => {
    if (hours === 0) return '-';
    return `${hours.toFixed(1)}h`;
};

const formatCurrency = (value: number) => {
    if (value === 0) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value);
};

const TeamDistributionMatrix = ({
    parentTaskGroups,
    teamMembers,
    assignments,
    settings,
    getScaledHours,
    getSubTaskAssignments,
    toggleAssignment,
    onRemoveMember,
    onUpdateMember,
    appTasks,
    onUpdateTask,
    getRoleAssignees,
    updateDistribution,
    hasCustomDistribution,
    getMemberDistributionShare,
    setCustomHours,
    clearCustomHours,
    hasCustomHours,
}: TeamDistributionMatrixProps) => {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [hoursLocked, setHoursLocked] = useState(true);

    // Check if any sub-tasks have custom hours
    const hasAnyCustomHours = parentTaskGroups.some(group =>
        group.subTasks.some(subTask => hasCustomHours(subTask.id))
    );

    // Reset all custom hours
    const handleResetAllHours = () => {
        parentTaskGroups.forEach(group => {
            group.subTasks.forEach(subTask => {
                if (hasCustomHours(subTask.id)) {
                    clearCustomHours(subTask.id);
                }
            });
        });
    };

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    const isTaskIncluded = (appTaskId: string) => {
        const task = appTasks.find(t => t.id === appTaskId);
        return task?.included ?? false;
    };

    // Filter to only show included parent task groups
    const activeGroups = parentTaskGroups.filter(g => isTaskIncluded(g.appTaskId));

    if (teamMembers.length === 0) {
        return (
            <div className="border rounded-lg p-8 text-center text-muted-foreground bg-card/50">
                <p className="text-lg mb-2">No team members added yet</p>
                <p className="text-sm">Add team members using the button above to start assigning tasks.</p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden bg-card/50">
            <div className="overflow-x-auto">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            {/* Task Column - wider for full task names */}
                            <TableHead className="w-[400px] min-w-[400px] sticky left-0 bg-muted/50 z-10">
                                Task / Sub-task
                            </TableHead>
                            <TableHead className="w-[120px] min-w-[120px] text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <span>Hours</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 hover:text-gold"
                                        onClick={() => setHoursLocked(!hoursLocked)}
                                        title={hoursLocked ? "Unlock to edit hours" : "Lock hours"}
                                    >
                                        {hoursLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                    </Button>
                                    {hasAnyCustomHours && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 text-amber-400 hover:text-amber-300"
                                                        onClick={handleResetAllHours}
                                                    >
                                                        <RotateCcw className="h-3 w-3" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Reset all custom hours
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </TableHead>
                            {teamMembers.map(member => {
                                // Bulk assign functions for this member
                                const bulkAssignAsLead = () => {
                                    activeGroups.forEach(group => {
                                        group.subTasks.forEach(subTask => {
                                            const currentAssignments = getSubTaskAssignments(subTask.id);
                                            const isAlreadyLead = currentAssignments.some(a => a.teamMemberId === member.id && a.role === 'lead');
                                            if (!isAlreadyLead) {
                                                toggleAssignment(subTask.id, member.id, 'lead');
                                            }
                                        });
                                    });
                                };

                                const bulkAssignAsImplementer = () => {
                                    activeGroups.forEach(group => {
                                        group.subTasks.forEach(subTask => {
                                            const currentAssignments = getSubTaskAssignments(subTask.id);
                                            const isAlreadyImplementer = currentAssignments.some(a => a.teamMemberId === member.id && a.role === 'implementer');
                                            if (!isAlreadyImplementer) {
                                                toggleAssignment(subTask.id, member.id, 'implementer');
                                            }
                                        });
                                    });
                                };

                                const bulkRemoveAll = () => {
                                    activeGroups.forEach(group => {
                                        group.subTasks.forEach(subTask => {
                                            const currentAssignments = getSubTaskAssignments(subTask.id);
                                            currentAssignments
                                                .filter(a => a.teamMemberId === member.id)
                                                .forEach(a => toggleAssignment(subTask.id, member.id, a.role));
                                        });
                                    });
                                };

                                // File input ref for photo upload
                                const fileInputId = `photo-upload-${member.id}`;

                                const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            onUpdateMember?.(member.id, { photoUrl: reader.result as string });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                };

                                return (
                                    <TableHead key={member.id} className="w-[220px] min-w-[220px] text-center group/member px-4">
                                        <div className="flex flex-col items-center gap-2 py-1">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <div className="flex flex-col items-center gap-1.5 cursor-pointer group/trigger">
                                                        {/* Avatar */}
                                                        <Avatar className="h-24 w-24 border-2 border-white/20 group-hover/trigger:border-gold/50 transition-colors">
                                                            <AvatarImage src={member.photoUrl} alt={member.name} className="object-cover" />
                                                            <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                                                                {getInitials(member.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {/* Name & Role */}
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-semibold text-sm hover:text-gold transition-colors whitespace-nowrap">
                                                                    {member.name}
                                                                </span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-4 w-4 text-muted-foreground hover:text-destructive opacity-0 group-hover/member:opacity-100 transition-opacity"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onRemoveMember(member.id);
                                                                    }}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                            {member.role && (
                                                                <span className="text-[10px] text-muted-foreground">{member.role}</span>
                                                            )}
                                                            <Badge variant="secondary" className="text-[10px] mt-0.5 group-hover/trigger:border-gold/50 transition-colors">
                                                                ${member.hourlyRate}/hr
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-72 p-4 z-50">
                                                    <div className="space-y-4">
                                                        <h4 className="font-bold text-sm uppercase tracking-widest text-gold mb-2">Edit Team Member</h4>

                                                        {/* Photo Upload */}
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-14 w-14 border-2 border-white/20">
                                                                <AvatarImage src={member.photoUrl} alt={member.name} className="object-cover" />
                                                                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                                                    {getInitials(member.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col gap-1">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    id={fileInputId}
                                                                    className="hidden"
                                                                    onChange={handlePhotoUpload}
                                                                />
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 text-xs"
                                                                    onClick={() => document.getElementById(fileInputId)?.click()}
                                                                >
                                                                    <Camera className="h-3 w-3 mr-1" />
                                                                    Upload Photo
                                                                </Button>
                                                                {member.photoUrl && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 text-xs text-muted-foreground hover:text-destructive"
                                                                        onClick={() => onUpdateMember?.(member.id, { photoUrl: undefined })}
                                                                    >
                                                                        Remove Photo
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Display Name</Label>
                                                            <Input
                                                                value={member.name}
                                                                onChange={(e) => onUpdateMember?.(member.id, { name: e.target.value })}
                                                                className="h-8 text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role / Title</Label>
                                                            <Input
                                                                value={member.role || ''}
                                                                placeholder="e.g., Senior Designer"
                                                                onChange={(e) => onUpdateMember?.(member.id, { role: e.target.value })}
                                                                className="h-8 text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hourly Rate ($)</Label>
                                                            <Input
                                                                type="number"
                                                                value={member.hourlyRate}
                                                                onChange={(e) => onUpdateMember?.(member.id, { hourlyRate: parseFloat(e.target.value) || 0 })}
                                                                className="h-8 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>

                                            {/* Bulk Assign Buttons */}
                                            <div className="flex items-center gap-1 mt-1">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-6 px-2 text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                                                                onClick={bulkAssignAsLead}
                                                            >
                                                                <Crown className="h-3 w-3 mr-0.5" />
                                                                All
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Assign as Lead to all tasks</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-6 px-2 text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-500 hover:bg-blue-500/20"
                                                                onClick={bulkAssignAsImplementer}
                                                            >
                                                                <Wrench className="h-3 w-3 mr-0.5" />
                                                                All
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Assign as Implementer to all tasks</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                                onClick={bulkRemoveAll}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Remove from all tasks</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </div>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeGroups.map(group => {
                            const isExpanded = expandedGroups.has(group.id);
                            const groupTotalHours = group.subTasks.reduce(
                                (sum, st) => sum + getScaledHours(st),
                                0
                            );
                            const appTask = appTasks.find(t => t.id === group.appTaskId);

                            return (
                                <Collapsible key={group.id} open={isExpanded} asChild>
                                    <>
                                        {/* Parent Task Row - Enhanced styling for visual differentiation */}
                                        <TableRow
                                            className="bg-emerald-900/40 hover:bg-emerald-900/60 cursor-pointer transition-all select-none group/row border-l-4 border-l-gold/70"
                                            onClick={() => toggleGroup(group.id)}
                                        >
                                            <TableCell className="w-[400px] min-w-[400px] sticky left-0 bg-emerald-900/40 group-hover/row:bg-emerald-900/60 z-10 py-4 transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 font-bold text-left">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 text-gold" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/row:text-gold transition-colors" />
                                                        )}
                                                        <span className="text-white/95 uppercase tracking-wide text-sm">{group.name}</span>
                                                    </div>

                                                    {/* Inline Adjustment Trigger */}
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <Settings2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-64 p-4" onClick={(e) => e.stopPropagation()}>
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Complexity</label>
                                                                    <Select
                                                                        value={appTask?.complexity || 'normal'}
                                                                        onValueChange={(val) => onUpdateTask?.(group.appTaskId, { complexity: val as TaskComplexity })}
                                                                    >
                                                                        <SelectTrigger className="h-8">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="low">Low</SelectItem>
                                                                            <SelectItem value="normal">Normal</SelectItem>
                                                                            <SelectItem value="high">High</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Weight (Base Hours)</label>
                                                                    <Input
                                                                        type="number"
                                                                        value={appTask?.weight || 0}
                                                                        onChange={(e) => onUpdateTask?.(group.appTaskId, { weight: parseFloat(e.target.value) || 0 })}
                                                                        className="h-8"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[120px] min-w-[120px] text-center py-4">
                                                <Badge variant="outline" className="gap-1 bg-gold/10 border-gold/30 text-gold font-bold">
                                                    <Clock className="h-3 w-3" />
                                                    {formatHours(groupTotalHours)}
                                                </Badge>
                                            </TableCell>
                                            {teamMembers.map(member => (
                                                <TableCell key={member.id} className="w-[220px] min-w-[220px] text-center text-muted-foreground text-xs py-4 px-4">
                                                    {/* Summary of assignments in this group */}
                                                    {(() => {
                                                        const groupAssignments = group.subTasks.flatMap(st =>
                                                            getSubTaskAssignments(st.id).filter(a => a.teamMemberId === member.id)
                                                        );
                                                        const leadCount = groupAssignments.filter(a => a.role === 'lead').length;
                                                        const implementerCount = groupAssignments.filter(a => a.role === 'implementer').length;

                                                        // Calculate total cost for this member in this group
                                                        let groupCost = 0;
                                                        group.subTasks.forEach(subTask => {
                                                            const subTaskAssignments = getSubTaskAssignments(subTask.id).filter(a => a.teamMemberId === member.id);
                                                            subTaskAssignments.forEach(assignment => {
                                                                const scaledHours = getScaledHours(subTask);
                                                                const rolePercentage = assignment.role === 'lead'
                                                                    ? settings.leadPercentage / 100
                                                                    : settings.implementerPercentage / 100;
                                                                const distributionShare = getMemberDistributionShare(subTask.id, assignment.role, member.id);
                                                                groupCost += scaledHours * rolePercentage * distributionShare * member.hourlyRate;
                                                            });
                                                        });

                                                        if (leadCount === 0 && implementerCount === 0) return '-';

                                                        return (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className="flex justify-center gap-2">
                                                                    {leadCount > 0 && (
                                                                        <Badge variant="secondary" className="text-xs gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20">
                                                                            <Crown className="h-3 w-3" />
                                                                            {leadCount}
                                                                        </Badge>
                                                                    )}
                                                                    {implementerCount > 0 && (
                                                                        <Badge variant="outline" className="text-xs gap-1">
                                                                            <Wrench className="h-3 w-3" />
                                                                            {implementerCount}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs font-semibold text-gold">
                                                                    {formatCurrency(groupCost)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </TableCell>
                                            ))}
                                        </TableRow>

                                        {/* Sub-task Rows */}
                                        <CollapsibleContent asChild>
                                            <>
                                                {group.subTasks.map(subTask => {
                                                    const scaledHours = getScaledHours(subTask);
                                                    const subTaskAssignments = getSubTaskAssignments(subTask.id);

                                                    return (
                                                        <TableRow key={subTask.id} className="hover:bg-muted/30">
                                                            <TableCell className="w-[400px] min-w-[400px] sticky left-0 bg-card z-10 pl-10 py-3">
                                                                <span className="text-sm">{subTask.name}</span>
                                                            </TableCell>
                                                            <TableCell className="w-[120px] min-w-[120px] text-center text-sm py-3">
                                                                {hoursLocked ? (
                                                                    <span className={cn(
                                                                        "text-muted-foreground",
                                                                        hasCustomHours(subTask.id) && "text-amber-400 font-semibold"
                                                                    )}>
                                                                        {formatHours(scaledHours)}
                                                                    </span>
                                                                ) : (
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <Input
                                                                            type="number"
                                                                            value={scaledHours}
                                                                            onChange={(e) => {
                                                                                const newHours = parseFloat(e.target.value);
                                                                                if (!isNaN(newHours) && newHours > 0) {
                                                                                    setCustomHours(subTask.id, newHours);
                                                                                }
                                                                            }}
                                                                            className="h-7 w-16 text-xs text-center"
                                                                            step="0.1"
                                                                            min="0"
                                                                        />
                                                                        {hasCustomHours(subTask.id) && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                                                                onClick={() => clearCustomHours(subTask.id)}
                                                                                title="Reset to calculated hours"
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            {teamMembers.map(member => {
                                                                const memberAssignments = subTaskAssignments.filter(
                                                                    a => a.teamMemberId === member.id
                                                                );
                                                                const isLead = memberAssignments.some(a => a.role === 'lead');
                                                                const isImplementer = memberAssignments.some(a => a.role === 'implementer');

                                                                // Check for multiple assignees in each role
                                                                const leadAssignees = getRoleAssignees(subTask.id, 'lead');
                                                                const implementerAssignees = getRoleAssignees(subTask.id, 'implementer');
                                                                const showLeadDistribution = isLead && leadAssignees.length > 1;
                                                                const showImplementerDistribution = isImplementer && implementerAssignees.length > 1;

                                                                // Calculate cost for this member on this sub-task
                                                                let subTaskCost = 0;
                                                                memberAssignments.forEach(assignment => {
                                                                    const rolePercentage = assignment.role === 'lead'
                                                                        ? settings.leadPercentage / 100
                                                                        : settings.implementerPercentage / 100;
                                                                    const distributionShare = getMemberDistributionShare(subTask.id, assignment.role, member.id);
                                                                    subTaskCost += scaledHours * rolePercentage * distributionShare * member.hourlyRate;
                                                                });

                                                                return (
                                                                    <TableCell key={member.id} className="w-[220px] min-w-[220px] text-center px-4 py-3">
                                                                        <TooltipProvider>
                                                                            <div className="flex flex-col items-center gap-1">
                                                                            <div className="flex justify-center items-center gap-1">
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant={isLead ? "default" : "outline"}
                                                                                            size="sm"
                                                                                            className={cn(
                                                                                                "h-8 w-8 p-0",
                                                                                                isLead && "bg-amber-500 hover:bg-amber-600"
                                                                                            )}
                                                                                            onClick={() => toggleAssignment(subTask.id, member.id, 'lead')}
                                                                                        >
                                                                                            <Crown className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        {isLead ? 'Remove as Lead' : 'Assign as Lead'}
                                                                                    </TooltipContent>
                                                                                </Tooltip>

                                                                                {/* Show distribution popover for leads when multiple leads exist */}
                                                                                {showLeadDistribution && (
                                                                                    <DistributionPopover
                                                                                        subTaskId={subTask.id}
                                                                                        role="lead"
                                                                                        assignees={leadAssignees.map(a => {
                                                                                            const m = teamMembers.find(tm => tm.id === a.teamMemberId);
                                                                                            return {
                                                                                                memberId: a.teamMemberId,
                                                                                                memberName: m?.name || 'Unknown',
                                                                                                memberHourlyRate: m?.hourlyRate || 0,
                                                                                                weight: getMemberDistributionShare(subTask.id, 'lead', a.teamMemberId) * leadAssignees.length
                                                                                            };
                                                                                        })}
                                                                                        totalPercentage={settings.leadPercentage}
                                                                                        scaledHours={scaledHours}
                                                                                        onUpdateDistribution={(weights) => updateDistribution(subTask.id, 'lead', weights)}
                                                                                        isCustom={hasCustomDistribution(subTask.id, 'lead')}
                                                                                    />
                                                                                )}

                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant={isImplementer ? "default" : "outline"}
                                                                                            size="sm"
                                                                                            className={cn(
                                                                                                "h-8 w-8 p-0",
                                                                                                isImplementer && "bg-blue-500 hover:bg-blue-600"
                                                                                            )}
                                                                                            onClick={() => toggleAssignment(subTask.id, member.id, 'implementer')}
                                                                                        >
                                                                                            <Wrench className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        {isImplementer ? 'Remove as Implementer' : 'Assign as Implementer'}
                                                                                    </TooltipContent>
                                                                                </Tooltip>

                                                                                {/* Show distribution popover for implementers when multiple implementers exist */}
                                                                                {showImplementerDistribution && (
                                                                                    <DistributionPopover
                                                                                        subTaskId={subTask.id}
                                                                                        role="implementer"
                                                                                        assignees={implementerAssignees.map(a => {
                                                                                            const m = teamMembers.find(tm => tm.id === a.teamMemberId);
                                                                                            return {
                                                                                                memberId: a.teamMemberId,
                                                                                                memberName: m?.name || 'Unknown',
                                                                                                memberHourlyRate: m?.hourlyRate || 0,
                                                                                                weight: getMemberDistributionShare(subTask.id, 'implementer', a.teamMemberId) * implementerAssignees.length
                                                                                            };
                                                                                        })}
                                                                                        totalPercentage={settings.implementerPercentage}
                                                                                        scaledHours={scaledHours}
                                                                                        onUpdateDistribution={(weights) => updateDistribution(subTask.id, 'implementer', weights)}
                                                                                        isCustom={hasCustomDistribution(subTask.id, 'implementer')}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                            {/* Show cost if member has any assignments */}
                                                                            {(isLead || isImplementer) && (
                                                                                <span className="text-xs font-semibold text-gold">
                                                                                    {formatCurrency(subTaskCost)}
                                                                                </span>
                                                                            )}
                                                                            </div>
                                                                        </TooltipProvider>
                                                                    </TableCell>
                                                                );
                                                            })}
                                                        </TableRow>
                                                    );
                                                })}
                                            </>
                                        </CollapsibleContent>
                                    </>
                                </Collapsible>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default TeamDistributionMatrix;
