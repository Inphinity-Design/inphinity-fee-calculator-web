import { SavedProject } from "@/utils/storage-utils";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LoadProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedProjects: SavedProject[];
  currentProjectId: string | null;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

const LoadProjectDialog = ({
  open,
  onOpenChange,
  savedProjects,
  currentProjectId,
  onLoad,
  onDelete,
}: LoadProjectDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Load Project</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          {savedProjects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No saved projects found
            </p>
          ) : (
            <div className="space-y-2">
              {savedProjects.map((project) => (
                <div
                  key={project.id}
                  className={`flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-accent transition-colors ${
                    project.id === currentProjectId ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    onLoad(project.id);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{project.name || "Untitled"}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {project.clientName || "No client"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(project.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(project.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LoadProjectDialog;
