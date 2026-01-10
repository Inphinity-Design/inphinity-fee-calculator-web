
import { jsPDF } from "jspdf";
import { ProjectData, Dwelling, Task, TaskComplexity } from "@/types/calculator";
import autoTable from 'jspdf-autotable';
import { format } from "date-fns";
import { useTaskComplexityMultiplier, useComplexityMultiplier } from "@/hooks/use-fee-calculator";

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
};

const formatHours = (hours: number): string => {
  return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
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

const getTaskComplexityText = (complexity: TaskComplexity): string => {
  const texts: Record<string, string> = {
    low: "Low (0.8x)",
    normal: "Normal (1.0x)",
    high: "High (1.2x)",
  };
  return texts[complexity] || "Normal (1.0x)";
};

// Main export function
export const generatePDF = async (
  projectData: ProjectData, 
  dwellingsWithFees: Dwelling[], 
  totalFee: number,
  consultationFee: number = 0
): Promise<void> => {
  // Ensure we're working with valid arrays
  const safeDwellings = Array.isArray(dwellingsWithFees) ? dwellingsWithFees : [];
  const safeTasks = Array.isArray(projectData.tasks) ? projectData.tasks : [];
  
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Set document properties
  doc.setProperties({
    title: `Fee Proposal - ${projectData.projectName || "Project"}`,
    subject: "Architectural Fee Proposal",
    author: "Inphinity Design",
    creator: "Inphinity Design Fee Calculator"
  });

  // Add header
  doc.setFontSize(20);
  doc.setTextColor(0, 100, 50); // Dark green
  doc.text("INPHINITY DESIGN", 15, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Project Fee Proposal", 15, 30);
  
  // Add project information
  doc.setFontSize(11);
  doc.text(`Client: ${projectData.clientName || "Not specified"}`, 15, 45);
  doc.text(`Project: ${projectData.projectName || "Not specified"}`, 15, 52);
  doc.text(`Date: ${projectData.date ? format(projectData.date, "MMMM d, yyyy") : "Not specified"}`, 15, 59);
  
  // Calculate total project summary data
  const totalProjectArea = safeDwellings.reduce((sum, d) => sum + d.size, 0);
  const totalTimeEstimate = safeDwellings.reduce((sum, d) => sum + (d.timeEstimate || 0), 0);
  const totalCappedHours = safeDwellings.reduce((sum, d) => sum + (d.cappedHours || 0), 0);
  
  // Add Project Summary
  doc.setFontSize(14);
  doc.setTextColor(0, 100, 50);
  doc.text("Project Summary", 15, 70);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Create project summary table
  let yOffset = 130; // Default value
  try {
    // Call autoTable but do not test its return value directly
    const tableResult: any = autoTable(doc, {
      startY: 75,
      head: [["Item", "Value"]],
      body: [
        ["Total Project Area", `${totalProjectArea} sqm`],
        ["Total Fee (Main Tasks)", formatCurrency(totalFee)],
        ["Total Fee (All Items)", formatCurrency(totalFee + consultationFee)],
        ["Total Time Estimate", formatHours(totalTimeEstimate)],
        ["Total Capped Hours", formatHours(totalCappedHours)]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [0, 100, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10
      }
    });
    
    // Check if tableResult exists and has the expected properties
    if (tableResult && typeof tableResult === 'object' && 'finalY' in tableResult) {
      yOffset = tableResult.finalY + 15;
    }
  } catch (error) {
    console.error("Error generating summary table:", error);
  }
  
  // Dwelling Summary Section
  doc.setFontSize(14);
  doc.setTextColor(0, 100, 50);
  doc.text("Dwelling Summary", 15, yOffset);
  doc.setTextColor(0, 0, 0);
  yOffset += 10;
  
  // Create summary text for all dwellings
  let dwellingSummary = "";
  safeDwellings.forEach((dwelling, index) => {
    dwellingSummary += `Dwelling ${index + 1}: ${dwelling.size} sqm, ${getComplexityText(dwelling.complexity)}`;
    if (dwelling.description) dwellingSummary += `, ${dwelling.description}`;
    dwellingSummary += `.\nFee: ${formatCurrency(dwelling.fee)}, Time estimate: ${formatHours(dwelling.timeEstimate || 0)}, Capped hours: ${formatHours(dwelling.cappedHours || 0)}.\n\n`;
  });
  
  // Split summary text into multiple lines if needed
  const summaryLines = doc.splitTextToSize(dwellingSummary, 180);
  
  // Check if we need a new page for the dwelling summary
  if (yOffset + summaryLines.length * 5 > 280) {
    doc.addPage();
    yOffset = 20;
  }
  
  doc.setFontSize(10);
  doc.text(summaryLines, 15, yOffset);
  yOffset += summaryLines.length * 5 + 10;
  
  // Stage 1 Header - Check if we need a new page
  if (yOffset > 240) {
    doc.addPage();
    yOffset = 20;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(0, 100, 50);
  doc.text("Stage 1: Design Services", 15, yOffset);
  doc.setTextColor(0, 0, 0);
  yOffset += 10;
  
  // Add dwellings information
  doc.setFontSize(12);
  doc.text("Dwelling Details", 15, yOffset);
  
  yOffset += 10;
  
  safeDwellings.forEach((dwelling, index) => {
    if (yOffset > 240) {
      // Add new page if we're running out of space
      doc.addPage();
      yOffset = 20;
    }
    
    doc.setFontSize(11);
    doc.setTextColor(0, 100, 50);
    doc.text(`Dwelling ${index + 1}`, 15, yOffset);
    yOffset += 7;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Size: ${dwelling.size} sqm`, 20, yOffset);
    yOffset += 6;
    
    doc.text(`Complexity: ${dwelling.complexity} - ${getComplexityText(dwelling.complexity)}`, 20, yOffset);
    yOffset += 6;
    
    if (dwelling.description) {
      doc.text("Description:", 20, yOffset);
      yOffset += 6;
      
      // Split description into multiple lines if needed
      const descriptionLines = doc.splitTextToSize(dwelling.description, 170);
      doc.text(descriptionLines, 25, yOffset);
      yOffset += 6 * Math.min(descriptionLines.length, 3); // Limit to 3 lines
      
      if (descriptionLines.length > 3) {
        doc.text("...", 25, yOffset);
        yOffset += 6;
      }
    }
    
    doc.text(`Fee: ${formatCurrency(dwelling.fee)}`, 20, yOffset);
    yOffset += 6;
    
    doc.text(`Time Estimate: ${formatHours(dwelling.timeEstimate || 0)}`, 20, yOffset);
    yOffset += 6;
    
    doc.text(`Capped Hours: ${formatHours(dwelling.cappedHours || 0)}`, 20, yOffset);
    yOffset += 12;
  });
  
  // Add Main Tasks Total Fee
  doc.setFontSize(12);
  doc.text("Main Tasks Total Fee:", 15, yOffset);
  doc.setFontSize(12);
  doc.setTextColor(0, 100, 50);
  doc.text(formatCurrency(totalFee), 60, yOffset);
  yOffset += 20;
  
  // Add Consultation Time information if available
  if (projectData.consultationEstimate) {
    if (yOffset > 240) {
      // Add new page if we're running out of space
      doc.addPage();
      yOffset = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(0, 100, 50);
    doc.text("Additional Consultation Services", 15, yOffset);
    doc.setTextColor(0, 0, 0);
    yOffset += 10;
    
    doc.setFontSize(10);
    doc.text(`Hourly Rate: ${formatCurrency(projectData.consultationEstimate.hourlyRate)}`, 20, yOffset);
    yOffset += 6;
    
    doc.text(`Total Hours: ${projectData.consultationEstimate.hours}`, 20, yOffset);
    yOffset += 6;
    
    doc.setFontSize(12);
    doc.text("Consultation Fee:", 15, yOffset + 6);
    doc.setTextColor(0, 100, 50);
    doc.text(formatCurrency(consultationFee), 60, yOffset + 6);
    yOffset += 20;
  }
  
  // Add Total Combined Fee (including consultation)
  const combinedFee = totalFee + consultationFee;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Total Project Fee:", 15, yOffset);
  doc.setFontSize(14);
  doc.setTextColor(0, 100, 50);
  doc.text(formatCurrency(combinedFee), 60, yOffset);
  yOffset += 20;
  
  // Add new page for tasks
  doc.addPage();
  
  // Add selected tasks table
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Selected Tasks", 15, 20);
  
  const selectedTasks = safeTasks.filter(task => task && task.included);
  
  if (selectedTasks.length > 0) {
    const tableData = selectedTasks.map(task => [
      task.name,
      task.weight.toString(),
      getTaskComplexityText(task.complexity),
    ]);
    
    // Fix: Use the return value from autoTable but handle it safely
    try {
      // Use type any to avoid typescript errors with autoTable return type
      const tasksTable: any = autoTable(doc, {
        startY: 30,
        head: [["Task", "Weight", "Complexity"]],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 100, 50], // Dark green
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
      });
      
      // No need to access finalY here, but the pattern is the same if needed
    } catch (error) {
      console.error("Error generating tasks table:", error);
    }
    
    // Add footer with disclaimer
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        "This proposal is valid for 30 days. Final fees may vary based on actual project scope and requirements.",
        15, 
        285
      );
      doc.text(`Page ${i} of ${pageCount}`, 180, 285);
    }
  }
  
  // Save the PDF
  const safeProjectName = (projectData.projectName || "Project").replace(/\s+/g, "_");
  doc.save(`${safeProjectName}_Fee_Proposal.pdf`);
};
