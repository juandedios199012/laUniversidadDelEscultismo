import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Scout, GROWTH_AREAS, STAGES } from '@/types/scout';
import { calculateProgress } from '@/data/mockData';

interface PDFConfig {
  title: string;
  primaryColor: [number, number, number];
  secondaryColor: [number, number, number];
}

const config: PDFConfig = {
  title: 'Reporte de Progresión Scout',
  primaryColor: [0, 180, 180], // Cyan
  secondaryColor: [34, 40, 60], // Dark blue
};

// Helper to convert HSL to RGB
const hslToRgb = (hsl: string): [number, number, number] => {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return [128, 128, 128];
  
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

export const generateScoutProgressPDF = (scout: Scout, patrolName: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const stageInfo = STAGES.find((s) => s.id === scout.currentStage);
  const overallProgress = calculateProgress(scout.objectives);

  // Header with gradient effect
  doc.setFillColor(...config.secondaryColor);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Accent line
  doc.setFillColor(...config.primaryColor);
  doc.rect(0, 50, pageWidth, 3, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Scout Tracker', 15, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte de Progresión Individual', 15, 30);

  // Date
  doc.setFontSize(10);
  doc.text(
    `Generado: ${new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    15,
    42
  );

  // Scout info section
  let yPos = 65;

  // Scout name box
  doc.setFillColor(240, 250, 255);
  doc.roundedRect(15, yPos - 5, pageWidth - 30, 45, 3, 3, 'F');

  doc.setTextColor(...config.secondaryColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(scout.name, 25, yPos + 10);

  // Stage badge
  if (stageInfo) {
    const stageColor = hslToRgb(stageInfo.color);
    doc.setFillColor(...stageColor);
    doc.roundedRect(25, yPos + 17, 50, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`${stageInfo.icon} ${stageInfo.name}`, 28, yPos + 23);
  }

  // Info details
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Patrulla: ${patrolName}`, 90, yPos + 10);
  doc.text(
    `Fecha de ingreso: ${scout.joinDate.toLocaleDateString('es-ES')}`,
    90,
    yPos + 18
  );

  // Progress circle info
  doc.setTextColor(...config.primaryColor);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`${overallProgress.percentage}%`, pageWidth - 55, yPos + 15);
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('Progreso Total', pageWidth - 55, yPos + 22);
  doc.text(
    `${overallProgress.completed}/${overallProgress.total} objetivos`,
    pageWidth - 55,
    yPos + 28
  );

  yPos += 55;

  // Progress by Area section
  doc.setTextColor(...config.secondaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Progreso por Área de Crecimiento', 15, yPos);

  yPos += 8;

  // Areas grid
  const areasPerRow = 2;
  const areaWidth = (pageWidth - 40) / areasPerRow;
  const areaHeight = 22;

  GROWTH_AREAS.forEach((area, index) => {
    const areaProgress = calculateProgress(scout.objectives, area.id);
    const col = index % areasPerRow;
    const row = Math.floor(index / areasPerRow);
    const x = 15 + col * (areaWidth + 5);
    const y = yPos + row * (areaHeight + 5);

    // Area card background
    const areaColor = hslToRgb(area.color);
    doc.setFillColor(areaColor[0], areaColor[1], areaColor[2]);
    doc.roundedRect(x, y, areaWidth, areaHeight, 2, 2, 'F');

    // Area icon and name
    doc.setTextColor(...areaColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${area.icon} ${area.name}`, x + 5, y + 8);

    // Progress bar background
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(x + 5, y + 12, areaWidth - 35, 4, 1, 1, 'F');

    // Progress bar fill
    const progressWidth = ((areaWidth - 35) * areaProgress.percentage) / 100;
    doc.setFillColor(...areaColor);
    doc.roundedRect(x + 5, y + 12, progressWidth, 4, 1, 1, 'F');

    // Percentage
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.text(`${areaProgress.percentage}%`, x + areaWidth - 25, y + 15);
  });

  yPos += Math.ceil(GROWTH_AREAS.length / areasPerRow) * (areaHeight + 5) + 15;

  // Objectives tables by area
  doc.setTextColor(...config.secondaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Objetivos por Área', 15, yPos);

  yPos += 5;

  GROWTH_AREAS.forEach((area) => {
    const areaObjectives = scout.objectives.filter((obj) => obj.area === area.id);
    if (areaObjectives.length === 0) return;

    const areaColor = hslToRgb(area.color);

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // Area header
    autoTable(doc, {
      startY: yPos,
      head: [
        [
          {
            content: `${area.icon} ${area.name}`,
            colSpan: 3,
            styles: {
              fillColor: areaColor,
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 11,
            },
          },
        ],
      ],
      body: areaObjectives.map((obj) => {
        const stageObj = STAGES.find((s) => s.id === obj.stage);
        return [
          obj.completed ? '✓' : '○',
          obj.title,
          obj.completed && obj.completedAt
            ? obj.completedAt.toLocaleDateString('es-ES')
            : stageObj?.name || '-',
        ];
      }),
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 35, halign: 'center', fontSize: 8 },
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: areaColor,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        // Style completed checkmark
        if (data.column.index === 0 && data.cell.text[0] === '✓') {
          data.cell.styles.textColor = [0, 180, 140];
        }
        if (data.column.index === 0 && data.cell.text[0] === '○') {
          data.cell.styles.textColor = [180, 180, 180];
        }
      },
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...config.secondaryColor);
    doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
    doc.setTextColor(180, 200, 220);
    doc.setFontSize(8);
    doc.text(
      `Scout Tracker - Reporte de ${scout.name}`,
      15,
      doc.internal.pageSize.getHeight() - 5
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 35,
      doc.internal.pageSize.getHeight() - 5
    );
  }

  // Save the PDF
  const fileName = `reporte_${scout.name.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Generate patrol report with all scouts
export const generatePatrolReportPDF = (
  patrolName: string,
  scouts: Scout[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(...config.secondaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  doc.setFillColor(...config.primaryColor);
  doc.rect(0, 45, pageWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Scout Tracker', 15, 18);
  doc.setFontSize(14);
  doc.text(`Reporte de ${patrolName}`, 15, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generado: ${new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    15,
    38
  );

  let yPos = 60;

  // Summary table
  doc.setTextColor(...config.secondaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Progreso', 15, yPos);

  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Scout', 'Etapa', 'Progreso', 'Completados', 'Pendientes']],
    body: scouts.map((scout) => {
      const progress = calculateProgress(scout.objectives);
      const stageInfo = STAGES.find((s) => s.id === scout.currentStage);
      return [
        scout.name,
        `${stageInfo?.icon || ''} ${stageInfo?.name || scout.currentStage}`,
        `${progress.percentage}%`,
        progress.completed.toString(),
        (progress.total - progress.completed).toString(),
      ];
    }),
    headStyles: {
      fillColor: config.primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    margin: { left: 15, right: 15 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Progress by stage chart (text version)
  doc.setTextColor(...config.secondaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Distribución por Etapa', 15, yPos);

  yPos += 10;

  STAGES.forEach((stage) => {
    const stageScouts = scouts.filter((s) => s.currentStage === stage.id);
    const stageColor = hslToRgb(stage.color);
    const percentage =
      scouts.length > 0 ? (stageScouts.length / scouts.length) * 100 : 0;
    const barWidth = ((pageWidth - 80) * percentage) / 100;

    doc.setFillColor(230, 230, 230);
    doc.roundedRect(60, yPos - 4, pageWidth - 80, 8, 2, 2, 'F');

    doc.setFillColor(...stageColor);
    doc.roundedRect(60, yPos - 4, barWidth, 8, 2, 2, 'F');

    doc.setTextColor(...stageColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${stage.icon} ${stage.name}`, 15, yPos + 2);

    doc.setTextColor(80, 80, 80);
    doc.text(
      `${stageScouts.length} (${Math.round(percentage)}%)`,
      pageWidth - 35,
      yPos + 2
    );

    yPos += 15;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...config.secondaryColor);
    doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, 'F');
    doc.setTextColor(180, 200, 220);
    doc.setFontSize(8);
    doc.text(
      `Scout Tracker - ${patrolName}`,
      15,
      doc.internal.pageSize.getHeight() - 5
    );
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 35,
      doc.internal.pageSize.getHeight() - 5
    );
  }

  const fileName = `reporte_${patrolName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
