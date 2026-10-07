import { useState, useEffect, useRef, useMemo } from 'react';
import { Wallet, Camera, X, Check, Receipt, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  FinanzasService,
  CATEGORIAS_EGRESO,
  METODOS_PAGO,
  type CategoriaFinanzas,
  type MetodoPago,
  type Transaccion,
} from '../../services/finanzasService';

// Registro rápido de egresos del módulo Finanzas desde mobile.
// Mismo flujo que NuevaTransaccionDialog (web) sin la opción de préstamo.

const hoy = () => new Date().toISOString().split('T')[0];
const formatMonto = (monto: number) => `S/ ${Number(monto || 0).toFixed(2)}`;

export default function EgresosScreen() {
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState<CategoriaFinanzas | ''>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [fecha, setFecha] = useState(hoy());
  const [proveedor, setProveedor] = useState('');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [notas, setNotas] = useState('');
  const [fotos, setFotos] = useState<File[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [recientes, setRecientes] = useState<Transaccion[]>([]);
  const [cargandoRecientes, setCargandoRecientes] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => fotos.map((f) => URL.createObjectURL(f)), [fotos]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const cargarRecientes = async () => {
    try {
      const { transacciones } = await FinanzasService.listarTransacciones({ tipo: 'EGRESO', limite: 10 });
      setRecientes(transacciones || []);
    } catch (error) {
      console.error('Error cargando egresos recientes:', error);
    } finally {
      setCargandoRecientes(false);
    }
  };

  useEffect(() => {
    cargarRecientes();
  }, []);

  const montoNumero = parseFloat(monto.replace(',', '.'));
  const montoValido = !isNaN(montoNumero) && montoNumero > 0;
  const conceptoValido = concepto.trim().length >= 3;
  const formularioValido = montoValido && conceptoValido && !!categoria && !!fecha;

  const limpiar = () => {
    setMonto('');
    setConcepto('');
    setCategoria('');
    setMetodoPago('EFECTIVO');
    setFecha(hoy());
    setProveedor('');
    setNumeroOperacion('');
    setNotas('');
    setFotos([]);
  };

  const handleFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevas = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    setFotos((prev) => [...prev, ...nuevas]);
    e.target.value = '';
  };

  const handleGuardar = async () => {
    if (!formularioValido || !categoria) return;
    setGuardando(true);
    try {
      const { transaccion_id } = await FinanzasService.registrarTransaccion({
        tipo: 'EGRESO',
        categoria,
        concepto: concepto.trim(),
        monto: montoNumero,
        fecha_transaccion: fecha,
        proveedor_beneficiario: proveedor.trim() || undefined,
        metodo_pago: metodoPago,
        numero_operacion: numeroOperacion.trim() || undefined,
        notas: notas.trim() || undefined,
      });

      // El egreso ya quedó registrado: si falla una foto no se pierde el registro
      let fotosFallidas = 0;
      for (const foto of fotos) {
        try {
          await FinanzasService.subirEvidencia(foto, transaccion_id);
        } catch (error) {
          console.error('Error subiendo comprobante:', error);
          fotosFallidas++;
        }
      }

      if (fotosFallidas > 0) {
        toast.warning(`Egreso registrado, pero ${fotosFallidas} foto(s) no se pudieron subir. Adjúntalas desde la web.`);
      } else {
        toast.success(`Egreso registrado: ${formatMonto(montoNumero)}`);
      }
      limpiar();
      cargarRecientes();
    } catch (error: any) {
      console.error('Error registrando egreso:', error);
      toast.error(error?.message || 'No se pudo registrar el egreso');
    } finally {
      setGuardando(false);
    }
  };

  const etiquetaCategoria = (valor: string) => CATEGORIAS_EGRESO.find((c) => c.value === valor);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <Wallet className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Egresos</h2>
        </div>
        <p className="text-rose-50">Registra un gasto del grupo con su comprobante</p>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow p-4 space-y-5">
        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-gray-400">S/</span>
            <input
              type="text"
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder="0.00"
              className="w-full pl-14 pr-4 py-4 text-3xl font-bold border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Concepto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
          <input
            type="text"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej. Pasajes salida a Chosica"
            maxLength={255}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
          />
          {concepto.length > 0 && !conceptoValido && (
            <p className="text-xs text-red-600 mt-1">Mínimo 3 caracteres</p>
          )}
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIAS_EGRESO.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategoria(c.value)}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm text-left transition-colors ${
                  categoria === c.value
                    ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                    : 'border-gray-200 text-gray-700'
                }`}
              >
                <span className="text-lg">{c.emoji}</span>
                <span className="leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
          <div className="flex flex-wrap gap-2">
            {METODOS_PAGO.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMetodoPago(m.value)}
                className={`px-3 py-2 rounded-full border-2 text-sm transition-colors ${
                  metodoPago === m.value
                    ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                    : 'border-gray-200 text-gray-700'
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        {metodoPago !== 'EFECTIVO' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° de operación</label>
            <input
              type="text"
              inputMode="numeric"
              value={numeroOperacion}
              onChange={(e) => setNumeroOperacion(e.target.value)}
              placeholder="Opcional"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
            />
          </div>
        )}

        {/* Fecha y proveedor */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input
              type="date"
              value={fecha}
              max={hoy()}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor / beneficiario</label>
            <input
              type="text"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              placeholder="Opcional"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Comprobante */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Comprobante</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFotos}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 active:bg-gray-50"
          >
            <Camera className="w-5 h-5" />
            {fotos.length > 0 ? 'Agregar otra foto' : 'Tomar foto del comprobante'}
          </button>
          {fotos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {fotos.map((foto, i) => (
                <div key={`${foto.name}-${i}`} className="relative">
                  <img
                    src={previews[i]}
                    alt={`Comprobante ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => setFotos((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow"
                    aria-label="Quitar foto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Opcional"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleGuardar}
          disabled={!formularioValido || guardando}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-600 text-white text-lg font-semibold shadow disabled:bg-gray-300 disabled:shadow-none active:scale-[0.99] transition-transform"
        >
          {guardando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          {guardando ? 'Registrando...' : `Registrar egreso${montoValido ? ` de ${formatMonto(montoNumero)}` : ''}`}
        </button>
      </div>

      {/* Últimos egresos */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-700">Últimos egresos</h3>
        {cargandoRecientes ? (
          <p className="text-sm text-gray-500 text-center py-4">Cargando...</p>
        ) : recientes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Aún no hay egresos registrados</p>
        ) : (
          recientes.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{t.concepto}</p>
                <p className="text-xs text-gray-500">
                  {etiquetaCategoria(t.categoria)?.emoji} {etiquetaCategoria(t.categoria)?.label || t.categoria}
                  {' · '}
                  {t.fecha_transaccion?.split('T')[0]}
                  {(t.evidencias_count ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-0.5 ml-1">
                      · <Receipt className="w-3 h-3" /> {t.evidencias_count}
                    </span>
                  )}
                </p>
              </div>
              <p className="font-semibold text-red-600 whitespace-nowrap">−{formatMonto(t.monto)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
