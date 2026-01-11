import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ThirdPartyConsultant } from "@/components/PublicCalculator/ConsultantInput";

interface PublicPDFData {
  projectName: string;
  buildingName: string;
  size: number;
  complexity: number;
  fees: {
    baseFee: number;
    masterplanFee: number;
    interiorDesignFee: number;
    consultationFee: number;
    consultantsFee: number;
    totalFee: number;
    rates: { baseline: number; interiors: number; masterplan: number };
    complexityMultiplier: number;
  };
  masterplanEnabled: boolean;
  interiorDesignEnabled: boolean;
  consultationEnabled: boolean;
  consultationHours: number;
  consultationRate: number;
  consultantsEnabled: boolean;
  consultants: ThirdPartyConsultant[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

const getComplexityText = (complexity: number): string => {
  const texts: Record<number, string> = {
    1: "Simple (0.75x)",
    2: "Below Average (0.9x)",
    3: "Standard (1.0x)",
    4: "Above Average (1.2x)",
    5: "Complex (1.4x)",
  };
  return texts[complexity] || "Standard (1.0x)";
};

export const generatePublicPDF = async (data: PublicPDFData): Promise<void> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Document properties
  doc.setProperties({
    title: `Fee Estimate - ${data.projectName || "Project"}`,
    subject: "Architectural Fee Estimate",
    author: "Inphinity Design",
    creator: "Inphinity Design Fee Calculator",
  });

  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 100, 50); // Dark green
  doc.text("INPHINITY DESIGN", 15, 20);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Project Fee Estimate", 15, 30);

  // Date
  doc.setFontSize(10);
  doc.text(`Date: ${format(new Date(), "MMMM d, yyyy")}`, 15, 40);

  // Project Details Section
  doc.setFontSize(14);
  doc.setTextColor(0, 100, 50);
  doc.text("Project Details", 15, 55);
  doc.setTextColor(0, 0, 0);

  let yOffset = 65;
  doc.setFontSize(11);

  if (data.projectName) {
    doc.text(`Project Name: ${data.projectName}`, 15, yOffset);
    yOffset += 7;
  }

  if (data.buildingName) {
    doc.text(`Building Name: ${data.buildingName}`, 15, yOffset);
    yOffset += 7;
  }

  doc.text(`Building Size: ${data.size} sqm`, 15, yOffset);
  yOffset += 7;

  doc.text(`Complexity: ${getComplexityText(data.complexity)}`, 15, yOffset);
  yOffset += 15;

  // Fee Breakdown Section
  doc.setFontSize(14);
  doc.setTextColor(0, 100, 50);
  doc.text("Fee Breakdown", 15, yOffset);
  yOffset += 10;

  // Build table data
  const tableBody: (string | number)[][] = [];

  // Base fee
  tableBody.push([
    "Base Design Fee",
    `${data.size} sqm × ${formatCurrency(data.fees.rates.baseline)} × ${data.fees.complexityMultiplier}x`,
    formatCurrency(data.fees.baseFee),
  ]);

  // Optional add-ons
  if (data.masterplanEnabled) {
    tableBody.push([
      "Masterplan",
      `${data.size} sqm × ${formatCurrency(data.fees.rates.masterplan)} × ${data.fees.complexityMultiplier}x`,
      formatCurrency(data.fees.masterplanFee),
    ]);
  }

  if (data.interiorDesignEnabled) {
    tableBody.push([
      "Interior Design",
      `${data.size} sqm × ${formatCurrency(data.fees.rates.interiors)} × ${data.fees.complexityMultiplier}x`,
      formatCurrency(data.fees.interiorDesignFee),
    ]);
  }

  if (data.consultationEnabled) {
    tableBody.push([
      "Consultation Time",
      `${data.consultationHours} hrs × ${formatCurrency(data.consultationRate)}`,
      formatCurrency(data.fees.consultationFee),
    ]);
  }

  if (data.consultantsEnabled && data.consultants.length > 0) {
    data.consultants.forEach((consultant) => {
      if (consultant.name && consultant.fee > 0) {
        tableBody.push([
          `Third-Party: ${consultant.name}`,
          "Fixed Fee",
          formatCurrency(consultant.fee),
        ]);
      }
    });
  }

  // Create table
  autoTable(doc, {
    startY: yOffset,
    head: [["Service", "Calculation", "Amount"]],
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [0, 100, 50],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 70 },
      2: { cellWidth: 40, halign: "right" },
    },
  });

  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable?.finalY || yOffset + 50;

  // Total Fee
  doc.setFontSize(14);
  doc.setTextColor(0, 100, 50);
  doc.text("Total Project Fee:", 15, finalY + 15);
  doc.setFontSize(16);
  doc.text(formatCurrency(data.fees.totalFee), 70, finalY + 15);

  // Disclaimers
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);

  const disclaimerY = finalY + 35;
  doc.text(
    "Disclaimer: Fees are estimates and subject to change based on final project scope and requirements.",
    15,
    disclaimerY
  );
  doc.text(
    "This calculator provides reference pricing only.",
    15,
    disclaimerY + 5
  );
  doc.text(
    "For projects with multiple structures (5+), please contact us directly for a custom quote with volume discounts.",
    15,
    disclaimerY + 12
  );

  // Footer
  doc.setFontSize(8);
  doc.text(`© ${new Date().getFullYear()} Inphinity Design. All rights reserved.`, 15, 285);
  doc.text("Page 1 of 1", 180, 285);

  // Save the PDF
  const safeProjectName = (data.projectName || "Project").replace(/\s+/g, "_");
  doc.save(`${safeProjectName}_Fee_Estimate.pdf`);
};
