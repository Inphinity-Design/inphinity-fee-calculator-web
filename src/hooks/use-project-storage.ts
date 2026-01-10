
import { useState, useEffect, useCallback } from 'react';
import { ProjectData } from '@/types/calculator';
import { toast } from '@/components/ui/use-toast';
import { 
  initializeStorage, 
  getSavedProjects, 
  saveProject, 
  deleteProject, 
  getProjectById, 
  getCurrentProjectId,
  saveCurrentProjectId,
  exportProjectToJson,
  prepareProjectForSave,
  prepareLoadedProject,
  SavedProject
} from '@/utils/storage-utils';

export const useProjectStorage = (
  initialProject: ProjectData,
  onProjectLoad: (project: ProjectData) => void
) => {
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');

  // Initialize storage and load saved projects
  useEffect(() => {
    initializeStorage();
    loadSavedProjects();
    
    // Try to load the last active project if available
    const lastProjectId = getCurrentProjectId();
    if (lastProjectId) {
      setCurrentProjectId(lastProjectId);
      const savedProject = getProjectById(lastProjectId);
      if (savedProject) {
        setProjectName(savedProject.name);
        setClientName(savedProject.clientName);
      }
    }
    
    setIsLoading(false);
  }, []);

  // Load saved projects from localStorage
  const loadSavedProjects = useCallback(() => {
    const { projects } = getSavedProjects();
    setSavedProjects(projects);
  }, []);

  // Save current project (silent - no toast)
  const saveCurrentProject = useCallback((project: ProjectData, silent: boolean = true) => {
    try {
      setIsSaving(true);
      
      // Use existing ID if available, otherwise create a new one
      const savedProject = prepareProjectForSave(project, currentProjectId || undefined);
      
      // Update state with project info
      setProjectName(savedProject.name);
      setClientName(savedProject.clientName);
      
      // Save to localStorage
      saveProject(savedProject);
      setCurrentProjectId(savedProject.id);
      
      // Refresh list of saved projects
      loadSavedProjects();
      
      // Update last saved time
      setLastSaved(new Date());
      setIsSaving(false);
      
      // Only show toast if not silent (manual save)
      if (!silent) {
        toast({
          description: "Project saved successfully",
        });
      }
      
      return savedProject.id;
    } catch (error) {
      console.error("Failed to save project:", error);
      setIsSaving(false);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "There was an error saving your project",
      });
      return null;
    }
  }, [currentProjectId, loadSavedProjects]);

  // Load a project by ID
  const loadProject = useCallback((id: string) => {
    try {
      const savedProject = getProjectById(id);
      if (!savedProject) {
        toast({
          variant: "destructive",
          title: "Load Failed",
          description: "Project not found",
        });
        return false;
      }
      
      // Set current project ID
      setCurrentProjectId(id);
      saveCurrentProjectId(id);
      
      // Update state with project info
      setProjectName(savedProject.name);
      setClientName(savedProject.clientName);
      
      // Convert the saved data back to the expected format
      const projectData = prepareLoadedProject(savedProject);
      
      // Call the callback to update the parent component
      onProjectLoad(projectData);
      
      toast({
        description: "Project loaded successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Failed to load project:", error);
      toast({
        variant: "destructive",
        title: "Load Failed",
        description: "There was an error loading your project",
      });
      return false;
    }
  }, [onProjectLoad]);

  // Delete a project
  const removeProject = useCallback((id: string) => {
    try {
      deleteProject(id);
      
      // If current project was deleted, clear current project ID
      if (id === currentProjectId) {
        setCurrentProjectId(null);
        setProjectName('');
        setClientName('');
      }
      
      // Refresh list of saved projects
      loadSavedProjects();
      
      toast({
        description: "Project deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "There was an error deleting your project",
      });
      return false;
    }
  }, [currentProjectId, loadSavedProjects]);

  // Export project as JSON file
  const exportProject = useCallback((project: ProjectData) => {
    try {
      const savedProject = prepareProjectForSave(project, currentProjectId || undefined);
      exportProjectToJson(savedProject);
      
      toast({
        description: "Project exported successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Failed to export project:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "There was an error exporting your project",
      });
      return false;
    }
  }, [currentProjectId]);

  // Import project from file
  const importProject = useCallback((file: File, onSuccess: (data: ProjectData) => void) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (!e.target || typeof e.target.result !== 'string') {
          throw new Error('Failed to read file');
        }
        
        const importedProject = JSON.parse(e.target.result) as SavedProject;
        
        // Validate the imported data structure
        if (!importedProject || !importedProject.data) {
          throw new Error('Invalid project format');
        }
        
        // Create a new ID for the imported project
        const newProject = {
          ...importedProject,
          id: crypto.randomUUID(),
          lastModified: new Date().toISOString()
        };
        
        // Save the imported project
        saveProject(newProject);
        setCurrentProjectId(newProject.id);
        
        // Update state with project info
        setProjectName(newProject.name);
        setClientName(newProject.clientName);
        
        // Convert the saved data back to the expected format
        const projectData = prepareLoadedProject(newProject);
        
        // Call the callback to update the parent component
        onSuccess(projectData);
        
        // Refresh list of saved projects
        loadSavedProjects();
        
        toast({
          description: "Project imported successfully",
        });
      } catch (error) {
        console.error("Failed to import project:", error);
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: "There was an error importing your project",
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "There was an error reading the file",
      });
    };
    
    reader.readAsText(file);
  }, [loadSavedProjects]);

  return {
    savedProjects,
    currentProjectId,
    isLoading,
    isSaving,
    lastSaved,
    projectName,
    clientName,
    saveCurrentProject,
    loadProject,
    removeProject,
    exportProject,
    importProject
  };
};
