
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Info, Lock, Unlock, RotateCcw, Check, DollarSign, Eye, EyeOff } from "lucide-react";
import { Task, TaskComplexity, Dwelling } from "@/types/calculator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getPerSqmRates } from "@/hooks/use-fee-calculator";
import { Separator } from "@/components/ui/separator";

interface TasksFormProps {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  dwellings: Dwelling[];
}

const defaultTaskWeights: Record<string, number> = {
  "task-1": 37,
  "task-2": 6,
  "task-3": 34,
  "task-4": 69,
  "task-5": 45,
  "task-6": 51,
  "task-7": 65,
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

const TasksForm = ({ tasks, setTasks, dwellings }: TasksFormProps) => {
  const taskList = Array.isArray(tasks) ? tasks : [];
  const [weightsLocked, setWeightsLocked] = useState<boolean>(true);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [bulkComplexity, setBulkComplexity] = useState<TaskComplexity | "">("");

  const totalProjectArea = dwellings.reduce((sum, dwelling) => sum + dwelling.size, 0);
  
  // Get per-sqm rates for current project size
  const rates = getPerSqmRates(totalProjectArea);
  
  // Group tasks by category
  const baselineTasks = taskList.filter(t => t.category === 'baseline');
  const addonTasks = taskList.filter(t => t.category !== 'baseline');
  
  // Check if all baseline tasks are included
  const allBaselineIncluded = baselineTasks.every(t => t.included);

  useEffect(() => {
    console.log("Tasks in TasksForm:", taskList);
  }, [taskList]);

  const toggleTaskInclusion = (taskId: string, included: boolean) => {
    console.log(`Toggling task ${taskId} to ${included ? 'included' : 'excluded'}`);
    
    try {
      const updatedTasks = taskList.map((task) =>
        task.id === taskId ? { ...task, included } : task
      );
      
      console.log("Updated tasks after toggle:", updatedTasks);
      setTasks(updatedTasks);
      toast({
        description: `Task ${included ? 'included' : 'excluded'}`
      });
    } catch (error) {
      console.error("Error toggling task inclusion:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task. Please try again.",
      });
    }
  };
  
  const toggleAllBaselineTasks = (included: boolean) => {
    console.log(`Toggling all baseline tasks to ${included ? 'included' : 'excluded'}`);
    
    try {
      const updatedTasks = taskList.map((task) =>
        task.category === 'baseline' ? { ...task, included } : task
      );
      
      console.log("Updated tasks after baseline toggle:", updatedTasks);
      setTasks(updatedTasks);
      toast({
        description: `All baseline tasks ${included ? 'included' : 'excluded'}`
      });
    } catch (error) {
      console.error("Error toggling baseline tasks:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update baseline tasks. Please try again.",
      });
    }
  };

  const setTaskComplexity = (taskId: string, complexity: TaskComplexity) => {
    console.log(`Setting task ${taskId} complexity to ${complexity}`);
    
    try {
      let updatedTasks;
      
      if (selectedTaskIds.length > 0 && selectedTaskIds.includes(taskId)) {
        console.log(`Bulk updating ${selectedTaskIds.length} selected tasks to ${complexity} complexity`);
        
        updatedTasks = taskList.map((task) =>
          selectedTaskIds.includes(task.id) && task.included
            ? { ...task, complexity }
            : task
        );
        
        toast({
          description: `Updated ${selectedTaskIds.length} tasks to ${complexity} complexity`
        });
      } else {
        updatedTasks = taskList.map((task) =>
          task.id === taskId ? { ...task, complexity } : task
        );
        
        toast({
          description: `Task complexity updated to ${complexity}`
        });
      }
      
      console.log("Updated tasks after complexity change:", updatedTasks);
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error setting task complexity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task complexity. Please try again.",
      });
    }
  };

  const updateTaskWeight = (taskId: string, weightStr: string) => {
    if (weightsLocked) {
      toast({
        description: "Weights are locked. Unlock to edit.",
      });
      return;
    }
    
    try {
      const weight = parseFloat(weightStr);
      
      if (isNaN(weight) || weight < 0) {
        toast({
          variant: "destructive",
          title: "Invalid Weight",
          description: "Weight must be a positive number.",
        });
        return;
      }
      
      console.log(`Updating task ${taskId} weight to ${weight}`);
      
      const updatedTasks = taskList.map((task) =>
        task.id === taskId ? { ...task, weight } : task
      );
      
      console.log("Updated tasks after weight change:", updatedTasks);
      setTasks(updatedTasks);
      toast({
        description: `Task weight updated to ${weight}`
      });
    } catch (error) {
      console.error("Error updating task weight:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task weight. Please try again.",
      });
    }
  };

  const resetTaskWeights = () => {
    try {
      const updatedTasks = taskList.map((task) => ({
        ...task,
        weight: defaultTaskWeights[task.id] || task.weight,
      }));
      
      console.log("Reset tasks to default weights:", updatedTasks);
      setTasks(updatedTasks);
      toast({
        description: "All task weights reset to default values",
      });
    } catch (error) {
      console.error("Error resetting task weights:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset task weights. Please try again.",
      });
    }
  };

  const toggleWeightsLock = () => {
    setWeightsLocked((prev) => !prev);
    toast({
      description: `Weights ${!weightsLocked ? 'locked' : 'unlocked'}`
    });
  };

  const toggleTaskSelection = (taskId: string) => {
    console.log("Toggling selection for task:", taskId);
    setSelectedTaskIds((prev) => {
      if (prev.includes(taskId)) {
        console.log("Removing task from selection:", taskId);
        return prev.filter(id => id !== taskId);
      } else {
        console.log("Adding task to selection:", taskId);
        return [...prev, taskId];
      }
    });
  };

  const applyBulkComplexity = () => {
    if (!bulkComplexity || selectedTaskIds.length === 0) {
      toast({
        description: "Please select tasks and a complexity level",
      });
      return;
    }

    try {
      const updatedTasks = taskList.map((task) =>
        selectedTaskIds.includes(task.id) && task.included
          ? { ...task, complexity: bulkComplexity as TaskComplexity }
          : task
      );
      
      console.log(`Applying ${bulkComplexity} complexity to ${selectedTaskIds.length} tasks`);
      console.log("Updated tasks after bulk complexity change:", updatedTasks);
      
      setTasks(updatedTasks);
      toast({
        description: `Updated ${selectedTaskIds.length} tasks to ${bulkComplexity} complexity`
      });
    } catch (error) {
      console.error("Error applying bulk complexity:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task complexity. Please try again.",
      });
    }
  };

  return (
    <div className="border rounded-lg bg-card/80 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Main Tasks</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetTaskWeights}
            className="flex items-center gap-1 h-8 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={toggleWeightsLock}
              >
                {weightsLocked ? 
                  <Lock className="h-4 w-4" /> : 
                  <Unlock className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {weightsLocked ? "Unlock weights to edit" : "Lock weights"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div>
        {selectedTaskIds.length > 0 && (
          <div className="flex items-center gap-4 mb-4 p-2 border rounded-md bg-muted/50">
            <div className="text-sm font-medium">
              {selectedTaskIds.length} tasks selected
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Select
                value={bulkComplexity}
                onValueChange={(value) => {
                  setBulkComplexity(value as TaskComplexity);
                  
                  if (value && selectedTaskIds.length > 0) {
                    const complexityValue = value as TaskComplexity;
                    const updatedTasks = taskList.map((task) =>
                      selectedTaskIds.includes(task.id) && task.included
                        ? { ...task, complexity: complexityValue }
                        : task
                    );
                    
                    console.log(`Applying ${value} complexity to ${selectedTaskIds.length} tasks`);
                    setTasks(updatedTasks);
                    toast({
                      description: `Updated ${selectedTaskIds.length} tasks to ${value} complexity`
                    });
                  }
                }}
              >
                <SelectTrigger className="h-9 w-[130px]">
                  <SelectValue placeholder="Set complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <Badge>Low</Badge>
                  </SelectItem>
                  <SelectItem value="normal">
                    <Badge>Normal</Badge>
                  </SelectItem>
                  <SelectItem value="high">
                    <Badge>High</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={applyBulkComplexity}
                disabled={!bulkComplexity}
              >
                Apply
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedTaskIds([])}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* BASELINE SECTION */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 p-3 bg-primary/5 rounded-md">
            <div className="flex items-center gap-3">
              <Checkbox
                id="baseline-all"
                checked={allBaselineIncluded}
                onCheckedChange={(checked) => toggleAllBaselineTasks(checked as boolean)}
              />
              <Label htmlFor="baseline-all" className="text-base font-semibold cursor-pointer">
                BASELINE (Architecture Only)
              </Label>
            </div>
            <div className="text-sm font-medium">
              {formatCurrency(rates.baseline)}/sqm
            </div>
          </div>

          <Table className="border-separate border-spacing-0">
            <TableHeader>
              <TableRow className="border-none">
                <TableHead className="border-none">Task</TableHead>
                <TableHead className="w-[170px] border-none">Complexity</TableHead>
                <TableHead className="w-[100px] border-none">Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {baselineTasks.length === 0 ? (
                <TableRow className="border-none">
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground border-none">
                    No baseline tasks available.
                  </TableCell>
                </TableRow>
              ) : (
                baselineTasks.map((task) => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  
                  return (
                    <TableRow 
                      key={task.id} 
                      className={`cursor-pointer hover:bg-primary/5 transition-all ${
                        isSelected ? 'selected-task' : ''
                      }`}
                      onClick={() => toggleTaskSelection(task.id)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.included}
                            onCheckedChange={(checked) => {
                              toggleTaskInclusion(task.id, checked as boolean);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex items-center">
                            <Label
                              htmlFor={`task-${task.id}`}
                              className={`${!task.included ? "text-muted-foreground" : ""}`}
                            >
                              {task.name}
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="w-[200px] text-sm">
                                    <p className="font-semibold mb-1">Task Weight: {task.weight}</p>
                                    <p className="mb-1">
                                      Weight represents the relative impact of this task on the overall
                                      project complexity.
                                    </p>
                                    <p className="font-semibold mb-1">Complexity Multipliers:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                      <li>Low: 0.8x</li>
                                      <li>Normal: 1.0x</li>
                                      <li>High: 1.2x</li>
                                    </ul>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Select
                          disabled={!task.included}
                          value={task.complexity}
                          onValueChange={(value) => {
                            setTaskComplexity(task.id, value as TaskComplexity);
                          }}
                        >
                          <SelectTrigger className="h-9" onClick={(e) => e.stopPropagation()}>
                            <SelectValue>
                              <div className="flex items-center">
                                <Badge variant="outline" className="bg-inphinity-500 text-white border-none">
                                  {task.complexity.charAt(0).toUpperCase() + task.complexity.slice(1)}
                                </Badge>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              <Badge>Low (0.8x)</Badge>
                            </SelectItem>
                            <SelectItem value="normal">
                              <Badge>Normal (1.0x)</Badge>
                            </SelectItem>
                            <SelectItem value="high">
                              <Badge>High (1.2x)</Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          type="number"
                          disabled={weightsLocked || !task.included}
                          value={task.weight}
                          onChange={(e) => {
                            updateTaskWeight(task.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-9 w-full"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Separator className="my-6" />

        {/* ADD-ONS SECTION */}
        <div className="mb-4">
          <div className="mb-3 p-3 bg-accent/30 rounded-md">
            <Label className="text-base font-semibold">ADD-ONS</Label>
          </div>

          <Table className="border-separate border-spacing-0">
            <TableHeader>
              <TableRow className="border-none">
                <TableHead className="border-none">Task</TableHead>
                <TableHead className="w-[170px] border-none">Complexity</TableHead>
                <TableHead className="w-[100px] border-none">Weight</TableHead>
                <TableHead className="w-[120px] text-right border-none">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addonTasks.length === 0 ? (
                <TableRow className="border-none">
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground border-none">
                    No add-on tasks available.
                  </TableCell>
                </TableRow>
              ) : (
                addonTasks.map((task) => {
                  const isSelected = selectedTaskIds.includes(task.id);
                  const rate = task.category === 'addon-interiors' ? rates.interiors : rates.masterplan;
                  
                  return (
                    <TableRow 
                      key={task.id} 
                      className={`cursor-pointer hover:bg-primary/5 transition-all ${
                        isSelected ? 'selected-task' : ''
                      }`}
                      onClick={() => toggleTaskSelection(task.id)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.included}
                            onCheckedChange={(checked) => {
                              toggleTaskInclusion(task.id, checked as boolean);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex items-center">
                            <Label
                              htmlFor={`task-${task.id}`}
                              className={`${!task.included ? "text-muted-foreground" : ""}`}
                            >
                              {task.name}
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="w-[200px] text-sm">
                                    <p className="font-semibold mb-1">Task Weight: {task.weight}</p>
                                    <p className="mb-1">
                                      Weight represents the relative impact of this task on the overall
                                      project complexity.
                                    </p>
                                    <p className="font-semibold mb-1">Complexity Multipliers:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                      <li>Low: 0.8x</li>
                                      <li>Normal: 1.0x</li>
                                      <li>High: 1.2x</li>
                                    </ul>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Select
                          disabled={!task.included}
                          value={task.complexity}
                          onValueChange={(value) => {
                            setTaskComplexity(task.id, value as TaskComplexity);
                          }}
                        >
                          <SelectTrigger className="h-9" onClick={(e) => e.stopPropagation()}>
                            <SelectValue>
                              <div className="flex items-center">
                                <Badge variant="outline" className="bg-inphinity-500 text-white border-none">
                                  {task.complexity.charAt(0).toUpperCase() + task.complexity.slice(1)}
                                </Badge>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              <Badge>Low (0.8x)</Badge>
                            </SelectItem>
                            <SelectItem value="normal">
                              <Badge>Normal (1.0x)</Badge>
                            </SelectItem>
                            <SelectItem value="high">
                              <Badge>High (1.2x)</Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          type="number"
                          disabled={weightsLocked || !task.included}
                          value={task.weight}
                          onChange={(e) => {
                            updateTaskWeight(task.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-9 w-full"
                        />
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <span className="text-sm font-medium">
                          {formatCurrency(rate)}/sqm
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
};

export default TasksForm;
