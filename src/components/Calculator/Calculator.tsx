import { useState, useEffect, useRef } from "react";
import CalculatorLayout from "./CalculatorLayout";
import SidebarNav from "./SidebarNav";
import ProjectInfoDialog from "./ProjectInfoDialog";
import ConsultationDialog from "./ConsultationDialog";
import ConsultantsDialog from "./ConsultantsDialog";
import CompactDwellingForm from "./CompactDwellingForm";
import TasksForm from "./TasksForm";
import FeeSummaryPanel from "./FeeSummaryPanel";
import LoadProjectDialog from "./LoadProjectDialog";
import { ProjectData, Task, TaskComplexity, Dwelling, ConsultationTimeEstimate, Consultant } from "@/types/calculator";
import { toast } from "@/components/ui/use-toast";
import { useProjectStorage } from "@/hooks/use-project-storage";
import { getProjectById, getCurrentProjectId, prepareLoadedProject, saveProject, prepareProjectForSave } from "@/utils/storage-utils";

const initialTasks: Task[] = [
  // BASELINE TASKS (new order: Market > Land Eval > Consultant > Design Ideation > Testing > Visualization)
  { id: "task-8", name: "Market and Trend Analysis", weight: 9, included: true, complexity: "normal" as TaskComplexity, category: "baseline" },
  { id: "task-1", name: "Land Evaluation and Site Analysis", weight: 37, included: true, complexity: "normal" as TaskComplexity, category: "baseline" },
  { id: "task-2", name: "Consultant & Contractors Research", weight: 6, included: true, complexity: "normal" as TaskComplexity, category: "baseline" },
  { id: "task-3", name: "Design Ideation", weight: 28, included: true, complexity: "normal" as TaskComplexity, category: "baseline" },
  { id: "task-5", name: "Design Testing & Refinement", weight: 45, included: true, complexity: "normal" as TaskComplexity, category: "baseline" },
  { id: "task-6", name: "Visualization", weight: 51, included: true, complexity: "normal" as TaskComplexity, category: "baseline" },

  // ADD-ON TASKS
  { id: "task-4", name: "Masterplan", weight: 69, included: true, complexity: "normal" as TaskComplexity, category: "addon-masterplan" },
  { id: "task-7", name: "Interior Design", weight: 65, included: true, complexity: "normal" as TaskComplexity, category: "addon-interiors" },
];

const initialConsultationEstimate: ConsultationTimeEstimate = {
  hourlyRate: 150,
  hours: 0
};

const initialProjectData: ProjectData = {
  clientName: "",
  projectName: "",
  date: new Date(),
  dwellings: [],
  tasks: [...initialTasks],
  consultationEstimate: initialConsultationEstimate
};

