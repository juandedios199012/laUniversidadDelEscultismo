import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Check, FileSignature, Plus, Trash2, X } from 'lucide-react';
import { ConfigAnexo4Service } from '../../services/configAnexo4Service';
import { DECLARACIONES_ANEXO4 } from '../../modules/reports/templates/pdf/anexos/anexo4Declaraciones';

/**
 * Textos del Anexo 4 (Autorización de Participación): los usa el PDF que
 * descarga el dirigente y el que ve el padre en el Portal antes del ACEPTO.
 */
const TextosAnexo4: React.FC = () => {
  const [declaraciones, setDeclaraciones] = useState<string[]>([]);
  const [itemsTexto, setItemsTexto] = useState('');
  const [instruccionesPago, setInstruccionesPago] = useState('');
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    ConfigAnexo4Service.obtener()
      .then((cfg) => {
        setDeclaraciones(cfg.declaraciones.length ? cfg.declaraciones : DECLARACIONES_ANEXO4);
        setItemsTexto(cfg.items_que_llevar.join('\n'));
        setInstruccionesPago(cfg.instrucciones_pago || '');
      })
      .catch((err) => setError(err.message || 'Error inesperado'))
      .finally(() => setLoading(false));
  }, []);

  const actualizarDeclaracion = (i: number, texto: string) =>
    setDeclaraciones((prev) => prev.map((d, j) => (j === i ? texto : d)));

  const mover = (i: number, delta: number) =>
    setDeclaraciones((prev) => {
      const j = i + delta;
      if (j < 0 || j >= prev.length) return prev;
      const copia = [...prev];
      [copia[i], copia[j]] = [copia[j], copia[i]];
      return copia;
    });

  const guardar = async () => {
    const limpias = declaraciones.map((d) => d.trim()).filter(Boolean);
    if (limpias.length === 0) {
      setError('Debe haber al menos una declaración');
      return;
    }

    setGuardando(true);
    setError(null);
    setSuccess(null);
    try {
      await ConfigAnexo4Service.actualizar({
        declaraciones: limpias,
        items_que_llevar: itemsTexto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
        instrucciones_pago: instruccionesPago.trim() || null,
      });
      setDeclaraciones(limpias);
      setSuccess('Textos del Anexo 4 actualizados correctamente');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <FileSignature className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Textos Anexo 4</h1>
          <p className="text-sm text-gray-500">
            Autorización de Participación: se usan en el PDF del dirigente y en el que acepta el padre en el Portal de Padres.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-center justify-between">
          <span className="text-red-800 text-sm">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-800 text-sm">{success}</span>
        </div>
      )}

      {/* Declaraciones */}
      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
        <div>
          <h2 className="font-semibold text-gray-800">Declaraciones ("Asimismo, declaro:")</h2>
          <p className="text-xs text-gray-500">
            Es lo que el padre acepta con el botón ACEPTO. Cada aceptación guarda una copia del texto vigente en ese momento.
          </p>
        </div>

        {declaraciones.map((texto, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="mt-2 text-sm font-semibold text-gray-400 w-5">{i + 1}.</span>
            <textarea
              value={texto}
              disabled={loading}
              onChange={(e) => actualizarDeclaracion(i, e.target.value)}
              rows={3}
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <div className="flex flex-col gap-1">
              <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Subir">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => mover(i, 1)} disabled={i === declaraciones.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="Bajar">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeclaraciones((prev) => prev.filter((_, j) => j !== i))}
                className="p-1 text-red-400 hover:text-red-600"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setDeclaraciones((prev) => [...prev, ''])}
          className="flex items-center gap-1 text-sm text-green-700 hover:text-green-800 font-medium"
        >
          <Plus className="h-4 w-4" /> Agregar declaración
        </button>
      </div>

      {/* ¿Qué debo llevar? */}
      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-2">
        <h2 className="font-semibold text-gray-800">"¿Qué debo llevar?" por defecto</h2>
        <p className="text-xs text-gray-500">
          Una línea por ítem. Se usa en la página 2 solo cuando la actividad no tiene equipamiento ni recomendaciones cargadas.
        </p>
        <textarea
          value={itemsTexto}
          disabled={loading}
          onChange={(e) => setItemsTexto(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Instrucciones de pago */}
      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-2">
        <h2 className="font-semibold text-gray-800">Instrucciones de pago (Portal de Padres)</h2>
        <p className="text-xs text-gray-500">
          Se muestran al padre cuando registra el pago. Ej: "Yape / Plin al 987 654 321 — Juan Pérez (Tesorería)".
        </p>
        <textarea
          value={instruccionesPago}
          disabled={loading}
          onChange={(e) => setInstruccionesPago(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando || loading}
          className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:bg-gray-300"
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
};

export default TextosAnexo4;
