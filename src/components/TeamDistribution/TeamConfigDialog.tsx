import { useState, useRef } from "react";
import { SavedTeamConfiguration, TeamDistributionState } from "@/types/calculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, Upload, Users, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { exportTeamConfiguration, importTeamConfiguration, mergeTeamConfiguration } from "@/utils/team-storage-utils";
import { toast } from "@/components/ui/use-toast";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamConfig: TeamDistributionState;
}

export const ExportTeamDialog = ({
  open,
  onOpenChange,
  teamConfig,
}: ExportDialogProps) => {
  const [teamName, setTeamName] = useState("");

  const handleExport = () => {
    if (!teamName.trim()) {
      toast({
        variant: "destructive",
        description: "Please enter a team name",
      });
      return;
    }

    if (teamConfig.teamMembers.length === 0) {
      toast({
        variant: "destructive",
        description: "No team members to export",
      });
      return;
    }

    exportTeamConfiguration(teamConfig, teamName.trim());
    toast({ description: `Team "${teamName}" exported successfully` });
    setTeamName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Team Configuration
          </DialogTitle>
          <DialogDescription>
            Save your team members, roles, and task assignments for use in other projects.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Configuration Name</Label>
              <Input
                id="teamName"
                placeholder="e.g., Core Design Team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg space-y-1">
              <p className="text-sm font-medium">What will be exported:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>{teamConfig.teamMembers.length} team member(s)</li>
                <li>{teamConfig.assignments.length} task assignment(s)</li>
                <li>Lead/Implementer settings ({teamConfig.settings.leadPercentage}%/{teamConfig.settings.implementerPercentage}%)</li>
                {(teamConfig.customDistributions?.length || 0) > 0 && (
                  <li>{teamConfig.customDistributions?.length} custom distribution(s)</li>
                )}
                {(teamConfig.customHours?.length || 0) > 0 && (
                  <li>{teamConfig.customHours?.length} custom hour override(s)</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={teamConfig.teamMembers.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (config: TeamDistributionState) => void;
}

export const ImportTeamDialog = ({
  open,
  onOpenChange,
  onImport,
}: ImportDialogProps) => {
  const [importedConfig, setImportedConfig] = useState<SavedTeamConfiguration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportedConfig(null);

    try {
      const config = await importTeamConfiguration(file);
      setImportedConfig(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import file");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = () => {
    if (!importedConfig) return;

    const mergedConfig = mergeTeamConfiguration(importedConfig);
    onImport(mergedConfig);
    toast({ description: `Team "${importedConfig.name}" imported successfully` });
    setImportedConfig(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setImportedConfig(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Team Configuration
          </DialogTitle>
          <DialogDescription>
            Load a previously exported team configuration. This will replace your current team setup.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="team-import-file"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Team File (.json)
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {importedConfig && (
            <div className="p-4 border rounded-lg space-y-3 bg-card">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold">{importedConfig.name}</span>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>Exported: {new Date(importedConfig.exportDate).toLocaleDateString()}</p>
              </div>

              <div className="pt-2 border-t space-y-1">
                <p className="text-sm font-medium">Team Members:</p>
                <ul className="text-sm text-muted-foreground">
                  {importedConfig.teamMembers.map((member) => (
                    <li key={member.id} className="flex justify-between">
                      <span>{member.name}</span>
                      <span className="font-mono">${member.hourlyRate}/hr</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t">
                {importedConfig.assignments.length} task assignment(s) will be imported
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!importedConfig}>
            <Upload className="h-4 w-4 mr-2" />
            Import Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