const Calculator = () => {
  const [projectData, setProjectData] = useState<ProjectData>({...initialProjectData});
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // UI State for dialogs and sections
  const [visibleSections, setVisibleSections] = useState({
    projectDetails: true,
    mainTasks: true,
  });
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [consultantsOpen, setConsultantsOpen] = useState(false);
  const [loadProjectOpen, setLoadProjectOpen] = useState(false);

  // Load current project data when component mounts
  useEffect(() => {
    const loadProjectData = () => {
      const currentProjectId = getCurrentProjectId();
      console.log("Calculator mounting, current project ID:", currentProjectId);

      if (currentProjectId) {
        const savedProject = getProjectById(currentProjectId);
        console.log("Found saved project:", savedProject);

        if (savedProject) {
          const loadedProjectData = prepareLoadedProject(savedProject);
          console.log("Loaded project data on Calculator mount:", loadedProjectData);

          const validatedDwellings = Array.isArray(loadedProjectData.dwellings)
            ? loadedProjectData.dwellings.map(dwelling => ({
                id: dwelling.id || `dwelling-${Date.now()}`,
                size: typeof dwelling.size === 'number' ? dwelling.size : 0,
                complexity: typeof dwelling.complexity === 'number' ? dwelling.complexity : 3,
                description: typeof dwelling.description === 'string' ? dwelling.description : '',
                fee: typeof dwelling.fee === 'number' ? dwelling.fee : 0,
                timeEstimate: dwelling.timeEstimate,
                cappedHours: dwelling.cappedHours,
                hourlyRate: dwelling.hourlyRate
              } as Dwelling))
            : [];

          const tasksWithCategories = Array.isArray(loadedProjectData.tasks) && loadedProjectData.tasks.length > 0
            ? loadedProjectData.tasks.map(task => ({
                ...task,
                category: task.category || (
                  task.id === "task-4" ? "addon-masterplan" :
                  task.id === "task-7" ? "addon-interiors" :
                  "baseline"
                )
              }))
            : [...initialTasks];

          const validatedProjectData = {
            ...loadedProjectData,
            dwellings: validatedDwellings,
            tasks: tasksWithCategories,
            // Ensure multiplierSettings is preserved from loaded data
            multiplierSettings: loadedProjectData.multiplierSettings
          };

          console.log("Loaded multiplier settings:", loadedProjectData.multiplierSettings);
          setProjectData(validatedProjectData);
        }
      }
      setIsDataLoaded(true);
    };

    loadProjectData();
  }, []);

  // Reload task weights and multiplier settings when tab becomes visible (in case user changed them on Team Distribution or Settings)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentProjectId = getCurrentProjectId();
        if (currentProjectId) {
          const savedProject = getProjectById(currentProjectId);
          if (savedProject?.data) {
            const updates: Partial<ProjectData> = {};

            // Reload tasks if they've changed
            if (savedProject.data.tasks && Array.isArray(savedProject.data.tasks)) {
              const tasksWithCategories = savedProject.data.tasks.map(task => ({
                ...task,
                category: task.category || (
                  task.id === "task-4" ? "addon-masterplan" :
                  task.id === "task-7" ? "addon-interiors" :
                  "baseline"
                )
              }));
              updates.tasks = tasksWithCategories;
              console.log("Reloaded task weights from storage on visibility change");
            }

            // Reload multiplier settings if they've changed
            if (savedProject.data.multiplierSettings) {
              updates.multiplierSettings = savedProject.data.multiplierSettings;
              console.log("Reloaded multiplier settings from storage on visibility change:", savedProject.data.multiplierSettings);
            }

            if (Object.keys(updates).length > 0) {
              setProjectData(prev => ({
                ...prev,
                ...updates
              }));
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleLoadProject = (loadedProject: ProjectData) => {
    setProjectData(loadedProject);
  };

  const { 
    savedProjects, 
    currentProjectId, 
    projectName, 
    clientName,
    isSaving,
    lastSaved,
    saveCurrentProject, 
    loadProject, 
    removeProject, 
    exportProject, 
    importProject 
  } = useProjectStorage(projectData, handleLoadProject);

  // Auto-save projectData when it changes (debounced)
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const hasMeaningfulData = 
      projectData.dwellings.length > 0 || 
      projectData.projectName || 
      projectData.clientName;
    
    if (!hasMeaningfulData) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      console.log("Auto-saving project data:", projectData);
      saveCurrentProject(projectData);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projectData, isDataLoaded, saveCurrentProject]);

  // Save on page unload/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDataLoaded && (projectData.dwellings.length > 0 || projectData.projectName)) {
        saveCurrentProject(projectData);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (isDataLoaded && (projectData.dwellings.length > 0 || projectData.projectName)) {
        saveCurrentProject(projectData);
      }
    };
  }, [projectData, isDataLoaded, saveCurrentProject]);

  const ensureProjectExists = () => {
    if (!currentProjectId) {
      const autoProjectData = {
        ...projectData,
        projectName: projectData.projectName || "Untitled Project",
        clientName: projectData.clientName || "No Client"
      };
      
      const savedProject = prepareProjectForSave(autoProjectData);
      saveProject(savedProject);
      return savedProject.id;
    }
    return currentProjectId;
  };

  const handleNewProject = () => {
    setProjectData({...initialProjectData});
    toast({ description: "Started new project" });
  };

  useEffect(() => {
    if (!Array.isArray(projectData.tasks) || projectData.tasks.length === 0) {
      setProjectData(prev => ({
        ...prev,
        tasks: [...initialTasks]
      }));
    }
  }, [projectData.tasks]);

  const handleDwellingsUpdate = (newDwellings: Dwelling[]) => {
    const safeNewDwellings = Array.isArray(newDwellings) ? newDwellings : [];
    
    if (safeNewDwellings.length > 0) {
      ensureProjectExists();
    }
    
    setProjectData(prev => ({
      ...prev,
      dwellings: safeNewDwellings
    }));
  };

  const handleTasksUpdate = (newTasks: Task[]) => {
    if (!Array.isArray(newTasks) || newTasks.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update tasks with invalid data",
      });
      return;
    }
    
    setProjectData(prev => ({
      ...prev,
      tasks: [...newTasks]
    }));
  };

  const handleConsultationUpdate = (newEstimate: ConsultationTimeEstimate) => {
    setProjectData(prev => ({
      ...prev,
      consultationEstimate: newEstimate
    }));
  };

  const handleConsultantsUpdate = (newConsultants: Consultant[]) => {
    setProjectData(prev => ({
      ...prev,
      consultants: newConsultants
    }));
  };

  const handleImportProject = (file: File) => {
    importProject(file, handleLoadProject);
  };

  const toggleSection = (section: 'projectDetails' | 'mainTasks') => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImportProject(file);
      }
    };
    input.click();
  };

  if (!isDataLoaded) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const sidebar = (
    <SidebarNav
      visibleSections={visibleSections}
      toggleSection={toggleSection}
      openProjectInfo={() => setProjectInfoOpen(true)}
      openConsultation={() => setConsultationOpen(true)}
      openConsultants={() => setConsultantsOpen(true)}
      onSave={() => saveCurrentProject(projectData, false)}
      onLoad={() => setLoadProjectOpen(true)}
      onNew={handleNewProject}
      onExport={() => exportProject(projectData)}
      onImport={handleImportClick}
      isSaving={isSaving}
      lastSaved={lastSaved}
    />
  );

  const mainContent = (
    <div className="space-y-4">
      {visibleSections.projectDetails && (
        <CompactDwellingForm 
          dwellings={projectData.dwellings} 
          setDwellings={handleDwellingsUpdate}
        />
      )}
      
      {visibleSections.mainTasks && (
        <TasksForm 
          tasks={Array.isArray(projectData.tasks) ? projectData.tasks : initialTasks}
          setTasks={handleTasksUpdate}
          dwellings={projectData.dwellings}
        />
      )}
    </div>
  );

  const summaryPanel = (
    <FeeSummaryPanel 
      projectData={projectData} 
      setProjectData={setProjectData}
    />
  );

  return (
    <>
      <CalculatorLayout 
        sidebar={sidebar}
        mainContent={mainContent}
        summaryPanel={summaryPanel}
      />
      
      {/* Dialogs */}
      <ProjectInfoDialog
        open={projectInfoOpen}
        onOpenChange={setProjectInfoOpen}
        projectData={projectData}
        setProjectData={setProjectData}
      />
      
      <ConsultationDialog
        open={consultationOpen}
        onOpenChange={setConsultationOpen}
        consultationEstimate={projectData.consultationEstimate}
        onUpdate={handleConsultationUpdate}
      />

      <ConsultantsDialog
        open={consultantsOpen}
        onOpenChange={setConsultantsOpen}
        consultants={projectData.consultants || []}
        onUpdate={handleConsultantsUpdate}
      />

      <LoadProjectDialog
        open={loadProjectOpen}
        onOpenChange={setLoadProjectOpen}
        savedProjects={savedProjects}
        currentProjectId={currentProjectId}
        onLoad={loadProject}
        onDelete={removeProject}
      />
    </>
  );
};

export default Calculator;
