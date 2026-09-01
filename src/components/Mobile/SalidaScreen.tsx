import { useState, useEffect } from 'react';
import { PackageMinus, ChevronRight, Users, Check, CircleOff, Package } from 'lucide-react';
import { InventarioService } from '../../services/inventarioService';
import { useSalidaMasiva } from '../../modules/inventario/hooks/useSalidaMasiva';
import { usePermissions } from '../../contexts/PermissionsContext';
import type { InventarioItem } from '../../lib/supabase';

// Mismo catálogo que usa Asistencia/Puntajes en mobile.
const RAMAS_VALIDAS = ['Manada', 'Tropa', 'Comunidad', 'Clan'];

export default function SalidaScreen() {
  const { esAdmin, miRama } = usePermissions();
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemSeleccionado, setItemSeleccionado] = useState<InventarioItem | null>(null);

  useEffect(() => {
    InventarioService.getItemsVisiblesMobile()
      .then(setItems)
      .finally(() => setLoadingItems(false));
  }, []);

  const miRamaFija = !esAdmin && miRama
    ? RAMAS_VALIDAS.find(r => r.toLowerCase() === miRama.trim().toLowerCase()) ?? null
    : null;

  if (itemSeleccionado) {
    return (
      <SalidaFlujo
        item={itemSeleccionado}
        ramaFija={miRamaFija}
        onVolver={() => setItemSeleccionado(null)}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <PackageMinus className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Salida</h2>
        </div>
        <p className="text-red-50">Registra la entrega de un ítem a los participantes</p>
      </div>

      {loadingItems && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando ítems...</p>
        </div>
      )}

      {!loadingItems && items.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-2">
            No hay ítems disponibles para salida
          </p>
          <p className="text-sm text-gray-500">
            En la web, edita un ítem del Inventario y activa "Mostrar en mobile"
          </p>
        </div>
      )}

      {!loadingItems && items.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">
            Selecciona qué vas a entregar
          </h3>

          {items.map(item => (
            <button
              key={item.id}
              onClick={() => setItemSeleccionado(item)}
              className="w-full bg-white rounded-xl p-4 shadow hover:shadow-md transition-all active:scale-98 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">{item.nombre}</h4>
                  <span className="text-sm text-gray-500">
                    📦 {item.cantidad_disponible} disponible{item.cantidad_disponible === 1 ? '' : 's'}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface SalidaFlujoProps {
  item: InventarioItem;
  ramaFija: string | null;
  onVolver: () => void;
}

function SalidaFlujo({ item, ramaFija, onVolver }: SalidaFlujoProps) {
  const [paso, setPaso] = useState<1 | 2>(ramaFija ? 2 : 1);
  const {
    rama, setRama,
    fecha, setFecha,
    elegibles, entregados, toggle,
    cargando, guardando, error, resultado,
    stockDisponible, totalMarcados,
    cargarElegibles, guardar,
  } = useSalidaMasiva(item);

  useEffect(() => {
    if (ramaFija) setRama(ramaFija);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ramaFija]);

  const handleCargar = async () => {
    if (await cargarElegibles()) setPaso(2);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <PackageMinus className="w-8 h-8" />
          <h2 className="text-xl font-bold">{item.nombre}</h2>
        </div>
        <p className="text-red-50">{stockDisponible} disponible{stockDisponible === 1 ? '' : 's'}</p>
      </div>

      <button onClick={onVolver} className="text-red-600 font-medium text-sm">
        ← Elegir otro ítem
      </button>

      {/* PASO 1: rama + fecha (solo si el dirigente no tiene una rama fija) */}
      {paso === 1 && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rama</label>
            <select
              value={rama}
              onChange={e => setRama(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Selecciona una rama...</option>
              {RAMAS_VALIDAS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de entrega</label>
            <input
              type="date"
              value={fecha}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setFecha(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleCargar}
            disabled={cargando || !rama || stockDisponible < 1}
            className="w-full py-3 text-sm font-semibold text-white bg-red-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? 'Cargando...' : 'Cargar participantes'}
          </button>
        </div>
      )}

      {/* PASO 2: grilla de participantes o resumen tras guardar */}
      {paso === 2 && (
        <>
          {!resultado && (
            <>
              {!ramaFija && (
                <p className="text-sm text-gray-500">
                  🏕️ {rama} • 📅 {fecha}
                </p>
              )}

              <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-blue-800">
                    {totalMarcados} de {elegibles.length} marcados
                  </span>
                </div>
                {totalMarcados > stockDisponible && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                    Solo hay {stockDisponible}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Todos empiezan marcados como "entregado". Toca a quien NO recibió el ítem.
              </p>

              <div className="space-y-2">
                {elegibles.map(p => {
                  const marcado = !!entregados[p.persona_id];
                  return (
                    <button
                      key={p.persona_id}
                      onClick={() => toggle(p.persona_id)}
                      className={`w-full flex items-center justify-between gap-3 rounded-xl p-3 shadow transition-all active:scale-98 text-left ${
                        marcado ? 'bg-white' : 'bg-red-50 border-2 border-red-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {p.nombres} {p.apellidos}
                        </p>
                        <p className="text-xs text-gray-400">{p.codigo_asociado}</p>
                      </div>
                      {marcado ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600 shrink-0">
                          <Check className="w-4 h-4" /> Entregado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-500 shrink-0">
                          <CircleOff className="w-4 h-4" /> No recibió
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                onClick={guardar}
                disabled={guardando || totalMarcados === 0}
                className="w-full py-3 text-sm font-semibold text-white bg-red-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? 'Guardando...' : `Guardar ${totalMarcados} entrega${totalMarcados === 1 ? '' : 's'}`}
              </button>
            </>
          )}

          {resultado && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-green-50 rounded-xl p-4">
                <Check className="w-5 h-5 text-green-600 shrink-0" />
                <span className="text-sm font-semibold text-green-800">
                  {resultado.entregados} entrega{resultado.entregados === 1 ? '' : 's'} registrada{resultado.entregados === 1 ? '' : 's'}
                </span>
              </div>

              {resultado.fallidos.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2">
                    {resultado.fallidos.length} no se pudieron registrar (sin stock):
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1">
                    {resultado.fallidos.map(f => {
                      const persona = elegibles.find(p => p.persona_id === f.persona_id);
                      return (
                        <li key={f.persona_id}>
                          {persona ? `${persona.nombres} ${persona.apellidos}` : f.persona_id}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <button
                onClick={onVolver}
                className="w-full py-3 text-sm font-semibold text-white bg-red-600 rounded-xl"
              >
                Registrar otra entrega
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
