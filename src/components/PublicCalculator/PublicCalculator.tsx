import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileDown, Plus, Trash2 } from "lucide-react";
import { getPerSqmRates, DEFAULT_DWELLING_MULTIPLIERS } from "@/hooks/use-fee-calculator";
import { generatePublicPDF } from "@/utils/public-pdf-generator";
import { ThirdPartyConsultant, ConsultantInput } from "./ConsultantInput";

interface AddOnService {
  id: string;
  name: string;
  enabled: boolean;
  type: 'rate-based' | 'hourly' | 'custom';
}

const COMPLEXITY_LABELS: Record<number, { label: string; multiplier: number }> = {
  1: { label: "Simple", multiplier: 0.75 },
  2: { label: "Below Average", multiplier: 0.9 },
  3: { label: "Standard", multiplier: 1.0 },
  4: { label: "Above Average", multiplier: 1.2 },
  5: { label: "Complex", multiplier: 1.4 },
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

export const PublicCalculator = () => {
  const [projectName, setProjectName] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [size, setSize] = useState<number>(100);
  const [complexity, setComplexity] = useState<number>(3);
  
  // Add-ons
  const [masterplanEnabled, setMasterplanEnabled] = useState(false);
  const [interiorDesignEnabled, setInteriorDesignEnabled] = useState(false);
  const [consultationEnabled, setConsultationEnabled] = useState(false);
  const [consultationHours, setConsultationHours] = useState<number>(1);
  const [consultantsEnabled, setConsultantsEnabled] = useState(false);
  const [consultants, setConsultants] = useState<ThirdPartyConsultant[]>([]);

  const CONSULTATION_RATE = 150; // $150/hr fixed

  // Calculate fees
  const fees = useMemo(() => {
    const rates = getPerSqmRates(size);
    const complexityMultiplier = DEFAULT_DWELLING_MULTIPLIERS[complexity as keyof typeof DEFAULT_DWELLING_MULTIPLIERS];
    
    // Base fee (all 6 baseline tasks bundled)
    const baseFee = size * rates.baseline * complexityMultiplier;
    
    // Add-on fees
    const masterplanFee = masterplanEnabled ? size * rates.masterplan * complexityMultiplier : 0;
    const interiorDesignFee = interiorDesignEnabled ? size * rates.interiors * complexityMultiplier : 0;
    const consultationFee = consultationEnabled ? consultationHours * CONSULTATION_RATE : 0;
    const consultantsFee = consultantsEnabled 
      ? consultants.reduce((sum, c) => sum + (c.fee || 0), 0) 
      : 0;
    
    const totalFee = baseFee + masterplanFee + interiorDesignFee + consultationFee + consultantsFee;
    
    return {
      baseFee,
      masterplanFee,
      interiorDesignFee,
      consultationFee,
      consultantsFee,
      totalFee,
      rates,
      complexityMultiplier,
    };
  }, [size, complexity, masterplanEnabled, interiorDesignEnabled, consultationEnabled, consultationHours, consultantsEnabled, consultants]);

  const addConsultant = () => {
    setConsultants([...consultants, { id: crypto.randomUUID(), name: "", fee: 0 }]);
  };

  const updateConsultant = (id: string, updates: Partial<ThirdPartyConsultant>) => {
    setConsultants(consultants.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeConsultant = (id: string) => {
    setConsultants(consultants.filter(c => c.id !== id));
  };

  const handleExportPDF = () => {
    generatePublicPDF({
      projectName,
      buildingName,
      size,
      complexity,
      fees,
      masterplanEnabled,
      interiorDesignEnabled,
      consultationEnabled,
      consultationHours,
      consultationRate: CONSULTATION_RATE,
      consultantsEnabled,
      consultants,
    });
  };

  return (
    <div className="min-h-screen bg-marble-teal bg-fixed bg-cover p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-2">
            <img
              src="/lovable-uploads/41b00d8c-ab4e-4fc4-83af-e29dc46e871f.png"
              alt="Inphinity Design Logo"
              className="h-12 w-12"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              <span className="text-gold">Inphinity</span> Fee Calculator
            </h1>
          </div>
          <p className="text-muted-foreground">Estimate your architectural project fees</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="card-gradient gold-border">
            <CardHeader>
              <CardTitle className="text-gold">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {/* Building Name */}
              <div className="space-y-2">
                <Label htmlFor="buildingName">Building Name</Label>
                <Input
                  id="buildingName"
                  placeholder="Enter building name"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {/* Size */}
              <div className="space-y-2">
                <Label htmlFor="size">Building Size (sqm)</Label>
                <Input
                  id="size"
                  type="number"
                  min={1}
                  value={size}
                  onChange={(e) => setSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="bg-background/50"
                />
                <p className="text-sm text-muted-foreground">
                  Current rate: {formatCurrency(fees.rates.baseline)}/sqm
                </p>
              </div>

              {/* Complexity Slider */}
              <div className="space-y-4">
                <Label>Complexity Level</Label>
                <div className="px-2">
                  <Slider
                    value={[complexity]}
                    onValueChange={(value) => setComplexity(value[0])}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Simple</span>
                  <span className="text-gold font-medium">
                    {COMPLEXITY_LABELS[complexity].label} ({COMPLEXITY_LABELS[complexity].multiplier}x)
                  </span>
                  <span className="text-muted-foreground">Complex</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add-ons Section */}
          <Card className="card-gradient gold-border">
            <CardHeader>
              <CardTitle className="text-gold">Optional Add-ons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Masterplan */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="masterplan"
                  checked={masterplanEnabled}
                  onCheckedChange={(checked) => setMasterplanEnabled(checked === true)}
                />
                <div className="flex-1">
                  <Label htmlFor="masterplan" className="cursor-pointer">Masterplan</Label>
                  <p className="text-sm text-muted-foreground">
                    +{formatCurrency(fees.rates.masterplan)}/sqm
                  </p>
                  {masterplanEnabled && (
                    <p className="text-sm text-gold mt-1">+{formatCurrency(fees.masterplanFee)}</p>
                  )}
                </div>
              </div>

              {/* Interior Design */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="interiorDesign"
                  checked={interiorDesignEnabled}
                  onCheckedChange={(checked) => setInteriorDesignEnabled(checked === true)}
                />
                <div className="flex-1">
                  <Label htmlFor="interiorDesign" className="cursor-pointer">Interior Design</Label>
                  <p className="text-sm text-muted-foreground">
                    +{formatCurrency(fees.rates.interiors)}/sqm
                  </p>
                  {interiorDesignEnabled && (
                    <p className="text-sm text-gold mt-1">+{formatCurrency(fees.interiorDesignFee)}</p>
                  )}
                </div>
              </div>

              {/* Consultation Time */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consultation"
                    checked={consultationEnabled}
                    onCheckedChange={(checked) => setConsultationEnabled(checked === true)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="consultation" className="cursor-pointer">Consultation Time</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(CONSULTATION_RATE)}/hour
                    </p>
                  </div>
                </div>
                {consultationEnabled && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="consultationHours">Hours</Label>
                    <Input
                      id="consultationHours"
                      type="number"
                      min={1}
                      value={consultationHours}
                      onChange={(e) => setConsultationHours(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-background/50 w-24"
                    />
                    <p className="text-sm text-gold">+{formatCurrency(fees.consultationFee)}</p>
                  </div>
                )}
              </div>

              {/* Third-Party Consultants */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consultants"
                    checked={consultantsEnabled}
                    onCheckedChange={(checked) => setConsultantsEnabled(checked === true)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="consultants" className="cursor-pointer">Third-Party Consultants</Label>
                    <p className="text-sm text-muted-foreground">Add external consultant fees</p>
                  </div>
                </div>
                {consultantsEnabled && (
                  <div className="ml-6 space-y-3">
                    {consultants.map((consultant) => (
                      <ConsultantInput
                        key={consultant.id}
                        consultant={consultant}
                        onUpdate={(updates) => updateConsultant(consultant.id, updates)}
                        onRemove={() => removeConsultant(consultant.id)}
                      />
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addConsultant}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Consultant
                    </Button>
                    {consultants.length > 0 && (
                      <p className="text-sm text-gold">+{formatCurrency(fees.consultantsFee)}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fee Summary */}
        <Card className="card-gradient gold-border">
          <CardHeader>
            <CardTitle className="text-gold">Fee Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rate Tiers Info */}
            <div className="bg-secondary/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 text-foreground">Rate Tiers (Base Fee)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className={size <= 100 ? "text-gold font-medium" : "text-muted-foreground"}>
                  ≤100 sqm: $260/sqm
                </div>
                <div className={size > 100 && size <= 200 ? "text-gold font-medium" : "text-muted-foreground"}>
                  101-200 sqm: $186/sqm
                </div>
                <div className={size > 200 && size <= 400 ? "text-gold font-medium" : "text-muted-foreground"}>
                  201-400 sqm: $135.5/sqm
                </div>
                <div className={size > 400 && size <= 600 ? "text-gold font-medium" : "text-muted-foreground"}>
                  401-600 sqm: $109/sqm
                </div>
                <div className={size > 600 && size <= 815 ? "text-gold font-medium" : "text-muted-foreground"}>
                  601-815 sqm: $93/sqm
                </div>
                <div className={size > 815 ? "text-gold font-medium" : "text-muted-foreground"}>
                  815+ sqm: $84/sqm
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Fee ({size} sqm × {formatCurrency(fees.rates.baseline)} × {fees.complexityMultiplier}x)</span>
                <span className="font-medium">{formatCurrency(fees.baseFee)}</span>
              </div>
              
              {masterplanEnabled && (
                <div className="flex justify-between text-muted-foreground">
                  <span>+ Masterplan</span>
                  <span>{formatCurrency(fees.masterplanFee)}</span>
                </div>
              )}
              
              {interiorDesignEnabled && (
                <div className="flex justify-between text-muted-foreground">
                  <span>+ Interior Design</span>
                  <span>{formatCurrency(fees.interiorDesignFee)}</span>
                </div>
              )}
              
              {consultationEnabled && (
                <div className="flex justify-between text-muted-foreground">
                  <span>+ Consultation ({consultationHours} hrs × {formatCurrency(CONSULTATION_RATE)})</span>
                  <span>{formatCurrency(fees.consultationFee)}</span>
                </div>
              )}
              
              {consultantsEnabled && consultants.length > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>+ Third-Party Consultants</span>
                  <span>{formatCurrency(fees.consultantsFee)}</span>
                </div>
              )}
              
              <div className="border-t border-gold pt-2 mt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-gold">Total Project Fee</span>
                  <span className="text-gold">{formatCurrency(fees.totalFee)}</span>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExportPDF}
              className="w-full bg-gold hover:bg-gold-dark text-black font-medium"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF Quote
            </Button>
          </CardContent>
        </Card>

        {/* Disclaimers */}
        <Card className="card-gradient border-muted">
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> Fees are estimates and subject to change based on final project scope and requirements. This calculator provides reference pricing only.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Large Projects:</strong> For projects with multiple structures (5+), please contact us directly for a custom quote with volume discounts.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          © {new Date().getFullYear()} Inphinity Design. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default PublicCalculator;
