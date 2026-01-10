
import { Dispatch, SetStateAction } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectInfoFormProps {
  projectData: ProjectData;
  setProjectData: Dispatch<SetStateAction<ProjectData>>;
}

const ProjectInfoForm = ({ projectData, setProjectData }: ProjectInfoFormProps) => {
  return (
    <Card className="mb-6 gold-border bg-card/90 backdrop-blur-sm gold-glow">
      <CardHeader className="card-header-accent">
        <CardTitle className="text-lg font-medium">Project Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              className="border-gold/70 focus-visible:ring-gold"
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
              className="border-gold/70 focus-visible:ring-gold"
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
              className="border-gold/70 focus-visible:ring-gold"
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal border-gold/70",
                    !projectData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gold" />
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
                  className={cn("p-3 pointer-events-auto border-gold/70")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectInfoForm;
