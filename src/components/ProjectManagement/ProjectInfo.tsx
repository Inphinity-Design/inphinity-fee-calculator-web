
import { useMemo } from "react";

interface ProjectInfoProps {
  projectName: string;
  clientName: string;
  dateModified?: string;
}

const ProjectInfo = ({ 
  projectName, 
  clientName,
  dateModified 
}: ProjectInfoProps) => {
  const formattedDate = useMemo(() => {
    if (!dateModified) return null;
    
    try {
      const date = new Date(dateModified);
      return new Intl.DateTimeFormat('en-US', { 
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch (e) {
      return null;
    }
  }, [dateModified]);
  
  return (
    <div className="mb-4 p-3 rounded-md bg-muted/50 border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">
            {projectName || "New Project"}
            {projectName && <span className="text-xs text-muted-foreground ml-2">
              {clientName && `(${clientName})`}
            </span>}
          </h3>
          
          {formattedDate && (
            <p className="text-xs text-muted-foreground">
              Last modified: {formattedDate}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectInfo;
