import React from 'react';
import { HijoInfo } from '../../services/portalPadresService';
import { ArrowLeft, User, Calendar, Hash, Shield, Users } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function calcularEdad(fechaNacimiento: string | null): string {
  if (!fechaNacimiento) return '—';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

function formatFecha(fecha: string | null): string {
  if (!fecha) return '—';
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
}

const RAMA_COLORS: Record<string, string> = {
  manada:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  scout:     'bg-green-100 text-green-800 border-green-200',
  caminante: 'bg-blue-100 text-blue-800 border-blue-200',
  rover:     'bg-purple-100 text-purple-800 border-purple-200',
};

function ramaColor(rama: string): string {
  const key = rama.toLowerCase();
  return RAMA_COLORS[key] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface DetalleHijoProps {
  hijo: HijoInfo;
  onVolver?: () => void;  // undefined si es vista directa (solo 1 hijo)
}

// ─────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────

const DetalleHijo: React.FC<DetalleHijoProps> = ({ hijo, onVolver }) => {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Botón volver */}
      {onVolver && (
        <button
          type="button"
          onClick={onVolver}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Ver todos mis scouts
        </button>
      )}

      {/* Tarjeta principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8 text-white">
          <div className="flex items-center gap-6">
            {hijo.foto_url ? (
              <img
                src={hijo.foto_url}
                alt={hijo.nombre_completo}
                className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-white/40"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shadow-lg border-2 border-white/30">
                <User className="w-10 h-10 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-black tracking-tight">{hijo.nombre_completo}</h2>
              <p className="text-blue-100 text-sm capitalize mt-1">{hijo.parentesco}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold border capitalize ${ramaColor(hijo.rama_actual)} bg-white/20 text-white border-white/30`}>
                  {hijo.rama_actual}
                </span>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                  hijo.estado?.toUpperCase() === 'ACTIVO'
                    ? 'bg-green-500/20 text-green-100 border-green-400/40'
                    : 'bg-red-500/20 text-red-100 border-red-400/40'
                }`}>
                  {hijo.estado?.toUpperCase() === 'ACTIVO' ? 'Activo' : hijo.estado}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Datos */}
        <div className="px-8 py-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Información del Scout
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {hijo.codigo_asociado && (
              <DataRow
                icon={<Hash className="w-4 h-4 text-blue-500" />}
                label="Código asociado"
                value={hijo.codigo_asociado}
              />
            )}

            <DataRow
              icon={<Calendar className="w-4 h-4 text-green-500" />}
              label="Fecha de nacimiento"
              value={formatFecha(hijo.fecha_nacimiento)}
            />

            <DataRow
              icon={<User className="w-4 h-4 text-purple-500" />}
              label="Edad"
              value={calcularEdad(hijo.fecha_nacimiento)}
            />

            <DataRow
              icon={<Shield className="w-4 h-4 text-orange-500" />}
              label="Rama actual"
              value={<span className="capitalize">{hijo.rama_actual}</span>}
            />

            <DataRow
              icon={<Users className="w-4 h-4 text-teal-500" />}
              label="Relación"
              value={<span className="capitalize">{hijo.parentesco}</span>}
            />
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mx-8 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-700">
            Esta es una vista de solo lectura. Para actualizar datos de tu scout, contacta
            al dirigente de su rama.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Sub-componente auxiliar
// ─────────────────────────────────────────────────────────────

interface DataRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const DataRow: React.FC<DataRowProps> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
    <div className="mt-0.5 flex-shrink-0">{icon}</div>
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

export default DetalleHijo;
