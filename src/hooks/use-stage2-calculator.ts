
import { useMemo } from "react";
import { Dwelling, Stage2Estimate, Stage2CalculatorResult } from "@/types/calculator";
import { useTotalProjectArea } from "./use-fee-calculator";

export const useStage2Calculator = (
  dwellings: Dwelling[],
  stage2Estimate?: Stage2Estimate
): Stage2CalculatorResult => {
  
  return useMemo(() => {
    // Default values if no estimate data provided
    if (!stage2Estimate) {
      return {
        totalConstructionCost: 0,
        stage2Fee: 0,
        feePercentage: 0
      };
    }
    
    const totalProjectArea = useTotalProjectArea(dwellings);
    const { constructionCostPerSqm, feePercentage, manualConstructionCost } = stage2Estimate;
    
    // Use manual construction cost if provided, otherwise calculate based on area
    const totalConstructionCost = manualConstructionCost !== undefined ? 
      manualConstructionCost : 
      totalProjectArea * constructionCostPerSqm;
    
    const stage2Fee = totalConstructionCost * (feePercentage / 100);
    
    return {
      totalConstructionCost,
      stage2Fee,
      feePercentage
    };
  }, [dwellings, stage2Estimate]);
};
