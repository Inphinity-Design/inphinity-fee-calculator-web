
import { Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface SaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
}

export const SaveIndicator = ({ isSaving, lastSaved }: SaveIndicatorProps) => {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (lastSaved && !isSaving) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved, isSaving]);

  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (showSaved) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <div className="h-3 w-3 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="h-2 w-2 text-green-600" />
        </div>
        <span>Saved</span>
      </div>
    );
  }

  return null;
};
