import { useState } from "react";
import { format } from "date-fns";
import { Download, ChevronDown, ChevronUp, Calculator, Eye, EyeOff, Clock, Lock, Unlock } from "lucide-react";
import { ProjectData, Dwelling, Task } from "@/types/calculator";
import { 
  useCalculateFees, 
  useBaseFee, 
  useComplexityMultiplier, 
  useTotalProjectArea,
  useTaskComplexityMultiplier,
  getPerSqmRates
} from "@/hooks/use-fee-calculator";
import { useConsultationCalculator } from "@/hooks/use-consultation-calculator";
import { useTimeEstimates } from "@/hooks/use-time-estimates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { generatePDF } from "@/utils/pdf-generator";
import { toast } from "@/components/ui/use-toast";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FeeBreakdownProps {
  projectData: ProjectData;
  setProjectData: React.Dispatch<React.SetStateAction<ProjectData>>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

const formatNumber = (value: number, decimals: number = 2) => {
  return value.toFixed(decimals);
};

const formatHours = (hours: number): string => {
  return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
};

const DwellingItem = ({ 
  dwelling, 
  tasks, 
  totalProjectArea, 
  timeEstimatesLocked,
  updateDwellingTimeEstimate,
  updateDwellingCappedHours
}: { 
  dwelling: Dwelling; 
  tasks: Task[]; 
  totalProjectArea: number;
  timeEstimatesLocked: boolean;
  updateDwellingTimeEstimate: (id: string, value: number) => void;
  updateDwellingCappedHours: (id: string, value: number) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalculations, setShowCalculations] = useState(false);
  
  const baseFee = useBaseFee(totalProjectArea, tasks);
  const complexityMultiplier = useComplexityMultiplier(dwelling.complexity);
  const dwellingProportion = totalProjectArea > 0 ? dwelling.size / totalProjectArea : 0;
  const rates = getPerSqmRates(totalProjectArea);
  
  // Calculate component fees
  const baselineEnabled = tasks.some(t => t.category === 'baseline' && t.included);
  const interiorsEnabled = tasks.some(t => t.category === 'addon-interiors' && t.included);
  const masterplanEnabled = tasks.some(t => t.category === 'addon-masterplan' && t.included);
  
  const baselineFee = baselineEnabled ? totalProjectArea * rates.baseline * dwellingProportion * complexityMultiplier : 0;
  const interiorsFee = interiorsEnabled ? totalProjectArea * rates.interiors * dwellingProportion * complexityMultiplier : 0;
  const masterplanFee = masterplanEnabled ? totalProjectArea * rates.masterplan * dwellingProportion * complexityMultiplier : 0;

  const getComplexityText = (complexity: number): string => {
    const texts: Record<number, string> = {
      1: "Simple (0.75x)",
      2: "Below Average (0.9x)",
      3: "Standard (1.0x)",
      4: "Above Average (1.2x)",
      5: "Complex (1.4x)",
    };
    return texts[complexity] || "Standard (1.0x)";
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg mb-4">
      <CollapsibleTrigger asChild>
        <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-accent">
          <div className="font-medium">
            {dwelling.size} sqm {dwelling.description ? `- ${dwelling.description.substring(0, 30)}${dwelling.description.length > 30 ? '...' : ''}` : ''}
          </div>
          <div className="flex items-center">
            <span className="font-semibold mr-4">{formatCurrency(dwelling.fee)}</span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 pt-0 space-y-4">
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Size:</p>
              <p>{dwelling.size} sqm</p>
            </div>
            <div>
              <p className="font-medium">Complexity Level:</p>
              <p>{dwelling.complexity} {getComplexityText(dwelling.complexity)}</p>
            </div>
            {dwelling.description && (
              <div className="md:col-span-2">
                <p className="font-medium">Description:</p>
                <p className="text-muted-foreground">{dwelling.description}</p>
              </div>
            )}
            
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Time Estimate:</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  disabled={timeEstimatesLocked}
                  value={dwelling.timeEstimate || 0}
                  onChange={(e) => updateDwellingTimeEstimate(dwelling.id, parseFloat(e.target.value) || 0)}
                  className="w-24 h-8"
                />
                <span>hours ({formatHours(dwelling.timeEstimate || 0)})</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Capped Hours:</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  disabled={timeEstimatesLocked}
                  value={dwelling.cappedHours || 0}
                  onChange={(e) => updateDwellingCappedHours(dwelling.id, parseFloat(e.target.value) || 0)}
                  className="w-24 h-8"
                />
                <span>hours ({formatHours(dwelling.cappedHours || 0)})</span>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={() => setShowCalculations(!showCalculations)}
          >
            {showCalculations ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Calculations
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View Calculations
              </>
            )}
          </Button>
          
          {showCalculations && (
            <div className="bg-muted/30 p-3 rounded-md text-sm">
              <h4 className="font-medium mb-2">Fee Calculation Details</h4>
              
              <div className="space-y-2">
                <div className="grid grid-cols-2">
                  <span>Total Project Area:</span>
                  <span className="font-mono">{totalProjectArea} sqm</span>
                </div>
                <div className="grid grid-cols-2">
                  <span>Dwelling Size:</span>
                  <span className="font-mono">{dwelling.size} sqm</span>
                </div>
                <div className="grid grid-cols-2">
                  <span>Dwelling Proportion:</span>
                  <span className="font-mono">{formatNumber(dwellingProportion * 100)}%</span>
                </div>
                <div className="grid grid-cols-2">
                  <span>Complexity Multiplier:</span>
                  <span className="font-mono">{formatNumber(complexityMultiplier)} ({dwelling.complexity}/5)</span>
                </div>
                
                <Separator className="my-2" />
                <h5 className="font-medium">Per-SQM Rates:</h5>
                
                {baselineEnabled && (
                  <>
                    <div className="grid grid-cols-2">
                      <span>Baseline Rate:</span>
                      <span className="font-mono">{formatCurrency(rates.baseline)}/sqm</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span>Baseline Fee:</span>
                      <span className="font-mono">{formatCurrency(baselineFee)}</span>
                    </div>
                  </>
                )}
                
                {interiorsEnabled && (
                  <>
                    <div className="grid grid-cols-2">
                      <span>Interiors Rate:</span>
                      <span className="font-mono">{formatCurrency(rates.interiors)}/sqm</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span>Interiors Fee:</span>
                      <span className="font-mono">{formatCurrency(interiorsFee)}</span>
                    </div>
                  </>
                )}
                
                {masterplanEnabled && (
                  <>
                    <div className="grid grid-cols-2">
                      <span>Masterplan Rate:</span>
                      <span className="font-mono">{formatCurrency(rates.masterplan)}/sqm</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span>Masterplan Fee:</span>
                      <span className="font-mono">{formatCurrency(masterplanFee)}</span>
                    </div>
                  </>
                )}
                
                <Separator className="my-2" />
                <div className="grid grid-cols-2 font-medium">
                  <span>Total Fee:</span>
                  <span className="font-mono">{formatCurrency(dwelling.fee)}</span>
                </div>
                <Separator className="my-2" />
                <div className="grid grid-cols-2 font-medium">
                  <span>Hourly Rate:</span>
                  <span className="font-mono">{formatCurrency(dwelling.hourlyRate || 150)}/hour</span>
                </div>
                <div className="grid grid-cols-2 font-medium">
                  <span>Capped Hours:</span>
                  <span className="font-mono">{formatNumber(dwelling.cappedHours || 0)} hours</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const FeeBreakdown = ({ projectData, setProjectData }: FeeBreakdownProps) => {
  const [showDetailedCalcs, setShowDetailedCalcs] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const validProjectData = {
    ...projectData,
    dwellings: Array.isArray(projectData.dwellings) ? projectData.dwellings : [],
    tasks: Array.isArray(projectData.tasks) ? projectData.tasks : [],
    timeEstimatesLocked: projectData.timeEstimatesLocked !== undefined ? projectData.timeEstimatesLocked : true
  };
  
  const { dwellingsWithFees, totalFee, totalProjectArea } = useCalculateFees(
    validProjectData.dwellings,
    validProjectData.tasks
  );
  
  
  const {
    totalConsultationFee,
    hourlyRate,
    hours
  } = useConsultationCalculator(
    validProjectData.consultationEstimate
  );

  const {
    dwellingsWithTimeEstimates,
    totalHours,
    totalCappedHours
  } = useTimeEstimates(dwellingsWithFees, validProjectData.tasks);
  
  const combinedTotalFee = totalFee + totalConsultationFee;
  
  // Get per-sqm rates for accordion display
  const rates = getPerSqmRates(totalProjectArea);

  const updateProjectWithCalculations = () => {
    setProjectData(prevData => ({
      ...prevData,
      dwellings: dwellingsWithTimeEstimates
    }));
  };

  const updateDwellingTimeEstimate = (id: string, timeEstimate: number) => {
    setProjectData(prevData => ({
      ...prevData,
      dwellings: prevData.dwellings.map(dwelling => 
        dwelling.id === id ? {...dwelling, timeEstimate} : dwelling
      )
    }));
  };

  const updateDwellingCappedHours = (id: string, cappedHours: number) => {
    setProjectData(prevData => ({
      ...prevData,
      dwellings: prevData.dwellings.map(dwelling => 
        dwelling.id === id ? {...dwelling, cappedHours} : dwelling
      )
    }));
  };
  
  const toggleTimeEstimatesLock = () => {
    setProjectData(prevData => ({
      ...prevData,
      timeEstimatesLocked: !prevData.timeEstimatesLocked
    }));

    toast({
      description: `Time estimates ${validProjectData.timeEstimatesLocked ? 'unlocked' : 'locked'}`
    });
  };
  
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      updateProjectWithCalculations();
      
      await generatePDF(
        validProjectData,
        dwellingsWithTimeEstimates, 
        totalFee, 
        totalConsultationFee
      );
      
      toast({
        description: "PDF proposal exported successfully.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error generating the PDF proposal.",
      });
    } finally {
      setExporting(false);
    }
  };

  const tasksArray = Array.isArray(validProjectData.tasks) ? validProjectData.tasks : [];
  const includedTasksCount = tasksArray.filter(task => task.included).length;
  const totalTasksCount = tasksArray.length;

  const hasRequiredFields = 
    validProjectData.clientName && validProjectData.clientName.trim() !== "" && 
    validProjectData.projectName && validProjectData.projectName.trim() !== "" && 
    validProjectData.date !== undefined &&
    Array.isArray(validProjectData.dwellings) && validProjectData.dwellings.length > 0 &&
    includedTasksCount > 0;

  const getDwellingSummary = () => {
    if (!Array.isArray(dwellingsWithTimeEstimates) || dwellingsWithTimeEstimates.length === 0) {
      return "No dwellings defined in this project.";
    }
    
    return dwellingsWithTimeEstimates.map((dwelling, index) => {
      const complexityText = {
        1: "Simple (0.75x)",
        2: "Below Average (0.9x)",
        3: "Standard (1.0x)",
        4: "Above Average (1.2x)",
        5: "Complex (1.4x)",
      }[dwelling.complexity] || "Standard";
      
      return `Dwelling ${index + 1}: ${dwelling.size} sqm, ${complexityText}${dwelling.description ? `, ${dwelling.description}` : ''}. Fee: ${formatCurrency(dwelling.fee)}, Time estimate: ${formatHours(dwelling.timeEstimate || 0)}, Capped hours: ${formatHours(dwelling.cappedHours || 0)}.`;
    }).join('\n\n');
  };

  return (
    <Card>
      <CardHeader className="bg-primary/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg font-medium">Fee Breakdown</CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleExportPDF} 
              disabled={!hasRequiredFields || exporting}
              className="whitespace-nowrap"
            >
              {exporting ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Proposal
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!Array.isArray(dwellingsWithFees) || dwellingsWithFees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Add at least one dwelling to calculate fees
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span>Client:</span>
                <span className="font-medium">{validProjectData.clientName || "Not specified"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Project:</span>
                <span className="font-medium">{validProjectData.projectName || "Not specified"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Date:</span>
                <span className="font-medium">
                  {validProjectData.date ? format(validProjectData.date, "PPP") : "Not specified"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Selected Tasks:</span>
                <span className="font-medium">
                  {includedTasksCount} of {totalTasksCount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Project Area:</span>
                <span className="font-medium">
                  {totalProjectArea} sqm
                </span>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-muted/30 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Project Summary</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={toggleTimeEstimatesLock}
                >
                  {validProjectData.timeEstimatesLocked ? 
                    <Lock className="h-4 w-4" /> : 
                    <Unlock className="h-4 w-4" />}
                  <span className="ml-1 text-xs">
                    {validProjectData.timeEstimatesLocked ? "Unlock Estimates" : "Lock Estimates"}
                  </span>
                </Button>
              </div>
              
              <div className="text-sm whitespace-pre-line bg-white p-3 rounded border">
                {getDwellingSummary()}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="font-medium">Total Project Fee:</p>
                  <p className="text-lg">{formatCurrency(combinedTotalFee)}</p>
                </div>
                <div>
                  <p className="font-medium">Total Project Area:</p>
                  <p>{totalProjectArea} sqm</p>
                </div>
                <div>
                  <p className="font-medium">Total Time Estimate:</p>
                  <p>{formatHours(totalHours)}</p>
                </div>
                <div>
                  <p className="font-medium">Total Capped Hours:</p>
                  <p>{formatHours(totalCappedHours)}</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="mb-6">
              <h3 className="font-medium mb-3">Stage 1: Design Fees</h3>
              <div className="space-y-2">
                {dwellingsWithTimeEstimates.map((dwelling) => (
                  <DwellingItem 
                    key={dwelling.id} 
                    dwelling={dwelling} 
                    tasks={validProjectData.tasks}
                    totalProjectArea={totalProjectArea}
                    timeEstimatesLocked={validProjectData.timeEstimatesLocked}
                    updateDwellingTimeEstimate={updateDwellingTimeEstimate}
                    updateDwellingCappedHours={updateDwellingCappedHours}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center text-lg font-medium mt-4 p-3 bg-muted/30 rounded-md">
                <span>Main Tasks Total:</span>
                <span>{formatCurrency(totalFee)}</span>
              </div>
            </div>
            
            {validProjectData.consultationEstimate && validProjectData.consultationEstimate.hours > 0 && (
              <>
                <Separator className="my-6" />
                
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Additional Consultation</h3>
                  <div className="space-y-4">
                    <div className="bg-muted/30 p-3 rounded-md">
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div>Hourly Rate:</div>
                        <div className="text-right font-mono">{formatCurrency(hourlyRate)}</div>
                        
                        <div>Number of Hours:</div>
                        <div className="text-right font-mono">{hours}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-lg font-medium p-3 bg-muted/30 rounded-md">
                      <span>Consultation Total:</span>
                      <span>{formatCurrency(totalConsultationFee)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <Separator className="my-6" />
            
            <div className="flex justify-between items-center text-lg font-bold mb-6 p-4 bg-primary/10 rounded-md">
              <span>Total Fee (All Services):</span>
              <span className="text-xl">{formatCurrency(combinedTotalFee)}</span>
            </div>

            <Separator className="my-6" />
            
            <Accordion type="single" collapsible className="border rounded-lg mb-4">
              <AccordionItem value="current-calculation" className="border-none">
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
                  <div className="flex items-center">
                    <Calculator className="h-4 w-4 mr-2" />
                    <span>Current Project Calculation Breakdown</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-3 bg-muted/20">
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-3 text-base">Project Inputs</h4>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Total Project Area</TableCell>
                            <TableCell className="text-right">{totalProjectArea} sqm</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Project Complexity</TableCell>
                            <TableCell className="text-right">{dwellingsWithFees[0]?.complexity || 3}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Selected Tasks</TableCell>
                            <TableCell className="text-right">{validProjectData.tasks.filter(t => t.included).length} of {validProjectData.tasks.length}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-3 text-base">Fee Calculation Steps</h4>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Total Project Area</TableCell>
                            <TableCell className="text-right">{totalProjectArea} sqm</TableCell>
                          </TableRow>
                          
                          <TableRow className="bg-primary/5">
                            <TableCell className="font-medium">Per-SQM Rates:</TableCell>
                            <TableCell className="text-right"></TableCell>
                          </TableRow>
                          
                          {validProjectData.tasks.some(t => t.category === 'baseline' && t.included) && (
                            <TableRow>
                              <TableCell className="font-medium pl-6">→ Baseline (Architecture)</TableCell>
                              <TableCell className="text-right">{formatCurrency(rates.baseline)}/sqm</TableCell>
                            </TableRow>
                          )}
                          
                          {validProjectData.tasks.some(t => t.category === 'addon-interiors' && t.included) && (
                            <TableRow>
                              <TableCell className="font-medium pl-6">→ Interior Design</TableCell>
                              <TableCell className="text-right">{formatCurrency(rates.interiors)}/sqm</TableCell>
                            </TableRow>
                          )}
                          
                          {validProjectData.tasks.some(t => t.category === 'addon-masterplan' && t.included) && (
                            <TableRow>
                              <TableCell className="font-medium pl-6">→ Masterplan</TableCell>
                              <TableCell className="text-right">{formatCurrency(rates.masterplan)}/sqm</TableCell>
                            </TableRow>
                          )}
                          
                          <TableRow>
                            <TableCell className="font-medium">Base Fee (Total)</TableCell>
                            <TableCell className="text-right">{formatCurrency(useBaseFee(totalProjectArea, validProjectData.tasks))}</TableCell>
                          </TableRow>
                          
                          <TableRow>
                            <TableCell className="font-medium">Avg Complexity Multiplier</TableCell>
                            <TableCell className="text-right">{formatNumber(useComplexityMultiplier(dwellingsWithFees[0]?.complexity || 3))}</TableCell>
                          </TableRow>

                          <TableRow className="bg-primary/5">
                            <TableCell className="font-bold">Final Fee</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(totalFee)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={2} className="text-muted-foreground text-xs pt-2">
                              Formula: (Area × Rate(s)) × Complexity Multiplier
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-3 text-base">Time Estimates</h4>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Total Hours (from tasks)</TableCell>
                            <TableCell className="text-right">{formatHours(totalHours)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium pl-6">→ Calculation</TableCell>
                            <TableCell className="text-right text-muted-foreground text-xs">
                              Sum of included task weights adjusted by complexity
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Capped Hours (fee ÷ rate)</TableCell>
                            <TableCell className="text-right">{formatHours(totalCappedHours)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium pl-6">→ Default Hourly Rate</TableCell>
                            <TableCell className="text-right text-muted-foreground">$150/hr</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FeeBreakdown;
