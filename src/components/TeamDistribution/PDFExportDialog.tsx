import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    FileDown,
    Users,
    ListTodo,
    Eye,
    EyeOff,
    Crown,
    Wrench,
    Clock,
    DollarSign,
} from "lucide-react";
import {
    TeamMember,
    TaskAssignment,
    TeamDistributionSettings,
    ParentTaskGroup,
    SubTask,
} from "@/types/calculator";

export interface PDFExportOptions {
    // Team member selection
    selectedMembers: string[];
    // Task selection
    selectedTasks: string[]; // Parent task IDs
    // Display options
    showHours: boolean;
    showCosts: boolean;
    showRoles: boolean; // Show Lead/Implementer badges
    showHourlyRates: boolean;
    showSubtasks: boolean;
}

interface PDFExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamMembers: TeamMember[];
    assignments: TaskAssignment[];
    settings: TeamDistributionSettings;
    parentTaskGroups: ParentTaskGroup[];
    getScaledHours: (subTask: SubTask) => number;
    getMemberCost: (memberId: string) => number;
    getMemberHours: (memberId: string) => { leadHours: number; implementerHours: number; totalHours: number };
    getMemberDistributionShare: (subTaskId: string, role: 'lead' | 'implementer', memberId: string) => number;
    onExport: (options: PDFExportOptions) => void;
}

