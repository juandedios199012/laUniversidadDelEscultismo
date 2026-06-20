/**
 * ======================================================================
 * 📥 GENERADOR DE PLANTILLA EXCEL — Genérico (ExcelJS)
 * ======================================================================
 * Construye y descarga una plantilla .xlsx a partir de un ImportConfig:
 * una hoja por cada SheetDef (padre + hijas), con encabezados estilados,
 * una fila de ayuda y una fila de ejemplo.
 * ======================================================================
 */
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ImportConfig, SheetDef } from './types';

function addSheet(workbook: ExcelJS.Workbook, def: SheetDef): void {
  const sheet = workbook.addWorksheet(def.sheetName);

  sheet.columns = def.columns.map((col) => ({
    header: col.required ? `${col.header} *` : col.header,
    key: col.key,
    width: Math.max(16, col.header.length + 6),
  }));

  // Estilo del encabezado
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' }, // emerald-600
    };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF0F766E' } },
    };
  });

  // Fila de ayuda (gris)
  const helpRow = sheet.addRow(
    def.columns.reduce<Record<string, string>>((acc, col) => {
      acc[col.key] = col.help ?? '';
      return acc;
    }, {}),
  );
  helpRow.font = { italic: true, size: 9, color: { argb: 'FF6B7280' } };

  // Fila de ejemplo
  sheet.addRow(
    def.columns.reduce<Record<string, string>>((acc, col) => {
      acc[col.key] = col.example ?? '';
      return acc;
    }, {}),
  );

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

/** Genera y descarga la plantilla del config. */
export async function downloadTemplate(config: ImportConfig): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Grupo Scout Lima 12';
  workbook.created = new Date();

  addSheet(workbook, config.parentSheet);
  for (const child of config.childSheets ?? []) {
    addSheet(workbook, child);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `${config.templateFileName ?? config.id}_plantilla.xlsx`;
  saveAs(new Blob([buffer]), fileName);
}
