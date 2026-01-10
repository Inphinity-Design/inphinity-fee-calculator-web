import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    TeamMember,
    TaskAssignment,
    TeamDistributionSettings,
    ParentTaskGroup,
    SubTask,
} from '@/types/calculator';
import { PDFExportOptions } from '@/components/TeamDistribution/PDFExportDialog';

interface TeamPDFGeneratorParams {
    options: PDFExportOptions;
    teamMembers: TeamMember[];
    assignments: TaskAssignment[];
    settings: TeamDistributionSettings;
    parentTaskGroups: ParentTaskGroup[];
    getScaledHours: (subTask: SubTask) => number;
    getMemberCost: (memberId: string) => number;
    getMemberHours: (memberId: string) => { leadHours: number; implementerHours: number; totalHours: number };
    getMemberDistributionShare: (subTaskId: string, role: 'lead' | 'implementer', memberId: string) => number;
    projectName?: string;
    clientName?: string;
}

const formatCurrency = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value);
};

const formatHours = (hours: number): string => {
    if (isNaN(hours) || !isFinite(hours) || hours === 0) return '-';
    return `${hours.toFixed(1)}h`;
};

export const generateTeamDistributionPDF = (params: TeamPDFGeneratorParams): void => {
    const {
        options,
        teamMembers,
        assignments,
        settings,
        parentTaskGroups,
        getScaledHours,
        getMemberCost,
        getMemberHours,
        getMemberDistributionShare,
        projectName = 'Project',
        clientName = 'Client',
    } = params;

    // Filter data based on options
    const selectedMembers = teamMembers.filter(m => options.selectedMembers.includes(m.id));
    const selectedGroups = parentTaskGroups.filter(g => options.selectedTasks.includes(g.appTaskId));

    // Create PDF document (landscape for more columns)
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Colors
    const primaryColor: [number, number, number] = [212, 175, 55]; // Gold
    const headerBgColor: [number, number, number] = [30, 41, 59]; // Slate-800
    const leadColor: [number, number, number] = [245, 158, 11]; // Amber-500
    const implementerColor: [number, number, number] = [59, 130, 246]; // Blue-500
    const textColor: [number, number, number] = [51, 51, 51];
    const mutedColor: [number, number, number] = [128, 128, 128];

    // Header
    doc.setFillColor(...headerBgColor);
    doc.rect(0, 0, pageWidth, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Team Distribution Report', margin, 12);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(`${projectName} | ${clientName}`, margin, 19);

    doc.setTextColor(...mutedColor);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 19);

    yPosition = 35;

    // Summary Section
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', margin, yPosition);
    yPosition += 8;

    // Calculate totals
    const totalHours = selectedMembers.reduce((sum, m) => sum + getMemberHours(m.id).totalHours, 0);
    const totalCost = selectedMembers.reduce((sum, m) => sum + getMemberCost(m.id), 0);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const summaryItems = [
        `Team Members: ${selectedMembers.length}`,
        `Tasks: ${selectedGroups.length}`,
        `Lead/Implementer Split: ${settings.leadPercentage}% / ${settings.implementerPercentage}%`,
    ];

    if (options.showHours) {
        summaryItems.push(`Total Hours: ${formatHours(totalHours)}`);
    }
    if (options.showCosts) {
        summaryItems.push(`Total Team Cost: ${formatCurrency(totalCost)}`);
    }

    doc.text(summaryItems.join('   |   '), margin, yPosition);
    yPosition += 12;

    // Team Members Overview (if showing costs/hours)
    if ((options.showCosts || options.showHours) && selectedMembers.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Team Overview', margin, yPosition);
        yPosition += 6;

        const teamHeaders = ['Name'];
        if (options.showHourlyRates) teamHeaders.push('Rate');
        if (options.showHours) teamHeaders.push('Lead Hours', 'Impl Hours', 'Total Hours');
        if (options.showCosts) teamHeaders.push('Total Cost');

        const teamData = selectedMembers.map(member => {
            const hours = getMemberHours(member.id);
            const cost = getMemberCost(member.id);
            const row = [member.name + (member.role ? ` (${member.role})` : '')];

            if (options.showHourlyRates) row.push(`$${member.hourlyRate}/hr`);
            if (options.showHours) {
                row.push(formatHours(hours.leadHours));
                row.push(formatHours(hours.implementerHours));
                row.push(formatHours(hours.totalHours));
            }
            if (options.showCosts) row.push(formatCurrency(cost));

            return row;
        });

        autoTable(doc, {
            startY: yPosition,
            head: [teamHeaders],
            body: teamData,
            theme: 'grid',
            headStyles: {
                fillColor: headerBgColor,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
            },
            bodyStyles: {
                fontSize: 9,
                textColor: textColor,
            },
            columnStyles: {
                0: { fontStyle: 'bold' },
            },
            margin: { left: margin, right: margin },
            tableWidth: 'auto',
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Task Allocation Table
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Task Allocation', margin, yPosition);
    yPosition += 6;

    // Build table headers
    const headers = ['Task'];
    if (options.showHours) headers.push('Hours');

    selectedMembers.forEach(member => {
        const displayName = member.name.length > 12 ? member.name.substring(0, 12) + '...' : member.name;
        headers.push(displayName);
    });

    // Build table body
    const tableBody: (string | { content: string; styles?: any })[][] = [];

    selectedGroups.forEach(group => {
        // Parent task row
        const parentRow: (string | { content: string; styles?: any })[] = [
            { content: group.name, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
        ];

        if (options.showHours) {
            const groupHours = group.subTasks.reduce((sum, st) => sum + getScaledHours(st), 0);
            parentRow.push({ content: formatHours(groupHours), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } });
        }

        // Add member columns for parent task summary
        selectedMembers.forEach(member => {
            const memberGroupAssignments = group.subTasks.flatMap(st =>
                assignments.filter(a => a.teamMemberId === member.id && a.subTaskId === st.id)
            );
            const leadCount = memberGroupAssignments.filter(a => a.role === 'lead').length;
            const implCount = memberGroupAssignments.filter(a => a.role === 'implementer').length;

            let cellContent = '';
            if (options.showRoles) {
                const parts = [];
                if (leadCount > 0) parts.push(`L:${leadCount}`);
                if (implCount > 0) parts.push(`I:${implCount}`);
                cellContent = parts.join(' ');
            } else {
                cellContent = (leadCount + implCount) > 0 ? `${leadCount + implCount}` : '-';
            }

            parentRow.push({ content: cellContent, styles: { fillColor: [240, 240, 240], halign: 'center' } });
        });

        tableBody.push(parentRow);

        // Subtask rows (if enabled)
        if (options.showSubtasks) {
            group.subTasks.forEach(subTask => {
                const subRow: (string | { content: string; styles?: any })[] = [
                    { content: `  ${subTask.name}`, styles: { fontSize: 8, textColor: mutedColor } }
                ];

                if (options.showHours) {
                    subRow.push({ content: formatHours(getScaledHours(subTask)), styles: { fontSize: 8 } });
                }

                selectedMembers.forEach(member => {
                    const memberAssignments = assignments.filter(
                        a => a.teamMemberId === member.id && a.subTaskId === subTask.id
                    );

                    if (memberAssignments.length === 0) {
                        subRow.push({ content: '-', styles: { halign: 'center', fontSize: 8 } });
                    } else {
                        const parts: string[] = [];
                        memberAssignments.forEach(a => {
                            if (options.showRoles) {
                                const roleLetter = a.role === 'lead' ? 'L' : 'I';
                                const share = getMemberDistributionShare(subTask.id, a.role, member.id);
                                if (share < 1) {
                                    parts.push(`${roleLetter}:${Math.round(share * 100)}%`);
                                } else {
                                    parts.push(roleLetter);
                                }
                            } else {
                                parts.push('*');
                            }
                        });

                        let cellStyles: any = { halign: 'center', fontSize: 8 };
                        if (memberAssignments.some(a => a.role === 'lead')) {
                            cellStyles.textColor = leadColor;
                        } else if (memberAssignments.some(a => a.role === 'implementer')) {
                            cellStyles.textColor = implementerColor;
                        }

                        subRow.push({ content: parts.join(' '), styles: cellStyles });
                    }
                });

                tableBody.push(subRow);
            });
        }
    });

    autoTable(doc, {
        startY: yPosition,
        head: [headers],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: headerBgColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
        },
        bodyStyles: {
            fontSize: 8,
            textColor: textColor,
        },
        columnStyles: {
            0: { cellWidth: 60 },
        },
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        didDrawPage: (data) => {
            // Footer on each page
            doc.setFontSize(8);
            doc.setTextColor(...mutedColor);
            doc.text(
                `Page ${doc.getNumberOfPages()}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
            doc.text(
                'L = Lead, I = Implementer',
                margin,
                pageHeight - 10
            );
        },
    });

    // Add legend if showing roles
    if (options.showRoles) {
        const finalY = (doc as any).lastAutoTable.finalY + 8;

        if (finalY < pageHeight - 30) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Legend:', margin, finalY);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...leadColor);
            doc.text('L = Lead', margin + 20, finalY);

            doc.setTextColor(...implementerColor);
            doc.text('I = Implementer', margin + 40, finalY);

            doc.setTextColor(...mutedColor);
            doc.text(`(Lead: ${settings.leadPercentage}% of hours, Implementer: ${settings.implementerPercentage}% of hours)`, margin + 75, finalY);
        }
    }

    // Save the PDF
    const fileName = `team-distribution-${projectName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
};
