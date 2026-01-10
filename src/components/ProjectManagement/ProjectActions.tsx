
import { useState } from "react";
import { SaveIcon, FolderOpenIcon, TrashIcon, Download, Upload, Plus } from "lucide-react";
import { ProjectData } from "@/types/calculator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SavedProject } from "@/utils/storage-utils";
import ProjectList from "./ProjectList";
import { toast } from "@/components/ui/use-toast";

interface ProjectActionsProps {
  currentProject: ProjectData;
  savedProjects: SavedProject[];
  currentProjectId: string | null;
  projectName: string;
  onSave: (project: ProjectData) => void;
  onLoad: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onExport: (project: ProjectData) => void;
  onImport: (file: File) => void;
  onNew: () => void;
}

const ProjectActions = ({
  currentProject,
  savedProjects,
  currentProjectId,
  projectName,
  onSave,
  onLoad,
  onDelete,
  onExport,
  onImport,
  onNew,
}: ProjectActionsProps) => {
  const [openLoadDialog, setOpenLoadDialog] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleImportClick = () => {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    // Handle file selection
    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        onImport(target.files[0]);
      }
    };
    
    // Append to body, trigger click, then remove
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  };

  const handleDeleteRequest = (id: string) => {
    setProjectToDelete(id);
    setOpenConfirmDelete(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      onDelete(projectToDelete);
      setOpenConfirmDelete(false);
      setProjectToDelete(null);
      
      // Close the load dialog if open
      if (openLoadDialog) {
        setOpenLoadDialog(false);
      }
    }
  };

  return (
    <div className="flex items-center space-x-2 mb-4">
      <TooltipProvider>
        {/* Save button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={() => onSave(currentProject)} variant="outline">
              <SaveIcon className="mr-1 h-4 w-4" />
              {currentProjectId ? "Save" : "Save As"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save current project</p>
          </TooltipContent>
        </Tooltip>

        {/* Load button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Dialog open={openLoadDialog} onOpenChange={setOpenLoadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FolderOpenIcon className="mr-1 h-4 w-4" />
                  Load
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Load Project</DialogTitle>
                  <DialogDescription>
                    Select a previously saved project to load
                  </DialogDescription>
                </DialogHeader>
                
                {savedProjects.length > 0 ? (
                  <ProjectList 
                    projects={savedProjects} 
                    currentProjectId={currentProjectId}
                    onLoad={projectId => {
                      onLoad(projectId);
                      setOpenLoadDialog(false);
                    }}
                    onDelete={handleDeleteRequest}
                  />
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    No saved projects found
                  </div>
                )}
                
                <DialogFooter className="sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenLoadDialog(false)}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TooltipTrigger>
          <TooltipContent>
            <p>Load saved project</p>
          </TooltipContent>
        </Tooltip>

        {/* New Project Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={onNew} variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              New
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Start a new project</p>
          </TooltipContent>
        </Tooltip>

        {/* Export button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={() => onExport(currentProject)} variant="outline">
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export project as JSON</p>
          </TooltipContent>
        </Tooltip>

        {/* Import button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleImportClick} variant="outline">
              <Upload className="mr-1 h-4 w-4" />
              Import
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Import project from JSON</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Delete confirmation dialog */}
      <Dialog open={openConfirmDelete} onOpenChange={setOpenConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpenConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectActions;
