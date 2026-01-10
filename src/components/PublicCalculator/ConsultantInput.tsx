import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface ThirdPartyConsultant {
  id: string;
  name: string;
  fee: number;
}

interface ConsultantInputProps {
  consultant: ThirdPartyConsultant;
  onUpdate: (updates: Partial<ThirdPartyConsultant>) => void;
  onRemove: () => void;
}

export const ConsultantInput = ({ consultant, onUpdate, onRemove }: ConsultantInputProps) => {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Consultant name"
        value={consultant.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        className="bg-background/50 flex-1"
      />
      <Input
        type="number"
        placeholder="Fee"
        value={consultant.fee || ""}
        onChange={(e) => onUpdate({ fee: parseFloat(e.target.value) || 0 })}
        className="bg-background/50 w-28"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-destructive hover:text-destructive/80 shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
