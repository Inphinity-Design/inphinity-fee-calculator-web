import { Dispatch, SetStateAction } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { ProjectData } from "@/types/calculator";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ProjectInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectData: ProjectData;
  setProjectData: Dispatch<SetStateAction<ProjectData>>;
}

const ProjectInfoDialog = ({ 
  open, 
  onOpenChange, 
  projectData, 
  setProjectData 
}: ProjectInfoDialogProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle>Project Information</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={projectData.clientName}
              onChange={(e) =>
                setProjectData((prev) => ({
                  ...prev,
                  clientName: e.target.value,
                }))
              }
              placeholder="Enter client name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectData.projectName}
              onChange={(e) =>
                setProjectData((prev) => ({
                  ...prev,
                  projectName: e.target.value,
                }))
              }
              placeholder="Enter project name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={projectData.location || ""}
              onChange={(e) =>
                setProjectData((prev) => ({
                  ...prev,
                  location: e.target.value,
                }))
              }
              placeholder="Enter project location"
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !projectData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {projectData.date ? (
                    format(projectData.date, "PPP")
                  ) : (
                    <span>Select a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={projectData.date}
                  onSelect={(date) =>
                    setProjectData((prev) => ({
                      ...prev,
                      date,
                    }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProjectInfoDialog;
