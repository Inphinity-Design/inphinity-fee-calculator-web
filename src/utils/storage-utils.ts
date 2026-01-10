import { ProjectData, Task, Consultant, MultiplierSettings } from "@/types/calculator";

// Keys for localStorage
export const STORAGE_KEYS = {
  SAVED_PROJECTS: 'inphinity-saved-projects',
  CURRENT_PROJECT_ID: 'inphinity-current-project'
};

export interface SavedProject {
  id: string;
  name: string;
  clientName: string;
  lastModified: string;
  data: ProjectData;
}

export interface SavedProjectsState {
  projects: SavedProject[];
}

// Task weight migration mapping (old weight -> new weight)
const TASK_WEIGHT_MAPPING: Record<string, { old: number; new: number }> = {
  "task-1": { old: 30, new: 37 },
  "task-2": { old: 5, new: 6 },
  "task-3": { old: 28, new: 34 },
  "task-4": { old: 63, new: 69 },
  "task-5": { old: 37, new: 45 },
  "task-6": { old: 42, new: 51 },
  "task-7": { old: 60, new: 65 }
};

// Task category mapping based on task ID
const TASK_CATEGORY_MAPPING: Record<string, 'baseline' | 'addon-interiors' | 'addon-masterplan'> = {
  "task-1": "baseline",  // Land Evaluation
  "task-2": "baseline",  // Consultant Research
  "task-3": "baseline",  // Design Ideation
  "task-4": "addon-masterplan",  // Masterplan
  "task-5": "baseline",  // Design Testing
  "task-6": "baseline",  // Visualization
  "task-7": "addon-interiors",  // Interior Design
};

// Migrate task weights from old values to new values while preserving user settings
const migrateTaskWeights = (tasks: Task[]): Task[] => {
  return tasks.map(task => {
    const mapping = TASK_WEIGHT_MAPPING[task.id];
    
    // If task has a mapping and current weight matches old weight, update it
    if (mapping && task.weight === mapping.old) {
      console.log(`Migrating task ${task.id} weight from ${mapping.old} to ${mapping.new}`);
      return {
        ...task,
        weight: mapping.new
      };
    }
    
    // Otherwise, keep the task as is
    return task;
  });
};

// Migrate task categories for tasks loaded from storage that don't have category
const migrateTaskCategories = (tasks: Task[]): Task[] => {
  return tasks.map(task => {
    // If task already has category, keep it
    if (task.category) return task;
    
    // Otherwise, assign category based on task ID
    const category = TASK_CATEGORY_MAPPING[task.id] || 'baseline';
    console.log(`Migrating task ${task.id} to category: ${category}`);
    return { ...task, category };
  });
};

// Initialize storage with default values if not present
export const initializeStorage = (): void => {
  if (!localStorage.getItem(STORAGE_KEYS.SAVED_PROJECTS)) {
    localStorage.setItem(STORAGE_KEYS.SAVED_PROJECTS, JSON.stringify({ projects: [] }));
  }
};

// Get all saved projects
export const getSavedProjects = (): SavedProjectsState => {
  const projectsJson = localStorage.getItem(STORAGE_KEYS.SAVED_PROJECTS);
  if (!projectsJson) {
    return { projects: [] };
  }
  
  try {
    return JSON.parse(projectsJson);
  } catch (error) {
    console.error("Failed to parse saved projects:", error);
    return { projects: [] };
  }
};

// Save a project
export const saveProject = (project: SavedProject): void => {
  const { projects } = getSavedProjects();
  
  // Check if project already exists (update it)
  const existingIndex = projects.findIndex(p => p.id === project.id);
  
  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }
  
  localStorage.setItem(STORAGE_KEYS.SAVED_PROJECTS, JSON.stringify({ projects }));
  localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT_ID, project.id);
};

// Get a project by ID
export const getProjectById = (id: string): SavedProject | null => {
  const { projects } = getSavedProjects();
  const project = projects.find(p => p.id === id);
  return project || null;
};

// Delete a project
export const deleteProject = (id: string): void => {
  const { projects } = getSavedProjects();
  const filteredProjects = projects.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.SAVED_PROJECTS, JSON.stringify({ projects: filteredProjects }));
  
  // If current project was deleted, clear current project
  const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
  if (currentId === id) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
  }
};

// Save current project ID
export const saveCurrentProjectId = (id: string): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT_ID, id);
};

// Get current project ID
export const getCurrentProjectId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
};

