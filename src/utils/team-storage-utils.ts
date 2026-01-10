import {
  SavedTeamConfiguration,
  TeamDistributionState,
  TeamMember,
  TaskAssignment,
  TeamDistributionSettings,
  RoleDistributionWeight,
  SubTaskHoursOverride
} from '@/types/calculator';

// Export team configuration to JSON file
export const exportTeamConfiguration = (
  config: TeamDistributionState,
  teamName: string
): void => {
  const savedConfig: SavedTeamConfiguration = {
    id: crypto.randomUUID(),
    name: teamName,
    exportDate: new Date().toISOString(),
    teamMembers: config.teamMembers,
    assignments: config.assignments,
    settings: config.settings,
    customDistributions: config.customDistributions,
    customHours: config.customHours,
  };

  const dataStr = JSON.stringify(savedConfig, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

  const exportFileName = `team-${teamName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileName);
  linkElement.click();
  linkElement.remove();
};

// Parse and validate imported team configuration
export const importTeamConfiguration = (file: File): Promise<SavedTeamConfiguration> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Validate required fields
        if (!parsed.teamMembers || !Array.isArray(parsed.teamMembers)) {
          throw new Error('Invalid file: missing teamMembers array');
        }

        if (!parsed.assignments || !Array.isArray(parsed.assignments)) {
          throw new Error('Invalid file: missing assignments array');
        }

        if (!parsed.settings || typeof parsed.settings !== 'object') {
          throw new Error('Invalid file: missing settings object');
        }

        // Validate team members structure
        for (const member of parsed.teamMembers) {
          if (!member.id || !member.name || typeof member.hourlyRate !== 'number') {
            throw new Error('Invalid team member structure');
          }
        }

        // Validate assignments structure (support both old 'doer' and new 'implementer')
        for (const assignment of parsed.assignments) {
          if (!assignment.subTaskId || !assignment.teamMemberId || !assignment.role) {
            throw new Error('Invalid assignment structure');
          }
          if (assignment.role !== 'lead' && assignment.role !== 'implementer' && assignment.role !== 'doer') {
            throw new Error('Invalid assignment role');
          }
          // Migrate 'doer' to 'implementer'
          if (assignment.role === 'doer') {
            assignment.role = 'implementer';
          }
        }

        // Validate settings structure (support both old doerPercentage and new implementerPercentage)
        const hasLeadPct = typeof parsed.settings.leadPercentage === 'number';
        const hasImplPct = typeof parsed.settings.implementerPercentage === 'number' ||
            typeof parsed.settings.doerPercentage === 'number';
        if (!hasLeadPct || !hasImplPct) {
          throw new Error('Invalid settings structure');
        }
        // Migrate doerPercentage to implementerPercentage
        if (parsed.settings.doerPercentage !== undefined && parsed.settings.implementerPercentage === undefined) {
          parsed.settings.implementerPercentage = parsed.settings.doerPercentage;
          delete parsed.settings.doerPercentage;
        }

        // Create validated configuration
        const config: SavedTeamConfiguration = {
          id: parsed.id || crypto.randomUUID(),
          name: parsed.name || 'Imported Team',
          exportDate: parsed.exportDate || new Date().toISOString(),
          teamMembers: parsed.teamMembers,
          assignments: parsed.assignments,
          settings: parsed.settings,
          customDistributions: parsed.customDistributions || [],
          customHours: parsed.customHours || [],
        };

        resolve(config);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse team configuration'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

// Merge imported team configuration with existing (generates new IDs to avoid conflicts)
export const mergeTeamConfiguration = (
  imported: SavedTeamConfiguration
): TeamDistributionState => {
  // Create ID mapping for team members (old ID -> new ID)
  const memberIdMap: Record<string, string> = {};

  const newTeamMembers: TeamMember[] = imported.teamMembers.map(member => {
    const newId = `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    memberIdMap[member.id] = newId;
    return {
      ...member,
      id: newId,
    };
  });

  // Update assignments with new member IDs
  const newAssignments: TaskAssignment[] = imported.assignments.map(assignment => ({
    ...assignment,
    teamMemberId: memberIdMap[assignment.teamMemberId] || assignment.teamMemberId,
  }));

  // Update custom distributions with new member IDs
  const newCustomDistributions: RoleDistributionWeight[] = (imported.customDistributions || []).map(dist => ({
    ...dist,
    teamMemberId: memberIdMap[dist.teamMemberId] || dist.teamMemberId,
  }));

  return {
    teamMembers: newTeamMembers,
    assignments: newAssignments,
    settings: imported.settings,
    customDistributions: newCustomDistributions,
    customHours: imported.customHours || [],
  };
};
