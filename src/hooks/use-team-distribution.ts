import { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Task,
    TeamMember,
    TaskAssignment,
    TeamDistributionSettings,
    SubTask,
    ParentTaskGroup,
    RoleDistributionWeight,
    SubTaskHoursOverride
} from '@/types/calculator';
import { parentTaskGroups, getGroupBaseHours } from '@/data/sub-task-data';

const DEFAULT_SETTINGS: TeamDistributionSettings = {
    leadPercentage: 20,
    implementerPercentage: 80,
};

export interface TeamDistributionHookResult {
    teamMembers: TeamMember[];
    assignments: TaskAssignment[];
    settings: TeamDistributionSettings;
    customDistributions: RoleDistributionWeight[];
    customHours: SubTaskHoursOverride[];
    parentTaskGroups: ParentTaskGroup[];
    addTeamMember: (name: string, hourlyRate: number, role?: string) => void;
    removeTeamMember: (id: string) => void;
    updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
    toggleAssignment: (subTaskId: string, teamMemberId: string, role: 'lead' | 'implementer') => void;
    removeAssignment: (subTaskId: string, teamMemberId: string, role: 'lead' | 'implementer') => void;
    updateSettings: (settings: Partial<TeamDistributionSettings>) => void;
    getScaledHours: (subTask: SubTask) => number;
    getMemberCost: (memberId: string) => number;
    getMemberHours: (memberId: string) => { leadHours: number; implementerHours: number; totalHours: number };
    getTotalProjectCost: () => number;
    getSubTaskAssignments: (subTaskId: string) => TaskAssignment[];
    // New distribution-related exports
    getRoleAssignees: (subTaskId: string, role: 'lead' | 'implementer') => TaskAssignment[];
    getMemberDistributionShare: (subTaskId: string, role: 'lead' | 'implementer', memberId: string) => number;
    updateDistribution: (subTaskId: string, role: 'lead' | 'implementer', weights: { memberId: string; weight: number }[]) => void;
    hasCustomDistribution: (subTaskId: string, role: 'lead' | 'implementer') => boolean;
    // Custom hours-related exports
    setCustomHours: (subTaskId: string, hours: number) => void;
    clearCustomHours: (subTaskId: string) => void;
    hasCustomHours: (subTaskId: string) => boolean;
    getMemberTaskBreakdown: (memberId: string) => { taskName: string; role: 'lead' | 'implementer'; hours: number; cost: number }[];
}

