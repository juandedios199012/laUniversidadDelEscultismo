import React from 'react';
import { HijoInfo } from '../../services/portalPadresService';
import { User, Calendar, Hash, Shield, ChevronRight } from 'lucide-react';

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

const RAMA_COLORS: Record<string, string> = {
  manada:    'bg-yellow-100 text-yellow-800',
  scout:     'bg-green-100 text-green-800',
  caminante: 'bg-blue-100 text-blue-800',
  rover:     'bg-purple-100 text-purple-800',
};

function ramaColor(rama: string): string {
  const key = rama.toLowerCase();
  return RAMA_COLORS[key] ?? 'bg-gray-100 text-gray-700';
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface MisHijosGridProps {
  hijos: HijoInfo[];
  onSeleccionar: (hijo: HijoInfo) => void;
}

// ─────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────

const MisHijosGrid: React.FC<MisHijosGridProps> = ({ hijos, onSeleccionar }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {hijos.map((hijo) => (
        <button
          key={hijo.scout_id}
          type="button"
          onClick={() => onSeleccionar(hijo)}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left hover:shadow-md hover:border-blue-200 transition-all duration-200 group"
        >
          {/* Foto / Avatar */}
          <div className="flex items-center gap-4 mb-4">
            {hijo.foto_url ? (
              <img
                src={hijo.foto_url}
                alt={hijo.nombre_completo}
                className="w-16 h-16 rounded-full object-cover shadow"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 truncate">{hijo.nombre_completo}</h3>
              <p className="text-xs text-gray-500 capitalize">{hijo.parentesco}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${ramaColor(hijo.rama_actual)}`}>
              {hijo.rama_actual}
            </span>
            {hijo.estado?.toUpperCase() === 'ACTIVO' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                Activo
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                {hijo.estado}
              </span>
            )}
          </div>

          {/* Info rápida */}
          <div className="space-y-1 text-sm text-gray-600">
            {hijo.codigo_asociado && (
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>{hijo.codigo_asociado}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>{calcularEdad(hijo.fecha_nacimiento)}</span>
            </div>
          </div>

          {/* Flecha */}
          <div className="mt-4 flex items-center justify-end text-blue-500 text-xs font-medium group-hover:translate-x-1 transition-transform">
            Ver detalle <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </button>
      ))}
    </div>
  );
};

export default MisHijosGrid;
