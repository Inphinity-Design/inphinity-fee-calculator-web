
import { SavedProject } from "@/utils/storage-utils";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { format } from "date-fns";

interface ProjectListProps {
  projects: SavedProject[];
  currentProjectId: string | null;
  onLoad: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

const ProjectList = ({
  projects,
  currentProjectId,
  onLoad,
  onDelete,
}: ProjectListProps) => {
  // Sort projects by last modified date (newest first)
  const sortedProjects = [...projects].sort((a, b) => {
    return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
  });
  
  return (
    <div className="overflow-y-auto max-h-[300px] pr-1">
      {sortedProjects.map((project) => {
        const isActive = project.id === currentProjectId;
        const modifiedDate = new Date(project.lastModified);
        
        return (
          <div
            key={project.id}
            className={`
              p-3 mb-2 rounded-md border flex justify-between items-center cursor-pointer
              ${isActive ? "border-gold bg-muted" : "border-border hover:bg-accent"}
            `}
            onClick={() => !isActive && onLoad(project.id)}
          >
            <div className="overflow-hidden">
              <div className="font-medium truncate">
                {project.name || "Unnamed Project"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {project.clientName} • {format(modifiedDate, 'MMM d, yyyy, h:mm a')}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
            >
              <TrashIcon className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectList;
