
import { useState, useEffect } from "react";
import { ConsultationTimeEstimate } from "@/types/calculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useFormattedValue } from "@/hooks/use-fee-calculator";

interface ConsultationTimeFormProps {
  consultationEstimate: ConsultationTimeEstimate | undefined;
  onUpdate: (data: ConsultationTimeEstimate) => void;
}

const ConsultationTimeForm = ({ consultationEstimate, onUpdate }: ConsultationTimeFormProps) => {
  const initialEstimate: ConsultationTimeEstimate = consultationEstimate || {
    hourlyRate: 150,
    hours: 0
  };

  const [hourlyRate, setHourlyRate] = useState(initialEstimate.hourlyRate);
  const [hours, setHours] = useState(initialEstimate.hours);
  const totalFee = hourlyRate * hours;
  
  // Format values for display
  const formattedHourlyRate = useFormattedValue(hourlyRate);
  const formattedTotalFee = useFormattedValue(totalFee);

  useEffect(() => {
    onUpdate({
      hourlyRate,
      hours
    });
  }, [hourlyRate, hours, onUpdate]);

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    setHourlyRate(newValue);
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    setHours(newValue);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="bg-primary/10">
        <CardTitle className="text-lg font-medium">Consultation Time</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input
              id="hourlyRate"
              type="number"
              min="0"
              step="10"
              value={hourlyRate}
              onChange={handleHourlyRateChange}
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
              onChange={handleHoursChange}
            />
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="flex items-center justify-between">
          <span className="font-medium">Estimated Consultation Fee:</span>
          <span className="text-lg font-bold">${formattedTotalFee}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultationTimeForm;
