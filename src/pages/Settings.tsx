import MainNavigation from "@/components/Navigation/MainNavigation";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, RotateCcw, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { getCurrentProjectId, getProjectById, saveProject } from "@/utils/storage-utils";
import {
  MultiplierSettings,
  DEFAULT_DWELLING_MULTIPLIERS,
  DEFAULT_TASK_MULTIPLIERS,
  DEFAULT_SCALING_TIERS,
  DwellingComplexityMultipliers,
  TaskComplexityMultipliers,
  ScalingTier,
} from "@/types/calculator";

const DWELLING_COMPLEXITY_LABELS: Record<keyof DwellingComplexityMultipliers, string> = {
  1: "Simple",
  2: "Below Average",
  3: "Standard",
  4: "Above Average",
  5: "Complex",
};

const TASK_COMPLEXITY_LABELS: Record<keyof TaskComplexityMultipliers, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
};

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState<string>("");
  const [hasProject, setHasProject] = useState<boolean>(false);

  const [dwellingMultipliers, setDwellingMultipliers] = useState<DwellingComplexityMultipliers>({
    ...DEFAULT_DWELLING_MULTIPLIERS,
  });

  const [taskMultipliers, setTaskMultipliers] = useState<TaskComplexityMultipliers>({
    ...DEFAULT_TASK_MULTIPLIERS,
  });

  const [scalingTiers, setScalingTiers] = useState<ScalingTier[]>([
    ...DEFAULT_SCALING_TIERS,
  ]);

  const [hasChanges, setHasChanges] = useState(false);

  // Load multiplier settings from current project
  useEffect(() => {
    const projectId = getCurrentProjectId();
    if (projectId) {
      const project = getProjectById(projectId);
      if (project?.data) {
        setProjectName(project.name || "Unnamed Project");
        setHasProject(true);

        // Load multiplier settings or use defaults
        if (project.data.multiplierSettings) {
          setDwellingMultipliers(project.data.multiplierSettings.dwellingComplexity);
          setTaskMultipliers(project.data.multiplierSettings.taskComplexity);
          
          if (project.data.multiplierSettings.projectSizeScaling) {
            setScalingTiers(project.data.multiplierSettings.projectSizeScaling);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleDwellingChange = (level: keyof DwellingComplexityMultipliers, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
      setDwellingMultipliers((prev) => ({ ...prev, [level]: numValue }));
      setHasChanges(true);
    }
  };

  const handleTaskChange = (level: keyof TaskComplexityMultipliers, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
      setTaskMultipliers((prev) => ({ ...prev, [level]: numValue }));
      setHasChanges(true);
    }
  };

  const handleUpdateTier = (index: number, field: keyof ScalingTier, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setScalingTiers(prev => {
        const newTiers = [...prev];
        newTiers[index] = { ...newTiers[index], [field]: numValue };
        return newTiers;
      });
      setHasChanges(true);
    }
  };

  const handleAddTier = () => {
    setScalingTiers(prev => {
        // Find logical next step
        const lastTier = prev[prev.length - 1];
        const newLimit = lastTier ? lastTier.limit + 100 : 100;
        const newMultiplier = lastTier ? lastTier.multiplier + 0.5 : 1.0;
        return [...prev, { limit: newLimit, multiplier: newMultiplier }];
    });
    setHasChanges(true);
  };

  const handleRemoveTier = (index: number) => {
    setScalingTiers(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleSave = () => {
    const projectId = getCurrentProjectId();
    if (!projectId) {
      toast({
        variant: "destructive",
        description: "No project selected. Please open a project first.",
      });
      return;
    }

    const project = getProjectById(projectId);
    if (!project) {
      toast({
        variant: "destructive",
        description: "Project not found.",
      });
      return;
    }

    const multiplierSettings: MultiplierSettings = {
      dwellingComplexity: dwellingMultipliers,
      taskComplexity: taskMultipliers,
      projectSizeScaling: scalingTiers,
    };

    const updatedProject = {
      ...project,
      data: {
        ...project.data,
        multiplierSettings,
      },
      lastModified: new Date().toISOString(),
    };

    saveProject(updatedProject);
    setHasChanges(false);
    toast({
      description: "Multiplier settings saved successfully!",
    });
  };

  const handleResetDwelling = () => {
    setDwellingMultipliers({ ...DEFAULT_DWELLING_MULTIPLIERS });
    setHasChanges(true);
  };

  const handleResetTask = () => {
    setTaskMultipliers({ ...DEFAULT_TASK_MULTIPLIERS });
    setHasChanges(true);
  };

  const handleResetScaling = () => {
    setScalingTiers([...DEFAULT_SCALING_TIERS]);
    setHasChanges(true);
  };

  const handleResetAll = () => {
    setDwellingMultipliers({ ...DEFAULT_DWELLING_MULTIPLIERS });
    setTaskMultipliers({ ...DEFAULT_TASK_MULTIPLIERS });
    setScalingTiers([...DEFAULT_SCALING_TIERS]);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[url('/lovable-uploads/803cb05d-3aed-444e-8e0d-182ccc143f72.png')] bg-fixed bg-cover">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[url('/lovable-uploads/803cb05d-3aed-444e-8e0d-182ccc143f72.png')] bg-fixed bg-cover overflow-hidden">
      <header className="bg-inphinity-950/90 backdrop-blur-sm text-white py-2 px-4 flex-shrink-0 border-b border-white/10">
        <div className="flex justify-between items-center h-10">
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/41b00d8c-ab4e-4fc4-83af-e29dc46e871f.png"
              alt="Inphinity Design Logo"
              className="h-8 w-8"
            />
            <h1 className="text-lg font-bold hidden sm:block">
              <span className="text-gold">Inphinity</span> Fee Calculator
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <MainNavigation />
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-white hover:text-gold h-8 px-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Project Settings</h2>
              {hasProject && (
                <p className="text-muted-foreground text-sm mt-1">
                  Configuring: <span className="text-gold font-medium">{projectName}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleResetAll}
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All to Defaults
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || !hasProject}
                className="bg-gold text-black hover:bg-gold/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>

          {!hasProject && (
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="pt-6">
                <p className="text-yellow-200 text-sm">
                  No project is currently selected. Please go to Project Input and create or load a
                  project to configure its multiplier settings.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Scaling Tiers Configuration */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-white">Project Size Scaling</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Define how task hours scale based on project area. Values between tiers are interpolated.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetScaling}
                className="text-muted-foreground hover:text-white"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-4 mb-2 px-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Project Size Limit (sqm)</Label>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Task Duration Increase-for team distrubution (x)</Label>
                    <div className="w-8"></div>
                </div>
                {scalingTiers.map((tier, index) => (
                    <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center">
                        <Input
                            type="number"
                            value={tier.limit}
                            onChange={(e) => handleUpdateTier(index, 'limit', e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                            disabled={!hasProject}
                        />
                         <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                step="0.1"
                                value={tier.multiplier}
                                onChange={(e) => handleUpdateTier(index, 'multiplier', e.target.value)}
                                className="bg-white/10 border-white/20 text-white"
                                disabled={!hasProject}
                            />
                            <span className="text-muted-foreground text-sm">x</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTier(index)}
                            disabled={!hasProject || scalingTiers.length <= 1}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title="Remove Tier"
                        >
                            <span className="sr-only">Remove</span>
                            ✕
                        </Button>
                    </div>
                ))}
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddTier}
                    disabled={!hasProject}
                    className="mt-2 bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                    + Add Scaling Tier
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dwelling Complexity Multipliers */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-white">Dwelling Complexity Multipliers</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Adjust the fee multiplier for each dwelling complexity level (1-5 slider)
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetDwelling}
                className="text-muted-foreground hover:text-white"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {(Object.keys(dwellingMultipliers) as unknown as (keyof DwellingComplexityMultipliers)[]).map(
                  (level) => (
                    <div key={level} className="space-y-2 min-w-[160px]">
                      <Label className="text-white text-sm whitespace-nowrap">
                        Level {level}: {DWELLING_COMPLEXITY_LABELS[level]}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.05"
                          min="0"
                          max="10"
                          value={dwellingMultipliers[level]}
                          onChange={(e) => handleDwellingChange(level, e.target.value)}
                          className="bg-white/10 border-white/20 text-white w-full"
                          disabled={!hasProject}
                        />
                        <span className="text-muted-foreground text-sm">x</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Default: {DEFAULT_DWELLING_MULTIPLIERS[level]}x
                      </p>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Task Complexity Multipliers */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-white">Task Complexity Multipliers</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Adjust the fee multiplier for each task complexity level (Low/Normal/High dropdown)
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetTask}
                className="text-muted-foreground hover:text-white"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {(Object.keys(taskMultipliers) as (keyof TaskComplexityMultipliers)[]).map((level) => (
                  <div key={level} className="space-y-2 min-w-[180px]">
                    <Label className="text-white text-sm">{TASK_COMPLEXITY_LABELS[level]}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.05"
                        min="0"
                        max="10"
                        value={taskMultipliers[level]}
                        onChange={(e) => handleTaskChange(level, e.target.value)}
                        className="bg-white/10 border-white/20 text-white w-full"
                        disabled={!hasProject}
                      />
                      <span className="text-muted-foreground text-sm">x</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Default: {DEFAULT_TASK_MULTIPLIERS[level]}x
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="pt-6">
              <h4 className="text-blue-200 font-medium mb-2">How Multipliers Work</h4>
              <ul className="text-blue-100/80 text-sm space-y-1 list-disc list-inside">
                <li>
                  <strong>Project Size Scaling</strong>: Determines how task hours scale based on project area. The system interpolates between tiers.
                </li>
                <li>
                  <strong>Dwelling Complexity</strong>: Applies to the overall project fee based on the
                  complexity slider (1-5) for each dwelling
                </li>
                <li>
                  <strong>Task Complexity</strong>: Applies to individual task fees based on the
                  Low/Normal/High dropdown for each task
                </li>
                <li>A multiplier of 1.0x means no change to the base fee</li>
                <li>Multipliers below 1.0x reduce the fee, above 1.0x increase it</li>
                <li>These settings are saved per-project and affect all fee calculations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
