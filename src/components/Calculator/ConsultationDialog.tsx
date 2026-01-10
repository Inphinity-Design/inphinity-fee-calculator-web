import { useState, useEffect } from "react";
import { ConsultationTimeEstimate } from "@/types/calculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useFormattedValue } from "@/hooks/use-fee-calculator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ConsultationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultationEstimate: ConsultationTimeEstimate | undefined;
  onUpdate: (data: ConsultationTimeEstimate) => void;
}

const ConsultationDialog = ({ 
  open, 
  onOpenChange, 
  consultationEstimate, 
  onUpdate 
}: ConsultationDialogProps) => {
  const initialEstimate: ConsultationTimeEstimate = consultationEstimate || {
    hourlyRate: 150,
    hours: 0
  };

  const [hourlyRate, setHourlyRate] = useState(initialEstimate.hourlyRate);
  const [hours, setHours] = useState(initialEstimate.hours);
  const totalFee = hourlyRate * hours;
  
  const formattedTotalFee = useFormattedValue(totalFee);

  // Sync with external data when dialog opens
  useEffect(() => {
    if (open && consultationEstimate) {
      setHourlyRate(consultationEstimate.hourlyRate);
      setHours(consultationEstimate.hours);
    }
  }, [open, consultationEstimate]);

  useEffect(() => {
    if (open) {
      onUpdate({
        hourlyRate,
        hours
      });
    }
  }, [hourlyRate, hours, open, onUpdate]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle>Consultation Time</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input
              id="hourlyRate"
              type="number"
              min="0"
              step="10"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hours">Number of Hours</Label>
            <Input
              id="hours"
              type="number"
              min="0"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
            />
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-md">
            <span className="font-medium">Estimated Fee:</span>
            <span className="text-lg font-bold">${formattedTotalFee}</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ConsultationDialog;