const PDFExportDialog = ({
    open,
    onOpenChange,
    teamMembers,
    assignments,
    parentTaskGroups,
    getScaledHours,
    getMemberCost,
    getMemberHours,
    onExport,
}: PDFExportDialogProps) => {
    // Default: all members selected
    const [selectedMembers, setSelectedMembers] = useState<string[]>(
        teamMembers.map(m => m.id)
    );

    // Default: all tasks selected
    const [selectedTasks, setSelectedTasks] = useState<string[]>(
        parentTaskGroups.map(g => g.appTaskId)
    );

    // Display options
    const [showHours, setShowHours] = useState(true);
    const [showCosts, setShowCosts] = useState(true);
    const [showRoles, setShowRoles] = useState(true);
    const [showHourlyRates, setShowHourlyRates] = useState(true);
    const [showSubtasks, setShowSubtasks] = useState(true);

    // Update selections when dialog opens
    useMemo(() => {
        if (open) {
            setSelectedMembers(teamMembers.map(m => m.id));
            setSelectedTasks(parentTaskGroups.map(g => g.appTaskId));
        }
    }, [open, teamMembers, parentTaskGroups]);

    // Toggle member selection
    const toggleMember = (memberId: string) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    // Toggle task selection
    const toggleTask = (taskId: string) => {
        setSelectedTasks(prev =>
            prev.includes(taskId)
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        );
    };

    // Select/deselect all members
    const toggleAllMembers = () => {
        if (selectedMembers.length === teamMembers.length) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(teamMembers.map(m => m.id));
        }
    };

    // Select/deselect all tasks
    const toggleAllTasks = () => {
        if (selectedTasks.length === parentTaskGroups.length) {
            setSelectedTasks([]);
        } else {
            setSelectedTasks(parentTaskGroups.map(g => g.appTaskId));
        }
    };

    // Get member assignment summary for selected tasks
    const getMemberSummary = (memberId: string) => {
        const memberAssignments = assignments.filter(
            a => a.teamMemberId === memberId &&
                selectedTasks.some(taskId => {
                    const group = parentTaskGroups.find(g => g.appTaskId === taskId);
                    return group?.subTasks.some(st => st.id === a.subTaskId);
                })
        );
        const leadCount = memberAssignments.filter(a => a.role === 'lead').length;
        const implCount = memberAssignments.filter(a => a.role === 'implementer').length;
        return { leadCount, implCount, total: memberAssignments.length };
    };

    // Handle export
    const handleExport = () => {
        onExport({
            selectedMembers,
            selectedTasks,
            showHours,
            showCosts,
            showRoles,
            showHourlyRates,
            showSubtasks,
        });
        onOpenChange(false);
    };

    const formatCurrency = (value: number) => {
        if (isNaN(value) || !isFinite(value)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatHours = (hours: number) => {
        if (isNaN(hours) || !isFinite(hours)) return '0h';
        return `${hours.toFixed(1)}h`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5 text-primary" />
                        Export Team Distribution PDF
                    </DialogTitle>
                    <DialogDescription>
                        Choose what to include in your PDF export. Select team members, tasks, and display options.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-6">
                            {/* Team Member Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Team Members
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={toggleAllMembers}
                                    >
                                        {selectedMembers.length === teamMembers.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                                <div className="grid gap-2">
                                    {teamMembers.map(member => {
                                        const summary = getMemberSummary(member.id);
                                        const hours = getMemberHours(member.id);
                                        const cost = getMemberCost(member.id);
                                        const isSelected = selectedMembers.includes(member.id);

                                        return (
                                            <div
                                                key={member.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${isSelected
                                                        ? 'bg-primary/10 border-primary/30'
                                                        : 'bg-muted/30 border-transparent hover:bg-muted/50'
                                                    }`}
                                                onClick={() => toggleMember(member.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleMember(member.id)}
                                                    />
                                                    <div>
                                                        <div className="font-medium text-sm">{member.name}</div>
                                                        {member.role && (
                                                            <div className="text-xs text-muted-foreground">{member.role}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs">
                                                    {summary.total > 0 && (
                                                        <div className="flex gap-1">
                                                            {summary.leadCount > 0 && (
                                                                <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500">
                                                                    <Crown className="h-2.5 w-2.5 mr-0.5" />
                                                                    {summary.leadCount}
                                                                </Badge>
                                                            )}
                                                            {summary.implCount > 0 && (
                                                                <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-500">
                                                                    <Wrench className="h-2.5 w-2.5 mr-0.5" />
                                                                    {summary.implCount}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                    <span className="text-muted-foreground">{formatHours(hours.totalHours)}</span>
                                                    <span className="font-semibold text-gold">{formatCurrency(cost)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <Separator />

                            {/* Task Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <ListTodo className="h-4 w-4" />
                                        Tasks to Include
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={toggleAllTasks}
                                    >
                                        {selectedTasks.length === parentTaskGroups.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                                <div className="grid gap-2">
                                    {parentTaskGroups.map(group => {
                                        const isSelected = selectedTasks.includes(group.appTaskId);
                                        const totalHours = group.subTasks.reduce(
                                            (sum, st) => sum + getScaledHours(st),
                                            0
                                        );

                                        return (
                                            <div
                                                key={group.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${isSelected
                                                        ? 'bg-primary/10 border-primary/30'
                                                        : 'bg-muted/30 border-transparent hover:bg-muted/50'
                                                    }`}
                                                onClick={() => toggleTask(group.appTaskId)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleTask(group.appTaskId)}
                                                    />
                                                    <div>
                                                        <div className="font-medium text-sm">{group.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {group.subTasks.length} subtask{group.subTasks.length !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {formatHours(totalHours)}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <Separator />

                            {/* Display Options */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    {showHours || showCosts || showRoles ? (
                                        <Eye className="h-4 w-4" />
                                    ) : (
                                        <EyeOff className="h-4 w-4" />
                                    )}
                                    Display Options
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${showHours ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'
                                            }`}
                                        onClick={() => setShowHours(!showHours)}
                                    >
                                        <Checkbox checked={showHours} onCheckedChange={setShowHours} />
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <Label className="text-sm cursor-pointer">Show Hours</Label>
                                        </div>
                                    </div>

                                    <div
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${showCosts ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'
                                            }`}
                                        onClick={() => setShowCosts(!showCosts)}
                                    >
                                        <Checkbox checked={showCosts} onCheckedChange={setShowCosts} />
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <Label className="text-sm cursor-pointer">Show Costs</Label>
                                        </div>
                                    </div>

                                    <div
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${showRoles ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'
                                            }`}
                                        onClick={() => setShowRoles(!showRoles)}
                                    >
                                        <Checkbox checked={showRoles} onCheckedChange={setShowRoles} />
                                        <div className="flex items-center gap-2">
                                            <Crown className="h-4 w-4 text-muted-foreground" />
                                            <Label className="text-sm cursor-pointer">Show Roles (Lead/Impl)</Label>
                                        </div>
                                    </div>

                                    <div
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${showHourlyRates ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'
                                            }`}
                                        onClick={() => setShowHourlyRates(!showHourlyRates)}
                                    >
                                        <Checkbox checked={showHourlyRates} onCheckedChange={setShowHourlyRates} />
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <Label className="text-sm cursor-pointer">Show Hourly Rates</Label>
                                        </div>
                                    </div>

                                    <div
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors col-span-2 ${showSubtasks ? 'bg-primary/10 border-primary/30' : 'bg-muted/30'
                                            }`}
                                        onClick={() => setShowSubtasks(!showSubtasks)}
                                    >
                                        <Checkbox checked={showSubtasks} onCheckedChange={setShowSubtasks} />
                                        <div className="flex items-center gap-2">
                                            <ListTodo className="h-4 w-4 text-muted-foreground" />
                                            <Label className="text-sm cursor-pointer">Show Subtasks (detailed breakdown)</Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="pt-4 border-t">
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground">
                            {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''}, {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleExport}
                                disabled={selectedMembers.length === 0 || selectedTasks.length === 0}
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Export PDF
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PDFExportDialog;