export const useTeamDistribution = (
    appTasks: Task[],
    initialState?: {
        teamMembers: TeamMember[],
        assignments: TaskAssignment[],
        settings: TeamDistributionSettings,
        customDistributions?: RoleDistributionWeight[],
        customHours?: SubTaskHoursOverride[]
    },
    onUpdateTaskWeight?: (taskId: string, newWeight: number) => void,
    scaleMultiplier: number = 1
): TeamDistributionHookResult => {
    // Helper to migrate old settings with doerPercentage to implementerPercentage
    const migrateSettings = (s: any): TeamDistributionSettings => {
        if (!s) return DEFAULT_SETTINGS;
        return {
            leadPercentage: s.leadPercentage ?? 20,
            // Support old doerPercentage field name
            implementerPercentage: s.implementerPercentage ?? s.doerPercentage ?? 80,
        };
    };

    // Helper to migrate old assignments with 'doer' role to 'implementer'
    const migrateAssignments = (a: TaskAssignment[]): TaskAssignment[] => {
        if (!a) return [];
        return a.map(assignment => ({
            ...assignment,
            role: assignment.role === 'doer' ? 'implementer' : assignment.role
        } as TaskAssignment));
    };

    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialState?.teamMembers || []);
    const [assignments, setAssignments] = useState<TaskAssignment[]>(migrateAssignments(initialState?.assignments || []));
    const [settings, setSettings] = useState<TeamDistributionSettings>(migrateSettings(initialState?.settings));
    const [customDistributions, setCustomDistributions] = useState<RoleDistributionWeight[]>(initialState?.customDistributions || []);
    const [customHours, setCustomHours] = useState<SubTaskHoursOverride[]>(initialState?.customHours || []);

    // Sync internal state if initialState changes (e.g. after loading from storage)
    useEffect(() => {
        if (initialState) {
            if (initialState.teamMembers) setTeamMembers(initialState.teamMembers);
            if (initialState.assignments) setAssignments(migrateAssignments(initialState.assignments));
            if (initialState.settings) setSettings(migrateSettings(initialState.settings));
            if (initialState.customDistributions) setCustomDistributions(initialState.customDistributions);
            if (initialState.customHours) setCustomHours(initialState.customHours);
        }
    }, [initialState]);

    // Create a map of app task ID to weight for quick lookup
    const taskWeightMap = useMemo(() => {
        const map: Record<string, number> = {};
        appTasks.forEach(task => {
            if (task.included) {
                map[task.id] = task.weight;
            }
        });
        return map;
    }, [appTasks]);

    // Calculate scale factor for a parent task group
    const getScaleFactor = useCallback((group: ParentTaskGroup): number => {
        const appWeight = taskWeightMap[group.appTaskId];
        if (!appWeight) return 0; // Task not included

        const baseHours = getGroupBaseHours(group);
        if (baseHours === 0) return 0;

        // Apply global scale multiplier (e.g. based on project size)
        const scaledAppWeight = appWeight * scaleMultiplier;

        return scaledAppWeight / baseHours;
    }, [taskWeightMap, scaleMultiplier]);

    // Get scaled hours for a sub-task based on parent task weight
    const getScaledHours = useCallback((subTask: SubTask): number => {
        // First check if there's a custom hours override for this sub-task
        const customOverride = customHours.find(ch => ch.subTaskId === subTask.id);
        if (customOverride) {
            return customOverride.customHours;
        }

        // Otherwise, calculate scaled hours normally
        const group = parentTaskGroups.find(g => g.appTaskId === subTask.parentTaskId);
        if (!group) return subTask.baseHours;

        const scaleFactor = getScaleFactor(group);
        return subTask.baseHours * scaleFactor;
    }, [getScaleFactor, customHours]);

    // Add a new team member
    const addTeamMember = useCallback((name: string, hourlyRate: number, role?: string) => {
        const newMember: TeamMember = {
            id: `member-${Date.now()}`,
            name,
            hourlyRate,
            role,
        };
        setTeamMembers(prev => [...prev, newMember]);
    }, []);

    // Remove a team member
    const removeTeamMember = useCallback((id: string) => {
        setTeamMembers(prev => prev.filter(m => m.id !== id));
        // Also remove their assignments
        setAssignments(prev => prev.filter(a => a.teamMemberId !== id));
        // Also remove any custom distributions involving this member
        setCustomDistributions(prev => prev.filter(d => d.teamMemberId !== id));
    }, []);

    // Update a team member
    const updateTeamMember = useCallback((id: string, updates: Partial<TeamMember>) => {
        setTeamMembers(prev => prev.map(m =>
            m.id === id ? { ...m, ...updates } : m
        ));
    }, []);

    // Toggle assignment (add if doesn't exist, remove if exists)
    const toggleAssignment = useCallback((subTaskId: string, teamMemberId: string, role: 'lead' | 'implementer') => {
        setAssignments(prev => {
            const existingIndex = prev.findIndex(
                a => a.subTaskId === subTaskId && a.teamMemberId === teamMemberId && a.role === role
            );

            if (existingIndex >= 0) {
                // Remove existing assignment
                return prev.filter((_, i) => i !== existingIndex);
            } else {
                // Add new assignment
                return [...prev, { subTaskId, teamMemberId, role }];
            }
        });

        // Reset custom distributions for this subTask+role combo when assignments change
        setCustomDistributions(prev =>
            prev.filter(d => !(d.subTaskId === subTaskId && d.role === role))
        );
    }, []);

    // Remove a specific assignment
    const removeAssignment = useCallback((subTaskId: string, teamMemberId: string, role: 'lead' | 'implementer') => {
        setAssignments(prev => prev.filter(
            a => !(a.subTaskId === subTaskId && a.teamMemberId === teamMemberId && a.role === role)
        ));
    }, []);

    // Update settings
    const updateSettings = useCallback((newSettings: Partial<TeamDistributionSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    }, []);

    // Get all sub-tasks flattened
    const allSubTasks = useMemo(() => {
        return parentTaskGroups.flatMap(group => group.subTasks);
    }, []);

    // Get assignments for a specific sub-task
    const getSubTaskAssignments = useCallback((subTaskId: string): TaskAssignment[] => {
        return assignments.filter(a => a.subTaskId === subTaskId);
    }, [assignments]);

    // Get all assignees for a specific role on a sub-task
    const getRoleAssignees = useCallback((subTaskId: string, role: 'lead' | 'implementer'): TaskAssignment[] => {
        return assignments.filter(a => a.subTaskId === subTaskId && a.role === role);
    }, [assignments]);

    // Check if a sub-task+role has custom distribution weights
    const hasCustomDistribution = useCallback((subTaskId: string, role: 'lead' | 'implementer'): boolean => {
        return customDistributions.some(d => d.subTaskId === subTaskId && d.role === role);
    }, [customDistributions]);

    // Get the distribution share (0-1) for a member in a role on a sub-task
    const getMemberDistributionShare = useCallback((
        subTaskId: string,
        role: 'lead' | 'implementer',
        memberId: string
    ): number => {
        const roleAssignees = getRoleAssignees(subTaskId, role);
        if (roleAssignees.length === 0) return 0;
        if (roleAssignees.length === 1) return 1; // Single assignee gets 100% of role percentage

        // Check for custom weights
        const customWeights = customDistributions.filter(
            d => d.subTaskId === subTaskId && d.role === role
        );

        if (customWeights.length > 0) {
            // Use custom weights
            const memberWeight = customWeights.find(w => w.teamMemberId === memberId)?.weight || 1;
            const totalWeight = customWeights.reduce((sum, w) => sum + w.weight, 0);
            if (totalWeight === 0) return 1 / roleAssignees.length; // Guard against division by zero
            return memberWeight / totalWeight;
        } else {
            // Default: equal distribution among all assignees
            return 1 / roleAssignees.length;
        }
    }, [customDistributions, getRoleAssignees]);

    // Update custom distribution weights for a sub-task+role
    const updateDistribution = useCallback((
        subTaskId: string,
        role: 'lead' | 'implementer',
        weights: { memberId: string; weight: number }[]
    ) => {
        setCustomDistributions(prev => {
            // Remove existing weights for this subTask+role
            const filtered = prev.filter(d => !(d.subTaskId === subTaskId && d.role === role));

            // Add new weights
            const newWeights: RoleDistributionWeight[] = weights.map(w => ({
                subTaskId,
                role,
                teamMemberId: w.memberId,
                weight: w.weight
            }));

            return [...filtered, ...newWeights];
        });
    }, []);

    // Calculate cost for a team member
    const getMemberCost = useCallback((memberId: string): number => {
        const member = teamMembers.find(m => m.id === memberId);
        if (!member) return 0;

        const memberAssignments = assignments.filter(a => a.teamMemberId === memberId);

        let totalCost = 0;
        memberAssignments.forEach(assignment => {
            const subTask = allSubTasks.find(st => st.id === assignment.subTaskId);
            if (!subTask) return;

            const scaledHours = getScaledHours(subTask);
            const rolePercentage = assignment.role === 'lead'
                ? settings.leadPercentage / 100
                : settings.implementerPercentage / 100;

            // Get distribution share among same-role assignees (handles multiple leads/implementers)
            const distributionShare = getMemberDistributionShare(
                assignment.subTaskId,
                assignment.role,
                memberId
            );

            totalCost += scaledHours * rolePercentage * distributionShare * member.hourlyRate;
        });

        return totalCost;
    }, [teamMembers, assignments, allSubTasks, getScaledHours, settings, getMemberDistributionShare]);

    // Calculate hours breakdown for a team member
    const getMemberHours = useCallback((memberId: string): { leadHours: number; implementerHours: number; totalHours: number } => {
        const memberAssignments = assignments.filter(a => a.teamMemberId === memberId);

        let leadHours = 0;
        let implementerHours = 0;

        memberAssignments.forEach(assignment => {
            const subTask = allSubTasks.find(st => st.id === assignment.subTaskId);
            if (!subTask) return;

            const scaledHours = getScaledHours(subTask);

            // Get distribution share among same-role assignees (handles multiple leads/implementers)
            const distributionShare = getMemberDistributionShare(
                assignment.subTaskId,
                assignment.role,
                memberId
            );

            if (assignment.role === 'lead') {
                leadHours += scaledHours * (settings.leadPercentage / 100) * distributionShare;
            } else {
                implementerHours += scaledHours * (settings.implementerPercentage / 100) * distributionShare;
            }
        });

        return { leadHours, implementerHours, totalHours: leadHours + implementerHours };
    }, [assignments, allSubTasks, getScaledHours, settings, getMemberDistributionShare]);

    // Calculate total project cost
    const getTotalProjectCost = useCallback((): number => {
        return teamMembers.reduce((sum, member) => sum + getMemberCost(member.id), 0);
    }, [teamMembers, getMemberCost]);

    // Helper: Calculate parent task weight based on current sub-task hours
    const calculateParentTaskWeight = useCallback((parentTaskId: string, updatedCustomHours: SubTaskHoursOverride[]): number => {
        const group = parentTaskGroups.find(g => g.appTaskId === parentTaskId);
        if (!group) return 0;

        const baseHours = getGroupBaseHours(group);
        if (baseHours === 0) return 0;

        // Check if any sub-task in this group has custom hours
        const hasAnyCustomHours = group.subTasks.some(st =>
            updatedCustomHours.find(ch => ch.subTaskId === st.id)
        );

        if (!hasAnyCustomHours) {
            // No custom hours in this group, keep current weight
            return taskWeightMap[parentTaskId] || 0;
        }

        // Calculate what the current scale factor is for non-custom tasks
        const currentWeight = taskWeightMap[parentTaskId] || baseHours;
        const currentScaleFactor = currentWeight / baseHours;

        // Sum all sub-task hours (using custom where available, scaled base where not)
        let totalHours = 0;
        group.subTasks.forEach(subTask => {
            const customOverride = updatedCustomHours.find(ch => ch.subTaskId === subTask.id);
            if (customOverride) {
                // Use custom hours directly
                totalHours += customOverride.customHours;
            } else {
                // Scale base hours with current factor to maintain proportion
                totalHours += subTask.baseHours * currentScaleFactor;
            }
        });

        return Math.round(totalHours * 10) / 10; // Round to 1 decimal
    }, [taskWeightMap]);

    // Set custom hours for a sub-task
    const setCustomHoursForSubTask = useCallback((subTaskId: string, hours: number) => {
        // Find which parent task this sub-task belongs to
        const subTask = allSubTasks.find(st => st.id === subTaskId);
        if (!subTask) return;

        setCustomHours(prev => {
            // Remove existing override for this sub-task if any
            const filtered = prev.filter(ch => ch.subTaskId !== subTaskId);
            // Add new override
            const updated = [...filtered, { subTaskId, customHours: hours }];

            // Recalculate parent task weight
            const newWeight = calculateParentTaskWeight(subTask.parentTaskId, updated);

            // Update the parent task weight if callback is provided
            if (onUpdateTaskWeight) {
                onUpdateTaskWeight(subTask.parentTaskId, newWeight);
            }

            return updated;
        });
    }, [allSubTasks, calculateParentTaskWeight, onUpdateTaskWeight]);

    // Clear custom hours for a sub-task (revert to calculated hours)
    const clearCustomHoursForSubTask = useCallback((subTaskId: string) => {
        // Find which parent task this sub-task belongs to
        const subTask = allSubTasks.find(st => st.id === subTaskId);
        if (!subTask) return;

        setCustomHours(prev => {
            const updated = prev.filter(ch => ch.subTaskId !== subTaskId);

            // Recalculate parent task weight after removing custom hours
            const newWeight = calculateParentTaskWeight(subTask.parentTaskId, updated);

            // Update the parent task weight if callback is provided
            if (onUpdateTaskWeight) {
                onUpdateTaskWeight(subTask.parentTaskId, newWeight);
            }

            return updated;
        });
    }, [allSubTasks, calculateParentTaskWeight, onUpdateTaskWeight]);

    // Check if a sub-task has custom hours set
    const hasCustomHoursForSubTask = useCallback((subTaskId: string): boolean => {
        return customHours.some(ch => ch.subTaskId === subTaskId);
    }, [customHours]);

    // Get task breakdown for a team member (for Cost Summary display)
    const getMemberTaskBreakdown = useCallback((memberId: string): { taskName: string; role: 'lead' | 'implementer'; hours: number; cost: number }[] => {
        const member = teamMembers.find(m => m.id === memberId);
        if (!member) return [];

        const memberAssignments = assignments.filter(a => a.teamMemberId === memberId);
        const breakdown: { taskName: string; role: 'lead' | 'implementer'; hours: number; cost: number }[] = [];

        memberAssignments.forEach(assignment => {
            const subTask = allSubTasks.find(st => st.id === assignment.subTaskId);
            if (!subTask) return;

            const scaledHours = getScaledHours(subTask);
            const rolePercentage = assignment.role === 'lead'
                ? settings.leadPercentage / 100
                : settings.implementerPercentage / 100;

            const distributionShare = getMemberDistributionShare(
                assignment.subTaskId,
                assignment.role,
                memberId
            );

            const hours = scaledHours * rolePercentage * distributionShare;
            const cost = hours * member.hourlyRate;

            breakdown.push({
                taskName: subTask.name,
                role: assignment.role,
                hours,
                cost
            });
        });

        // Sort by cost descending
        return breakdown.sort((a, b) => b.cost - a.cost);
    }, [teamMembers, assignments, allSubTasks, getScaledHours, settings, getMemberDistributionShare]);

    return {
        teamMembers,
        assignments,
        settings,
        customDistributions,
        customHours,
        parentTaskGroups,
        addTeamMember,
        removeTeamMember,
        updateTeamMember,
        toggleAssignment,
        removeAssignment,
        updateSettings,
        getScaledHours,
        getMemberCost,
        getMemberHours,
        getTotalProjectCost,
        getSubTaskAssignments,
        // New distribution-related exports
        getRoleAssignees,
        getMemberDistributionShare,
        updateDistribution,
        hasCustomDistribution,
        // Custom hours-related exports
        setCustomHours: setCustomHoursForSubTask,
        clearCustomHours: clearCustomHoursForSubTask,
        hasCustomHours: hasCustomHoursForSubTask,
        // Task breakdown for cost summary
        getMemberTaskBreakdown,
    };
};
