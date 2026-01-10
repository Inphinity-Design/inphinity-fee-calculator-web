import { useState, useEffect } from "react";
import { Consultant, ConsultantFeeType } from "@/types/calculator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Briefcase, DollarSign, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateConsultantCost, calculateTotalConsultantsCost, calculateIncludedConsultantsCost } from "@/hooks/use-consultants";

interface ConsultantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultants: Consultant[];
  onUpdate: (consultants: Consultant[]) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

const ConsultantsDialog = ({
  open,
  onOpenChange,
  consultants: externalConsultants,
  onUpdate,
}: ConsultantsDialogProps) => {
  const [consultants, setConsultants] = useState<Consultant[]>(externalConsultants || []);

  // Sync with external data when dialog opens
  useEffect(() => {
    if (open) {
      setConsultants(externalConsultants || []);
    }
  }, [open, externalConsultants]);

  // Update parent whenever consultants change
  useEffect(() => {
    if (open) {
      onUpdate(consultants);
    }
  }, [consultants, open, onUpdate]);

  const addConsultant = () => {
    const newConsultant: Consultant = {
      id: `consultant-${Date.now()}`,
      name: "",
      feeType: "fixed",
      fixedFee: 0,
      hourlyRate: 0,
      hours: 0,
      includeInProjectFee: true,
    };
    setConsultants((prev) => [...prev, newConsultant]);
  };

  const updateConsultant = (id: string, updates: Partial<Consultant>) => {
    setConsultants((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const removeConsultant = (id: string) => {
    setConsultants((prev) => prev.filter((c) => c.id !== id));
  };

  const totalCost = calculateTotalConsultantsCost(consultants);
  const includedCost = calculateIncludedConsultantsCost(consultants);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[450px] sm:w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            3rd Party Consultants
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Add external consultants like structural engineers, landscape architects, specialists, etc.
          </p>

          {consultants.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No consultants added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {consultants.map((consultant, index) => (
                <div
                  key={consultant.id}
                  className="p-4 border rounded-lg space-y-3 bg-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`name-${consultant.id}`}>Consultant Name</Label>
                      <Input
                        id={`name-${consultant.id}`}
                        placeholder="e.g., Structural Engineer"
                        value={consultant.name}
                        onChange={(e) =>
                          updateConsultant(consultant.id, { name: e.target.value })
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeConsultant(consultant.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Fee Type</Label>
                    <Select
                      value={consultant.feeType}
                      onValueChange={(value: ConsultantFeeType) =>
                        updateConsultant(consultant.id, { feeType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Fixed Fee
                          </div>
                        </SelectItem>
                        <SelectItem value="hourly">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Hourly Rate
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {consultant.feeType === "fixed" ? (
                    <div className="space-y-2">
                      <Label htmlFor={`fixed-${consultant.id}`}>Fixed Fee ($)</Label>
                      <Input
                        id={`fixed-${consultant.id}`}
                        type="number"
                        min="0"
                        step="100"
                        value={consultant.fixedFee || ""}
                        onChange={(e) =>
                          updateConsultant(consultant.id, {
                            fixedFee: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`rate-${consultant.id}`}>Hourly Rate ($)</Label>
                        <Input
                          id={`rate-${consultant.id}`}
                          type="number"
                          min="0"
                          step="10"
                          value={consultant.hourlyRate || ""}
                          onChange={(e) =>
                            updateConsultant(consultant.id, {
                              hourlyRate: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`hours-${consultant.id}`}>Hours</Label>
                        <Input
                          id={`hours-${consultant.id}`}
                          type="number"
                          min="0"
                          step="0.5"
                          value={consultant.hours || ""}
                          onChange={(e) =>
                            updateConsultant(consultant.id, {
                              hours: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`include-${consultant.id}`}
                        checked={consultant.includeInProjectFee}
                        onCheckedChange={(checked) =>
                          updateConsultant(consultant.id, {
                            includeInProjectFee: !!checked,
                          })
                        }
                      />
                      <Label
                        htmlFor={`include-${consultant.id}`}
                        className="text-sm cursor-pointer"
                      >
                        Include in project fee
                      </Label>
                    </div>
                    <span className="font-semibold text-primary">
                      {formatCurrency(calculateConsultantCost(consultant))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={addConsultant}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Consultant
          </Button>

          <Separator className="my-4" />

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <span className="text-sm text-muted-foreground">Total Consultant Costs:</span>
              <span className="font-semibold">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-md">
              <span className="font-medium">Added to Project Fee:</span>
              <span className="text-lg font-bold">{formatCurrency(includedCost)}</span>
            </div>
            {totalCost !== includedCost && (
              <p className="text-xs text-muted-foreground text-center">
                {formatCurrency(totalCost - includedCost)} not included in project fee (absorbed as expense)
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ConsultantsDialog;
