import { Dispatch, SetStateAction, useCallback, useEffect, useRef } from "react";
import { Info } from "lucide-react";
import { Dwelling } from "@/types/calculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { saveProject, getCurrentProjectId, getProjectById, prepareProjectForSave } from "@/utils/storage-utils";

interface CompactDwellingFormProps {
  dwellings: Dwelling[];
  setDwellings: Dispatch<SetStateAction<Dwelling[]>>;
}

const CompactDwellingForm = ({ dwellings, setDwellings }: CompactDwellingFormProps) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  const dwelling = dwellings.length > 0 ? dwellings[0] : null;

  const saveChangesToStorage = useCallback((updatedDwellings: Dwelling[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      let currentProjectId = getCurrentProjectId();
      
      if (!currentProjectId && updatedDwellings.length > 0) {
        const newProjectId = `project-${Date.now()}`;
        localStorage.setItem('inphinity-current-project', newProjectId);
        
        const newProject = {
          id: newProjectId,
          name: "Untitled Project",
          clientName: "New Client",
          lastModified: new Date().toISOString(),
          data: { dwellings: updatedDwellings }
        };
        
        const existingProjects = JSON.parse(localStorage.getItem('inphinity-saved-projects') || '{"projects":[]}');
        existingProjects.projects.push(newProject);
        localStorage.setItem('inphinity-saved-projects', JSON.stringify(existingProjects));
        
        currentProjectId = newProjectId;
      }
      
      if (currentProjectId) {
        const currentProject = getProjectById(currentProjectId);
        
        if (currentProject) {
          const projectToSave = prepareProjectForSave({
            ...currentProject.data,
            dwellings: updatedDwellings
          }, currentProjectId);
          
          saveProject(projectToSave);
        }
      }
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (dwellings.length === 0) {
      const newDwelling: Dwelling = {
        id: `dwelling-${Date.now()}`,
        size: 0,
        complexity: 3,
        description: "",
        fee: 0,
      };
      setDwellings([newDwelling]);
    }
  }, []);

  const updateDwelling = useCallback((field: keyof Dwelling, value: any) => {
    if (!dwelling) return;
    
    const updatedDwelling = { ...dwelling, [field]: value };
    const updatedDwellings = [updatedDwelling];
    
    setDwellings(updatedDwellings);
    saveChangesToStorage(updatedDwellings);
  }, [dwelling, setDwellings, saveChangesToStorage]);

  if (!dwelling) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card/80">
      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Project Details</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="size" className="text-sm">Size (sqm)</Label>
          <Input
            id="size"
            type="number"
            placeholder="0"
            value={dwelling.size || ""}
            onChange={(e) => updateDwelling("size", parseFloat(e.target.value) || 0)}
            className="h-9"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label htmlFor="complexity" className="text-sm">Complexity</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    <strong>1:</strong> Simple (0.75x)<br/>
                    <strong>3:</strong> Standard (1.0x)<br/>
                    <strong>5:</strong> Complex (1.4x)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-3">
            <Slider
              id="complexity"
              value={[dwelling.complexity]}
              onValueChange={([value]) => updateDwelling("complexity", value)}
              min={1}
              max={5}
              step={1}
              className="flex-1"
            />
            <span className="w-8 text-center font-semibold text-primary">
              {dwelling.complexity}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm">Description</Label>
        <Input
          id="description"
          placeholder="e.g., Single family home"
          value={dwelling.description}
          onChange={(e) => updateDwelling("description", e.target.value)}
          className="h-9"
        />
      </div>
    </div>
  );
};

export default CompactDwellingForm;
