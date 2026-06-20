/**
 * ======================================================================
 * 📥 ImportDialog — Diálogo genérico de importación desde Excel
 * ======================================================================
 * Modal autocontenido (Tailwind) que funciona con cualquier ImportConfig:
 *   1. Subir archivo / descargar plantilla
 *   2. Vista previa (registros, hijos, errores, duplicados)
 *   3. Confirmar (opción: actualizar duplicados)
 *   4. Progreso
 *   5. Resumen
 * ======================================================================
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  ImportConfig,
  ImportSummary,
  ParseOutcome,
} from '../../../lib/import';
import {
  parseWorkbook,
  prepareRecords,
  downloadTemplate,
  runImport,
} from '../../../lib/import';

interface ImportDialogProps {
  config: ImportConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se llama tras una importación que creó o actualizó algo. */
  onCompleted?: () => void;
}

type Step = 'upload' | 'preview' | 'running' | 'summary';

export const ImportDialog: React.FC<ImportDialogProps> = ({
  config,
  open,
  onOpenChange,
  onCompleted,
}) => {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [parsing, setParsing] = useState(false);
  const [outcome, setOutcome] = useState<ParseOutcome | null>(null);
  const [updateDuplicates, setUpdateDuplicates] = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const childKeys = useMemo(
    () => (config.childSheets ?? []).map((c) => c.targetKey),
    [config.childSheets],
  );

  const reset = useCallback(() => {
    setStep('upload');
    setFileName('');
    setParsing(false);
    setOutcome(null);
    setUpdateDuplicates(true);
    setProgress({ done: 0, total: 0 });
    setSummary(null);
  }, []);

  const close = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      await downloadTemplate(config);
      toast.success('Plantilla descargada');
    } catch (err) {
      toast.error('No se pudo generar la plantilla');
      console.error(err);
    }
  }, [config]);

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setParsing(true);
      try {
        const sheetNames = [
          config.parentSheet.sheetName,
          ...(config.childSheets ?? []).map((c) => c.sheetName),
        ];
        const sheets = await parseWorkbook(file, sheetNames);
        const result = await prepareRecords(config, sheets);
        setOutcome(result);
        setStep('preview');
        if (result.records.length === 0 && result.errors.length === 0) {
          toast.warning('El archivo no contiene filas para importar');
        }
      } catch (err) {
        console.error(err);
        toast.error('No se pudo leer el archivo. ¿Es un .xlsx válido?');
      } finally {
        setParsing(false);
      }
    },
    [config],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile],
  );

  const importable = useMemo(
    () => outcome?.records ?? [],
    [outcome],
  );
  const duplicatesCount = useMemo(
    () => importable.filter((r) => r.existingId).length,
    [importable],
  );

  const handleRun = useCallback(async () => {
    if (!outcome) return;
    setStep('running');
    setProgress({ done: 0, total: outcome.records.length });
    try {
      const result = await runImport(config, outcome.records, {
        updateDuplicates,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setSummary(result);
      setStep('summary');

      if (result.failed > 0) {
        toast.error(
          `Importación con errores: ${result.failed} fallidas`,
        );
      } else {
        toast.success(
          `Importación completa: ${result.created} creadas, ${result.updated} actualizadas`,
        );
      }
      if (result.created > 0 || result.updated > 0) onCompleted?.();
    } catch (err) {
      console.error(err);
      toast.error('Error durante la importación');
      setStep('preview');
    }
  }, [outcome, config, updateDuplicates, onCompleted]);

  if (!open) return null;

  const progressPct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Importar — {config.label}
              </h2>
              {config.description && (
                <p className="text-xs text-gray-500 max-w-xl">
                  {config.description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* PASO 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                <Download className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-900">
                    ¿Primera vez? Descarga la plantilla
                  </p>
                  <p className="text-xs text-emerald-700 mb-3">
                    Incluye una hoja por cada sección, con encabezados, ayuda y
                    un ejemplo. Rellénala y vuelve a subirla aquí.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                    Descargar plantilla
                  </button>
                </div>
              </div>

              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-gray-50 transition-colors">
                  {parsing ? (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-sm">Leyendo archivo…</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Upload className="w-8 h-8" />
                      <span className="text-sm font-medium text-gray-700">
                        Haz clic para seleccionar un archivo .xlsx
                      </span>
                      <span className="text-xs">
                        {fileName || 'Ningún archivo seleccionado'}
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={onInputChange}
                    disabled={parsing}
                  />
                </div>
              </label>
            </div>
          )}

          {/* PASO 2: PREVIEW */}
          {step === 'preview' && outcome && (
            <div className="space-y-4">
              {/* Resumen de chequeo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {importable.length}
                  </p>
                  <p className="text-xs text-blue-600">Registros</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">
                    {duplicatesCount}
                  </p>
                  <p className="text-xs text-amber-600">Ya existen</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">
                    {outcome.errors.length}
                  </p>
                  <p className="text-xs text-red-600">Filas con error</p>
                </div>
              </div>

              {/* Errores */}
              {outcome.errors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Filas que se omitirán por errores
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {outcome.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-600">
                        <span className="font-medium">
                          {e.sheet} · fila {e.excelRow}:
                        </span>{' '}
                        {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tabla de registros */}
              {importable.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">#</th>
                        <th className="text-left px-3 py-2 font-medium">
                          Registro
                        </th>
                        {childKeys.map((k) => (
                          <th
                            key={k}
                            className="text-center px-3 py-2 font-medium capitalize"
                          >
                            {k}
                          </th>
                        ))}
                        <th className="text-center px-3 py-2 font-medium">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {importable.map((r) => (
                        <tr key={r.index}>
                          <td className="px-3 py-2 text-gray-400">
                            {r.index + 1}
                          </td>
                          <td className="px-3 py-2 text-gray-800">
                            {r.duplicateKey ?? `Registro ${r.index + 1}`}
                          </td>
                          {childKeys.map((k) => (
                            <td
                              key={k}
                              className="px-3 py-2 text-center text-gray-600"
                            >
                              {r.childCounts[k] ?? 0}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center">
                            {r.existingId ? (
                              <span className="inline-flex items-center gap-1 text-amber-600 text-xs">
                                <RefreshCw className="w-3 h-3" />
                                Existe
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600 text-xs">
                                <CheckCircle2 className="w-3 h-3" />
                                Nuevo
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Opción duplicados */}
              {duplicatesCount > 0 && (
                <label className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateDuplicates}
                    onChange={(e) => setUpdateDuplicates(e.target.checked)}
                    className="w-4 h-4 accent-amber-600"
                  />
                  <span className="text-sm text-amber-800">
                    Actualizar los {duplicatesCount} registros que ya existen
                    (si se desmarca, se omitirán).
                  </span>
                </label>
              )}
            </div>
          )}

          {/* PASO 3: RUNNING */}
          {step === 'running' && (
            <div className="py-10 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-sm text-gray-600">
                Importando {progress.done} de {progress.total}…
              </p>
              <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* PASO 4: SUMMARY */}
          {step === 'summary' && summary && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-700">
                    {summary.created}
                  </p>
                  <p className="text-xs text-emerald-600">Creadas</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {summary.updated}
                  </p>
                  <p className="text-xs text-blue-600">Actualizadas</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-700">
                    {summary.skipped}
                  </p>
                  <p className="text-xs text-gray-600">Omitidas</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">
                    {summary.failed}
                  </p>
                  <p className="text-xs text-red-600">Fallidas</p>
                </div>
              </div>

              {summary.errors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2 text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Errores</span>
                  </div>
                  <ul className="space-y-1">
                    {summary.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-600">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          {step === 'preview' ? (
            <>
              <button
                type="button"
                onClick={reset}
                className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
              >
                Elegir otro archivo
              </button>
              <button
                type="button"
                onClick={handleRun}
                disabled={importable.length === 0}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-5 py-2 rounded-lg"
              >
                <Upload className="w-4 h-4" />
                Importar {importable.length} registros
              </button>
            </>
          ) : step === 'summary' ? (
            <>
              <button
                type="button"
                onClick={reset}
                className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
              >
                Importar otro archivo
              </button>
              <button
                type="button"
                onClick={close}
                className="bg-gray-800 hover:bg-gray-900 text-white text-sm px-5 py-2 rounded-lg"
              >
                Cerrar
              </button>
            </>
          ) : (
            <div className="ml-auto">
              <button
                type="button"
                onClick={close}
                disabled={step === 'running'}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 px-4 py-2"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportDialog;
