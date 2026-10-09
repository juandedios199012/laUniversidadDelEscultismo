import React, { useEffect, useState } from 'react';
import { Heart, Lock, AlertCircle, RefreshCw, BellRing } from 'lucide-react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMisHijos } from './hooks/useMisHijos';
import {
  HijoInfo,
  ActividadHijo,
  autorizacionPendiente,
  pagoPendiente,
} from '../../services/portalPadresService';
import { ConfigAnexo4, ConfigAnexo4Service } from '../../services/configAnexo4Service';
import { useActividadesHijos } from './hooks/useActividadesHijos';
import PendientesAsistente from './PendientesAsistente';
import MisHijosGrid from './MisHijosGrid';
import DetalleHijo from './DetalleHijo';

// Usuarios a los que ya se abrió el asistente en esta carga de la app:
// se vuelve a abrir en cada nuevo ingreso (o recarga) mientras haya pendientes.
const asistenteAbiertoPara = new Set<string>();

const CONFIG_VACIA: ConfigAnexo4 = { declaraciones: [], items_que_llevar: [], instrucciones_pago: null };

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────

const PortalPadresDashboard: React.FC = () => {
  const { puedeAcceder } = usePermissions();
  const { hijos, loading, error, refetch } = useMisHijos();
  const [hijoSeleccionado, setHijoSeleccionado] = useState<HijoInfo | null>(null);
  const { user } = useAuth();
  const tieneAcceso = puedeAcceder('portal_padres');
  const {
    actividades,
    loading: loadingActividades,
    refetch: refetchActividades,
  } = useActividadesHijos(undefined, tieneAcceso);
  const [config, setConfig] = useState<ConfigAnexo4>(CONFIG_VACIA);
  const [asistenteIds, setAsistenteIds] = useState<string[] | null>(null);

  // Pendientes: Anexo 4 sin aceptar o pago incompleto, agrupados por hijo
  const pendientes = actividades
    .filter((a) => a.vigente && (autorizacionPendiente(a) || pagoPendiente(a)))
    .sort((x, y) =>
      x.scout_nombre.localeCompare(y.scout_nombre) ||
      (x.fecha_inicio || '').localeCompare(y.fecha_inicio || ''),
    );

  useEffect(() => {
    if (tieneAcceso) ConfigAnexo4Service.obtenerOVacio().then(setConfig);
  }, [tieneAcceso]);

  // Al ingresar: si hay pendientes, abrir el asistente (Anexo 4 → ACEPTO → pago)
  useEffect(() => {
    if (!user?.id || loadingActividades || pendientes.length === 0) return;
    if (asistenteAbiertoPara.has(user.id)) return;
    asistenteAbiertoPara.add(user.id);
    setAsistenteIds(pendientes.map((a) => a.participante_id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loadingActividades, pendientes.length]);

  const abrirAsistente = (ids: string[]) => setAsistenteIds(ids);

  const asistente = (
    <PendientesAsistente
      open={!!asistenteIds}
      onOpenChange={(o) => !o && setAsistenteIds(null)}
      participanteIds={asistenteIds ?? []}
      actividades={actividades}
      config={config}
      onRefresh={refetchActividades}
    />
  );

  // ── Guardia de acceso ──────────────────────────────────────
  if (!tieneAcceso) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Acceso Restringido</h3>
        <p className="text-gray-500 text-sm max-w-sm">
          No tienes permiso para ver el Portal de Padres. Contacta al administrador del sistema.
        </p>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader />
        <div className="mt-8 flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-1">Error al cargar los datos</h3>
          <p className="text-gray-500 text-sm mb-4 max-w-sm">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Sin hijos vinculados ───────────────────────────────────
  if (hijos.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader />
        <div className="mt-8 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-blue-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No hay scouts vinculados</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Tu cuenta aún no tiene scouts asociados. Comunícate con los dirigentes del grupo
            para que vinculen a tu hijo/a.
          </p>
        </div>
      </div>
    );
  }

  // ── Vista de detalle ───────────────────────────────────────
  const hijoAMostrar = hijoSeleccionado ?? (hijos.length === 1 ? hijos[0] : null);

  if (hijoAMostrar) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader count={hijos.length} />
        <PendientesAviso pendientes={pendientes} onCompletar={() => abrirAsistente(pendientes.map((a) => a.participante_id))} />
        <div className="mt-8">
          <DetalleHijo
            hijo={hijoAMostrar}
            onVolver={hijos.length > 1 ? () => setHijoSeleccionado(null) : undefined}
            actividades={actividades.filter((a) => a.scout_id === hijoAMostrar.scout_id)}
            configAnexo4={config}
            onCompletarActividad={(id) => abrirAsistente([id])}
          />
        </div>
        {asistente}
      </div>
    );
  }

  // ── Grid de hijos (múltiples) ──────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader count={hijos.length} />
      <PendientesAviso pendientes={pendientes} onCompletar={() => abrirAsistente(pendientes.map((a) => a.participante_id))} />
      <div className="mt-8">
        <MisHijosGrid hijos={hijos} onSeleccionar={setHijoSeleccionado} />
      </div>
      {asistente}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Aviso de pendientes: reabre el asistente si lo cerró
// ─────────────────────────────────────────────────────────────

const PendientesAviso: React.FC<{
  pendientes: ActividadHijo[];
  onCompletar: () => void;
}> = ({ pendientes, onCompletar }) => {
  if (pendientes.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <BellRing className="w-5 h-5 text-amber-600" />
          <h2 className="font-bold text-amber-900">
            {pendientes.length} autorización{pendientes.length !== 1 ? 'es' : ''} / pago{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''}
          </h2>
        </div>
        <p className="text-sm text-amber-800">
          {pendientes.map((a) => `${a.scout_nombre.split(' ')[0]} · ${a.nombre}`).join(' — ')}
        </p>
      </div>
      <button
        type="button"
        onClick={onCompletar}
        className="shrink-0 px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors"
      >
        Completar ahora
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Sub-componente header de página
// ─────────────────────────────────────────────────────────────

const PageHeader: React.FC<{ count?: number }> = ({ count }) => (
  <div className="flex items-start justify-between">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
        <Heart className="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-black text-gray-800">Portal de Padres</h1>
        <p className="text-sm text-gray-500">
          {count !== undefined
            ? `${count} scout${count !== 1 ? 's' : ''} vinculado${count !== 1 ? 's' : ''}`
            : 'Información de tus scouts'}
        </p>
      </div>
    </div>
  </div>
);

export default PortalPadresDashboard;
