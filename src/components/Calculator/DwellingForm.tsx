import { Dispatch, SetStateAction, useCallback, useEffect, useRef } from "react";
import { Info } from "lucide-react";
import { Dwelling } from "@/types/calculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { saveProject, getCurrentProjectId, getProjectById, prepareProjectForSave } from "@/utils/storage-utils";

interface DwellingFormProps {
  dwellings: Dwelling[];
  setDwellings: Dispatch<SetStateAction<Dwelling[]>>;
}

const DwellingForm = ({ dwellings, setDwellings }: DwellingFormProps) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Get the first dwelling or create one if none exists
  const dwelling = dwellings.length > 0 ? dwellings[0] : null;

  // Auto-save that handles missing project IDs
  const saveChangesToStorage = useCallback((updatedDwellings: Dwelling[]) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      let currentProjectId = getCurrentProjectId();
      
      // If no project ID exists, create a project automatically
      if (!currentProjectId && updatedDwellings.length > 0) {
        console.log("No project ID found, creating auto-project for dwelling data");
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
      
      // Save to current project
      if (currentProjectId) {
        const currentProject = getProjectById(currentProjectId);
        
        if (currentProject) {
          const projectToSave = prepareProjectForSave({
            ...currentProject.data,
            dwellings: updatedDwellings
          }, currentProjectId);
          
          saveProject(projectToSave);
          console.log("Dwelling data auto-saved to project:", currentProjectId);
        }
      }
    }, 300);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Initialize with a single dwelling if none exists
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
    
    console.log(`Updating dwelling field: ${String(field)}, value:`, value);
    setDwellings(updatedDwellings);
    
    // Use debounced save for updates
    saveChangesToStorage(updatedDwellings);
  }, [dwelling, setDwellings, saveChangesToStorage]);

  if (!dwelling) {
    return null;
  }

  return (
    <Card className="mb-6 gold-border bg-card/90 backdrop-blur-sm gold-glow">
      <CardHeader className="card-header-accent">
        <CardTitle className="text-lg font-medium">Project Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="size" className="text-sm font-medium">
                Project Size (sqm) *
              </Label>
              <Input
                id="size"
                type="number"
                placeholder="Enter size in square meters"
                value={dwelling.size || ""}
                onChange={(e) => updateDwelling("size", parseFloat(e.target.value) || 0)}
                className="h-10"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="complexity" className="text-sm font-medium">
                  Project Complexity
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        <strong>1 (Simple):</strong> Basic designs, minimal customization<br/>
                        <strong>3 (Standard):</strong> Typical residential project<br/>
                        <strong>5 (Complex):</strong> Highly customized, challenging sites
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  id="complexity"
                  value={[dwelling.complexity]}
                  onValueChange={([value]) => updateDwelling("complexity", value)}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <div className="w-12 text-center font-semibold text-gold">
                  {dwelling.complexity}
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Simple</span>
                <span>Standard</span>
                <span>Complex</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Project Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the project (e.g., Single family home, Multi-unit development)"
              value={dwelling.description}
              onChange={(e) => updateDwelling("description", e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DwellingForm;