// Export project as JSON file
export const exportProjectToJson = (project: SavedProject): void => {
  const dataStr = JSON.stringify(project, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
  
  // Create download link and trigger click
  const exportFileDefaultName = `${project.name || 'project'}-${new Date().toISOString().slice(0, 10)}.json`;
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  linkElement.remove();
};

// Helper to prepare project data for saving with better data validation
export const prepareProjectForSave = (project: ProjectData, existingId?: string): SavedProject => {
  // Preserve dwelling data exactly as provided by user - don't apply aggressive defaults
  const validatedDwellings = Array.isArray(project.dwellings) 
    ? project.dwellings.map(dwelling => {
        console.log("Saving dwelling data:", dwelling);
        return {
          id: dwelling.id || `dwelling-${Date.now()}`,
          size: dwelling.size, // Preserve exact value, don't default to 0
          complexity: dwelling.complexity, // Preserve exact value, don't default to 3
          description: dwelling.description, // Preserve exact value, don't default to empty string
          fee: dwelling.fee, // Preserve exact value, don't default to 0
          timeEstimate: dwelling.timeEstimate,
          cappedHours: dwelling.cappedHours,
          hourlyRate: dwelling.hourlyRate
        };
      })
    : [];

  console.log("Preparing project for save - original dwellings:", project.dwellings);
  console.log("Preparing project for save - validated dwellings:", validatedDwellings);

  // Handle date conversion safely
  let dateString: string | undefined;
  if (project.date) {
    if (typeof project.date === 'string') {
      dateString = project.date;
    } else if (project.date instanceof Date) {
      dateString = project.date.toISOString();
    } else {
      dateString = new Date().toISOString();
    }
  }

  // Validate consultants array
  const validatedConsultants: Consultant[] = Array.isArray(project.consultants)
    ? project.consultants.map(consultant => ({
        id: consultant.id || `consultant-${Date.now()}`,
        name: consultant.name || '',
        feeType: consultant.feeType || 'fixed',
        fixedFee: consultant.fixedFee,
        hourlyRate: consultant.hourlyRate,
        hours: consultant.hours,
        includeInProjectFee: consultant.includeInProjectFee ?? true
      }))
    : [];

  return {
    id: existingId || crypto.randomUUID(),
    name: project.projectName || 'Unnamed Project',
    clientName: project.clientName || 'No Client',
    lastModified: new Date().toISOString(),
    data: {
      ...project,
      dwellings: validatedDwellings,
      consultants: validatedConsultants,
      // Preserve multiplier settings if present
      multiplierSettings: project.multiplierSettings,
      // Convert Date objects to ISO strings for storage
      date: dateString
    } as any // Temporary type assertion for date string conversion
  };
};

// Helper to prepare loaded project data with better validation
export const prepareLoadedProject = (savedProject: SavedProject): ProjectData => {
  // Preserve dwelling data exactly as stored - don't apply aggressive defaults
  const validatedDwellings = Array.isArray(savedProject.data.dwellings) 
    ? savedProject.data.dwellings.map(dwelling => {
        console.log("Loading dwelling data:", dwelling);
        return {
          id: dwelling.id || `dwelling-${Date.now()}`,
          size: dwelling.size, // Use stored value directly
          complexity: dwelling.complexity, // Use stored value directly  
          description: dwelling.description, // Use stored value directly
          fee: dwelling.fee, // Use stored value directly
          timeEstimate: dwelling.timeEstimate,
          cappedHours: dwelling.cappedHours,
          hourlyRate: dwelling.hourlyRate
        };
      })
    : [];

  console.log("Preparing loaded project - original dwellings:", savedProject.data.dwellings);
  console.log("Preparing loaded project - validated dwellings:", validatedDwellings);

  // Migrate task weights and categories if needed (preserves complexity and inclusion status)
  const migratedTasks = Array.isArray(savedProject.data.tasks) 
    ? migrateTaskCategories(migrateTaskWeights(savedProject.data.tasks))
    : [];

  console.log("Preparing loaded project - migrated tasks:", migratedTasks);

  // Handle date conversion safely
  let dateObject: Date | undefined;
  if (savedProject.data.date) {
    if (typeof savedProject.data.date === 'string') {
      dateObject = new Date(savedProject.data.date);
    } else if (savedProject.data.date instanceof Date) {
      dateObject = savedProject.data.date;
    }
  }

  // Validate consultants array (for backward compatibility with projects without consultants)
  const validatedConsultants: Consultant[] = Array.isArray(savedProject.data.consultants)
    ? savedProject.data.consultants.map(consultant => ({
        id: consultant.id || `consultant-${Date.now()}`,
        name: consultant.name || '',
        feeType: consultant.feeType || 'fixed',
        fixedFee: consultant.fixedFee,
        hourlyRate: consultant.hourlyRate,
        hours: consultant.hours,
        includeInProjectFee: consultant.includeInProjectFee ?? true
      }))
    : [];

  return {
    ...savedProject.data,
    dwellings: validatedDwellings,
    tasks: migratedTasks,
    consultants: validatedConsultants,
    // Preserve multiplier settings if present
    multiplierSettings: savedProject.data.multiplierSettings,
    // Convert ISO date strings back to Date objects
    date: dateObject
  };
};
