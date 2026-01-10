
import { useMemo } from "react";
import { ConsultationTimeEstimate, ConsultationTimeResult } from "@/types/calculator";

export const useConsultationCalculator = (
  consultationEstimate?: ConsultationTimeEstimate
): ConsultationTimeResult => {
  
  return useMemo(() => {
    // Default values if no consultation data provided
    if (!consultationEstimate) {
      return {
        totalConsultationFee: 0,
        hourlyRate: 0,
        hours: 0
      };
    }
    
    const { hourlyRate, hours } = consultationEstimate;
    const totalConsultationFee = hourlyRate * hours;
    
    return {
      totalConsultationFee,
      hourlyRate,
      hours
    };
  }, [consultationEstimate]);
};
