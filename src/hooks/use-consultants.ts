import { useState, useCallback, useMemo } from 'react';
import { Consultant, ConsultantFeeType } from '@/types/calculator';

export interface UseConsultantsResult {
  consultants: Consultant[];
  addConsultant: (consultant: Omit<Consultant, 'id'>) => void;
  updateConsultant: (id: string, updates: Partial<Consultant>) => void;
  removeConsultant: (id: string) => void;
  getConsultantCost: (id: string) => number;
  getTotalConsultantsCost: () => number;
  getIncludedConsultantsCost: () => number;
  setConsultants: (consultants: Consultant[]) => void;
}

export const useConsultants = (
  initialConsultants: Consultant[] = []
): UseConsultantsResult => {
  const [consultants, setConsultants] = useState<Consultant[]>(initialConsultants);

  const addConsultant = useCallback((consultant: Omit<Consultant, 'id'>) => {
    const newConsultant: Consultant = {
      ...consultant,
      id: `consultant-${Date.now()}`,
    };
    setConsultants(prev => [...prev, newConsultant]);
  }, []);

  const updateConsultant = useCallback((id: string, updates: Partial<Consultant>) => {
    setConsultants(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const removeConsultant = useCallback((id: string) => {
    setConsultants(prev => prev.filter(c => c.id !== id));
  }, []);

  const getConsultantCost = useCallback((id: string): number => {
    const consultant = consultants.find(c => c.id === id);
    if (!consultant) return 0;

    if (consultant.feeType === 'fixed') {
      return consultant.fixedFee || 0;
    } else {
      return (consultant.hourlyRate || 0) * (consultant.hours || 0);
    }
  }, [consultants]);

  const getTotalConsultantsCost = useCallback((): number => {
    return consultants.reduce((sum, c) => sum + getConsultantCost(c.id), 0);
  }, [consultants, getConsultantCost]);

  const getIncludedConsultantsCost = useCallback((): number => {
    return consultants
      .filter(c => c.includeInProjectFee)
      .reduce((sum, c) => sum + getConsultantCost(c.id), 0);
  }, [consultants, getConsultantCost]);

  return {
    consultants,
    addConsultant,
    updateConsultant,
    removeConsultant,
    getConsultantCost,
    getTotalConsultantsCost,
    getIncludedConsultantsCost,
    setConsultants,
  };
};

// Standalone function to calculate consultant cost (for use in FeeSummaryPanel without hook)
export const calculateConsultantCost = (consultant: Consultant): number => {
  if (consultant.feeType === 'fixed') {
    return consultant.fixedFee || 0;
  } else {
    return (consultant.hourlyRate || 0) * (consultant.hours || 0);
  }
};

export const calculateTotalConsultantsCost = (consultants: Consultant[]): number => {
  return consultants.reduce((sum, c) => sum + calculateConsultantCost(c), 0);
};

export const calculateIncludedConsultantsCost = (consultants: Consultant[]): number => {
  return consultants
    .filter(c => c.includeInProjectFee)
    .reduce((sum, c) => sum + calculateConsultantCost(c), 0);
};
