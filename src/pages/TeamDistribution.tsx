import MainNavigation from "@/components/Navigation/MainNavigation";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Download, Upload, FileDown } from "lucide-react";
import { Task, TeamDistributionState } from "@/types/calculator";
import { useTeamDistribution } from "@/hooks/use-team-distribution";
import TeamDistributionMatrix from "@/components/TeamDistribution/TeamDistributionMatrix";
import AddTeamMemberDialog from "@/components/TeamDistribution/AddTeamMemberDialog";
import CostSummaryPanel from "@/components/TeamDistribution/CostSummaryPanel";
import { ExportTeamDialog, ImportTeamDialog } from "@/components/TeamDistribution/TeamConfigDialog";
import PDFExportDialog, { PDFExportOptions } from "@/components/TeamDistribution/PDFExportDialog";
import { generateTeamDistributionPDF } from "@/utils/team-pdf-generator";
import { getCurrentProjectId, getProjectById } from "@/utils/storage-utils";
import { getScalingMultiplier } from "@/utils/scaling-utils";
import { toast } from "@/components/ui/use-toast";

// Default tasks matching the app's TasksForm.tsx (new order: Market > Land Eval > Consultant > Design Ideation > Testing > Visualization)
const getDefaultTasks = (): Task[] => [
    { id: "task-8", name: "Market and Trend Analysis", weight: 9, included: true, complexity: "normal", category: "baseline" },
    { id: "task-1", name: "Land Evaluation and Site Analysis", weight: 37, included: true, complexity: "normal", category: "baseline" },
    { id: "task-2", name: "Consultant & Contractors Research", weight: 6, included: true, complexity: "normal", category: "baseline" },
    { id: "task-3", name: "Design Ideation", weight: 28, included: true, complexity: "normal", category: "baseline" },
    { id: "task-5", name: "Design Testing & Refinement", weight: 45, included: true, complexity: "normal", category: "baseline" },
    { id: "task-6", name: "Visualization", weight: 51, included: true, complexity: "normal", category: "baseline" },
    { id: "task-4", name: "Masterplan Main Task", weight: 69, included: true, complexity: "normal", category: "addon-masterplan" },
    { id: "task-7", name: "Interior Design Main Task", weight: 65, included: true, complexity: "normal", category: "addon-interiors" },
];

