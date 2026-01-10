import {
  FileText,
  Ruler,
  CheckSquare,
  Clock,
  Save,
  FolderOpen,
  FilePlus,
  Download,
  Upload,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { SaveIndicator } from "./SaveIndicator";

interface SidebarNavProps {
  visibleSections: {
    projectDetails: boolean;
    mainTasks: boolean;
  };
  toggleSection: (section: 'projectDetails' | 'mainTasks') => void;
  openProjectInfo: () => void;
  openConsultation: () => void;
  openConsultants: () => void;
  onSave: () => void;
  onLoad: () => void;
  onNew: () => void;
  onExport: () => void;
  onImport: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
}

const SidebarNav = ({
  visibleSections,
  toggleSection,
  openProjectInfo,
  openConsultation,
  openConsultants,
  onSave,
  onLoad,
  onNew,
  onExport,
  onImport,
  isSaving,
  lastSaved
}: SidebarNavProps) => {
  return (
    <TooltipProvider>
      <div className="flex flex-col h-full gap-1">
        {/* Section Toggles */}
        <div className="flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10"
                onClick={openProjectInfo}
              >
                <FileText className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Project Info</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={visibleSections.projectDetails ? "secondary" : "ghost"}
                size="icon"
                className="w-full h-10"
                onClick={() => toggleSection('projectDetails')}
              >
                <Ruler className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Project Details (Size & Complexity)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={visibleSections.mainTasks ? "secondary" : "ghost"}
                size="icon"
                className="w-full h-10"
                onClick={() => toggleSection('mainTasks')}
              >
                <CheckSquare className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Main Tasks</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10"
                onClick={openConsultation}
              >
                <Clock className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Consultation Time</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10"
                onClick={openConsultants}
              >
                <Briefcase className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>3rd Party Consultants</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator className="my-2" />

        {/* Project Actions */}
        <div className="flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10"
                onClick={onNew}
              >
                <FilePlus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>New Project</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10"
                onClick={onSave}
              >
                <Save className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Save Project</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10"
                onClick={onLoad}
              >
                <FolderOpen className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Load Project</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10"
                onClick={onExport}
              >
                <Download className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Export Project</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10"
                onClick={onImport}
              >
                <Upload className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Import Project</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Save Indicator at bottom */}
        <div className="mt-auto pt-2">
          <SaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SidebarNav;
