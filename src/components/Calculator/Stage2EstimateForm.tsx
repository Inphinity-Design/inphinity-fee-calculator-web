
import { useState } from "react";
import { Stage2Estimate, Dwelling } from "@/types/calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useStage2Calculator } from "@/hooks/use-stage2-calculator";
import { useTotalProjectArea } from "@/hooks/use-fee-calculator";

interface Stage2EstimateFormProps {
  dwellings: Dwelling[];
  stage2Estimate: Stage2Estimate | undefined;
  onUpdate: (newEstimate: Stage2Estimate) => void;
}

const DEFAULT_COST_PER_SQM = 1800;
const DEFAULT_FEE_PERCENTAGE = 2.5;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

const Stage2EstimateForm = ({ 
  dwellings, 
  stage2Estimate, 
  onUpdate 
}: Stage2EstimateFormProps) => {
  // Total project area
  const totalProjectArea = useTotalProjectArea(dwellings);
  
  // Initialize with defaults or existing data
  const [costPerSqm, setCostPerSqm] = useState<number>(
    stage2Estimate?.constructionCostPerSqm || DEFAULT_COST_PER_SQM
  );
  
  const [feePercentage, setFeePercentage] = useState<number>(
    stage2Estimate?.feePercentage || DEFAULT_FEE_PERCENTAGE
  );
  
  const [useManualCost, setUseManualCost] = useState<boolean>(
    stage2Estimate?.manualConstructionCost !== undefined
  );
  
  const [manualConstructionCost, setManualConstructionCost] = useState<number>(
    stage2Estimate?.manualConstructionCost || totalProjectArea * costPerSqm
  );
  
  // Calculate values
  const calculatedConstructionCost = totalProjectArea * costPerSqm;
  
  const { totalConstructionCost, stage2Fee } = useStage2Calculator(
    dwellings, 
    { 
      constructionCostPerSqm: costPerSqm, 
      feePercentage: feePercentage,
      manualConstructionCost: useManualCost ? manualConstructionCost : undefined
    }
  );
  
  const handleCostChange = (value: string) => {
    const newCost = parseFloat(value) || 0;
    setCostPerSqm(newCost);
    
    // Update the estimate
    onUpdate({ 
      constructionCostPerSqm: newCost, 
      feePercentage: feePercentage,
      manualConstructionCost: useManualCost ? manualConstructionCost : undefined
    });
  };
  
  const handlePercentageChange = (value: number[]) => {
    const newPercentage = value[0];
    setFeePercentage(newPercentage);
    
    // Update the estimate
    onUpdate({ 
      constructionCostPerSqm: costPerSqm, 
      feePercentage: newPercentage,
      manualConstructionCost: useManualCost ? manualConstructionCost : undefined
    });
  };
  
  const handleManualCostToggle = (checked: boolean) => {
    setUseManualCost(checked);
    
    // Update the estimate with or without manual cost
    onUpdate({
      constructionCostPerSqm: costPerSqm,
      feePercentage: feePercentage,
      manualConstructionCost: checked ? manualConstructionCost : undefined
    });
  };
  
  const handleManualCostChange = (value: string) => {
    const newManualCost = parseFloat(value) || 0;
    setManualConstructionCost(newManualCost);
    
    if (useManualCost) {
      // Update the estimate with the new manual cost
      onUpdate({
        constructionCostPerSqm: costPerSqm,
        feePercentage: feePercentage,
        manualConstructionCost: newManualCost
      });
    }
  };
  
  return (
    <Card>
      <CardHeader className="card-header-accent">
        <CardTitle className="text-lg font-medium flex items-center">
          <span className="text-gold">Stage 2</span>&nbsp;Construction Estimates
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {dwellings.length > 0 ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="costPerSqm">Construction Cost per sqm ($)</Label>
                <Input
                  id="costPerSqm"
                  type="number"
                  min="0"
                  value={costPerSqm}
                  onChange={(e) => handleCostChange(e.target.value)}
                  className="font-mono"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="totalProjectArea">Total Project Area</Label>
                  <span className="font-medium">{totalProjectArea} sqm</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="useManualCost" 
                    checked={useManualCost} 
                    onCheckedChange={handleManualCostToggle}
                  />
                  <Label htmlFor="useManualCost">Edit Construction Cost Directly</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="constructionCost">Estimated Construction Cost ($)</Label>
                  <Input
                    id="constructionCost"
                    type="number"
                    min="0"
                    value={useManualCost ? manualConstructionCost : calculatedConstructionCost}
                    onChange={(e) => handleManualCostChange(e.target.value)}
                    disabled={!useManualCost}
                    className={`font-mono ${!useManualCost ? "bg-muted" : ""}`}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="feePercentage">Fee Percentage</Label>
                  <span className="font-medium">{feePercentage.toFixed(1)}%</span>
                </div>
                <Slider
                  id="feePercentage"
                  min={1}
                  max={4}
                  step={0.1}
                  value={[feePercentage]}
                  onValueChange={handlePercentageChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1%</span>
                  <span>2%</span>
                  <span>3%</span>
                  <span>4%</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="font-medium">Total Project Area:</div>
                <div className="text-right">{totalProjectArea} sqm</div>
                
                <div className="font-medium">Est. Construction Cost:</div>
                <div className="text-right">{formatCurrency(totalConstructionCost)}</div>
                
                <div className="font-medium">Stage 2 Fee ({feePercentage.toFixed(1)}%):</div>
                <div className="text-right font-semibold">{formatCurrency(stage2Fee)}</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Add at least one dwelling to calculate Stage 2 estimates
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Stage2EstimateForm;