const TeamDistribution = () => {
    const { user, loading, signOut } = useAuth();
    const navigate = useNavigate();
    const [appTasks, setAppTasks] = useState<Task[]>(getDefaultTasks());
    const [initialState, setInitialState] = useState<any>(undefined);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'summary' | 'sidebar'>('grid');
    const [projectData, setProjectData] = useState<any>(null);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [pdfExportDialogOpen, setPdfExportDialogOpen] = useState(false);

    // Load tasks and state from current project if available
    useEffect(() => {
        const projectId = getCurrentProjectId();
        if (projectId) {
            const project = getProjectById(projectId);
            if (project?.data) {
                // Load tasks
                if (project.data.tasks && Array.isArray(project.data.tasks)) {
                    // Merge saved tasks with defaults (in case new tasks were added)
                    const savedTasks = project.data.tasks as Task[];
                    const mergedTasks = getDefaultTasks().map(defaultTask => {
                        const savedTask = savedTasks.find(t => t.id === defaultTask.id);
                        return savedTask || defaultTask;
                    });
                    setAppTasks(mergedTasks);
                }

                // Load team distribution state
                if (project.data.teamDistribution) {
                    setInitialState(project.data.teamDistribution);
                }
                setProjectData(project.data);
            }
        }
        setIsDataLoaded(true);
    }, []);

    // Refresh tasks when tab becomes visible (in case user changed them on Project Input)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const projectId = getCurrentProjectId();
                if (projectId) {
                    const project = getProjectById(projectId);
                    if (project?.data?.tasks && Array.isArray(project.data.tasks)) {
                        const savedTasks = project.data.tasks as Task[];
                        const mergedTasks = getDefaultTasks().map(defaultTask => {
                            const savedTask = savedTasks.find(t => t.id === defaultTask.id);
                            return savedTask || defaultTask;
                        });
                        setAppTasks(mergedTasks);
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Callback to update task weight when custom hours change
    const handleUpdateTaskWeight = (taskId: string, newWeight: number) => {
        setAppTasks(prev => prev.map(t => t.id === taskId ? { ...t, weight: newWeight } : t));
    };

    const sizeMultiplier = useMemo(() => {
        // Calculate total area from dwellings
        const totalProjectArea = projectData?.dwellings 
            ? projectData.dwellings.reduce((sum: number, d: any) => sum + (d.size || 0), 0)
            : 100;

        const area = totalProjectArea > 0 ? totalProjectArea : 100;
        
        // Use configurable tiers from project settings, or defaults if not set
        return getScalingMultiplier(area, projectData?.multiplierSettings?.projectSizeScaling);
    }, [projectData]);

    const {
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
        updateSettings,
        getScaledHours,
        getMemberCost,
        getMemberHours,
        getTotalProjectCost,
        getSubTaskAssignments,
        // Distribution-related exports
        getRoleAssignees,
        getMemberDistributionShare,
        updateDistribution,
        hasCustomDistribution,
        // Custom hours-related exports
        setCustomHours,
        clearCustomHours,
        hasCustomHours,
        // Task breakdown for cost summary
        getMemberTaskBreakdown,
    } = useTeamDistribution(appTasks, initialState, handleUpdateTaskWeight, sizeMultiplier);

    const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
        setAppTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    };

    // Handle importing team configuration
    const handleImportTeam = (config: TeamDistributionState) => {
        // Update the initial state to trigger hook re-initialization
        setInitialState(config);
    };

    // Handle PDF export
    const handlePdfExport = (options: PDFExportOptions) => {
        try {
            // Filter parent task groups to only include active ones
            const activeGroups = parentTaskGroups.filter(g => {
                const task = appTasks.find(t => t.id === g.appTaskId);
                return task?.included ?? false;
            });

            generateTeamDistributionPDF({
                options,
                teamMembers,
                assignments,
                settings,
                parentTaskGroups: activeGroups,
                getScaledHours,
                getMemberCost,
                getMemberHours,
                getMemberDistributionShare,
                projectName: projectData?.projectName || 'Project',
                clientName: projectData?.clientName || 'Client',
            });

            toast({ description: "PDF exported successfully" });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                variant: "destructive",
                title: "Export failed",
                description: "There was an error generating the PDF.",
            });
        }
    };

    // Auto-save changes to project storage
    useEffect(() => {
        if (!isDataLoaded) return;

        const projectId = getCurrentProjectId();
        if (projectId) {
            const project = getProjectById(projectId);
            if (project) {
                // IMPORTANT: prevent overwriting valid storage with empty data 
                // if we are still in the middle of initialization
                const storageHasTeamMemberData = !!project.data?.teamDistribution?.teamMembers?.length;
                if (storageHasTeamMemberData && teamMembers.length === 0) {
                    console.log("Skipping auto-save: Hook state is empty but storage has data.");
                    return;
                }
                const updatedProject = {
                    ...project,
                    data: {
                        ...project.data,
                        tasks: appTasks,
                        teamDistribution: {
                            teamMembers,
                            assignments,
                            settings,
                            customDistributions,
                            customHours
                        }
                    },
                    lastModified: new Date().toISOString()
                };

                // We use saveProject directly from storage-utils to avoid full page reloads 
                // or context updates that might cause loops
                import("@/utils/storage-utils").then(({ saveProject }) => {
                    saveProject(updatedProject);
                });
            }
        }
    }, [teamMembers, assignments, settings, customDistributions, customHours, appTasks, isDataLoaded]);

    useEffect(() => {
        if (!loading && !user) {
            navigate("/auth");
        }
    }, [user, loading, navigate]);

    if (loading || !isDataLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[url('/lovable-uploads/803cb05d-3aed-444e-8e0d-182ccc143f72.png')] bg-fixed bg-cover">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="h-screen flex flex-col bg-[url('/lovable-uploads/803cb05d-3aed-444e-8e0d-182ccc143f72.png')] bg-fixed bg-cover overflow-hidden">
            <header className="bg-inphinity-950/90 backdrop-blur-sm text-white py-2 px-4 flex-shrink-0 border-b border-white/10">
                <div className="flex justify-between items-center h-10">
                    <div className="flex items-center gap-2">
                        <img
                            src="/lovable-uploads/41b00d8c-ab4e-4fc4-83af-e29dc46e871f.png"
                            alt="Inphinity Design Logo"
                            className="h-8 w-8"
                        />
                        <h1 className="text-lg font-bold hidden sm:block">
                            <span className="text-gold">Inphinity</span> Fee Calculator
                        </h1>
                    </div>

                    {/* Compact Header Summary (Minimized Mode) */}
                    {viewMode === 'grid' && teamMembers.length > 0 && (
                        <div className="hidden lg:flex items-center gap-8 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                                <span className="text-xs uppercase tracking-widest text-muted-foreground font-black">Total Team Fees</span>
                                <span className="text-lg font-black text-gold tabular-nums leading-none">
                                    {formatCurrency(getTotalProjectCost())}
                                </span>
                            </div>
                            <div className="flex items-center gap-6">
                                {teamMembers.slice(0, 3).map(member => (
                                    <div key={member.id} className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{member.name}</span>
                                        <span className="text-sm font-bold text-white tabular-nums leading-none">
                                            {formatCurrency(getMemberCost(member.id))}
                                        </span>
                                    </div>
                                ))}
                                {teamMembers.length > 3 && (
                                    <span className="text-xs text-muted-foreground font-bold bg-white/5 px-2 py-0.5 rounded">+{teamMembers.length - 3}</span>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('summary')}
                                className="h-7 px-3 text-xs font-black text-gold hover:text-white hover:bg-gold/20 transition-all uppercase tracking-widest border border-gold/30 rounded-full ml-4"
                            >
                                EXPAND SUMMARY
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <MainNavigation />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={signOut}
                            className="text-white hover:text-gold h-8 px-2"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 overflow-auto">
                <div className="max-w-full mx-auto h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-white">
                                {viewMode === 'grid' ? 'Team Distribution' : viewMode === 'sidebar' ? 'Team Distribution & Summary' : 'Cost Summary Breakdown'}
                            </h2>
                            {viewMode !== 'grid' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className="bg-white/5 border-gold/50 text-gold hover:bg-gold hover:text-black transition-colors"
                                >
                                    Back to Planning Matrix
                                </Button>
                            )}
                        </div>
                        {viewMode === 'grid' && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setImportDialogOpen(true)}
                                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import Team
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setExportDialogOpen(true)}
                                    disabled={teamMembers.length === 0}
                                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Team
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPdfExportDialogOpen(true)}
                                    disabled={teamMembers.length === 0}
                                    className="bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
                                >
                                    <FileDown className="h-4 w-4 mr-2" />
                                    Export PDF
                                </Button>
                                <AddTeamMemberDialog onAdd={addTeamMember} />
                            </div>
                        )}
                    </div>

                    {/* Main Layout: Matrix OR Sidebar OR Full Cost Summary */}
                    <div className="flex-1 min-h-0 overflow-auto">
                        {viewMode === 'grid' ? (
                            <div className="h-full">
                                <TeamDistributionMatrix
                                    parentTaskGroups={parentTaskGroups}
                                    teamMembers={teamMembers}
                                    assignments={assignments}
                                    settings={settings}
                                    getScaledHours={getScaledHours}
                                    getSubTaskAssignments={getSubTaskAssignments}
                                    toggleAssignment={toggleAssignment}
                                    onRemoveMember={removeTeamMember}
                                    onUpdateMember={updateTeamMember}
                                    appTasks={appTasks}
                                    onUpdateTask={handleUpdateTask}
                                    getRoleAssignees={getRoleAssignees}
                                    updateDistribution={updateDistribution}
                                    hasCustomDistribution={hasCustomDistribution}
                                    getMemberDistributionShare={getMemberDistributionShare}
                                    setCustomHours={setCustomHours}
                                    clearCustomHours={clearCustomHours}
                                    hasCustomHours={hasCustomHours}
                                />
                            </div>
                        ) : viewMode === 'sidebar' ? (
                            <div className="h-full overflow-hidden flex flex-col lg:grid lg:grid-cols-[1fr_350px] gap-4">
                                <div className="min-h-0 overflow-hidden flex flex-col">
                                    <TeamDistributionMatrix
                                        parentTaskGroups={parentTaskGroups}
                                        teamMembers={teamMembers}
                                        assignments={assignments}
                                        settings={settings}
                                        getScaledHours={getScaledHours}
                                        getSubTaskAssignments={getSubTaskAssignments}
                                        toggleAssignment={toggleAssignment}
                                        onRemoveMember={removeTeamMember}
                                        onUpdateMember={updateTeamMember}
                                        appTasks={appTasks}
                                        onUpdateTask={handleUpdateTask}
                                        getRoleAssignees={getRoleAssignees}
                                        updateDistribution={updateDistribution}
                                        hasCustomDistribution={hasCustomDistribution}
                                        getMemberDistributionShare={getMemberDistributionShare}
                                        setCustomHours={setCustomHours}
                                        clearCustomHours={clearCustomHours}
                                        hasCustomHours={hasCustomHours}
                                    />
                                </div>
                                <div className="hidden lg:block overflow-auto">
                                    <CostSummaryPanel
                                        teamMembers={teamMembers}
                                        getMemberCost={getMemberCost}
                                        getMemberHours={getMemberHours}
                                        getTotalProjectCost={getTotalProjectCost}
                                        settings={settings}
                                        onSettingsChange={updateSettings}
                                        projectData={projectData}
                                        onMaximize={() => setViewMode('summary')}
                                        onCollapse={() => setViewMode('grid')}
                                        getMemberTaskBreakdown={getMemberTaskBreakdown}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="h-full max-w-5xl mx-auto overflow-auto pb-8">
                                <CostSummaryPanel
                                    teamMembers={teamMembers}
                                    getMemberCost={getMemberCost}
                                    getMemberHours={getMemberHours}
                                    getTotalProjectCost={getTotalProjectCost}
                                    settings={settings}
                                    onSettingsChange={updateSettings}
                                    fullView={true}
                                    projectData={projectData}
                                    onMoveToSidebar={() => setViewMode('sidebar')}
                                    getMemberTaskBreakdown={getMemberTaskBreakdown}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Export/Import Dialogs */}
            <ExportTeamDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                teamConfig={{
                    teamMembers,
                    assignments,
                    settings,
                    customDistributions,
                    customHours
                }}
            />
            <ImportTeamDialog
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
                onImport={handleImportTeam}
            />
            <PDFExportDialog
                open={pdfExportDialogOpen}
                onOpenChange={setPdfExportDialogOpen}
                teamMembers={teamMembers}
                assignments={assignments}
                settings={settings}
                parentTaskGroups={parentTaskGroups.filter(g => {
                    const task = appTasks.find(t => t.id === g.appTaskId);
                    return task?.included ?? false;
                })}
                getScaledHours={getScaledHours}
                getMemberCost={getMemberCost}
                getMemberHours={getMemberHours}
                getMemberDistributionShare={getMemberDistributionShare}
                onExport={handlePdfExport}
            />
        </div>
    );
};

export default TeamDistribution;
