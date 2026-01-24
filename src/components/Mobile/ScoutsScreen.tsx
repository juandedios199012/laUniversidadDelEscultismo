import { useState, useEffect } from 'react';
import { Users, Search, Phone, MapPin, Award, UserPlus, Edit3 } from 'lucide-react';
import ScoutService from '../../services/scoutService';
import RegistroScoutRapido from './RegistroScoutRapido';
import EditarScoutMobile from './EditarScoutMobile';

interface Scout {
  id: string;
  codigo_asociado: string;
  nombres: string;
  apellidos: string;
  rama_actual: string;
  fecha_nacimiento?: string;
  celular_scout?: string;
  celular_apoderado?: string;
  direccion?: string;
  patrulla?: string;
  estado: string;
}

export default function ScoutsScreen() {
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [filtrados, setFiltrados] = useState<Scout[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [ramaFiltro, setRamaFiltro] = useState('');
  const [loading, setLoading] = useState(false);
  const [scoutSeleccionado, setScoutSeleccionado] = useState<Scout | null>(null);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [mostrarEditar, setMostrarEditar] = useState(false);

  const ramas = ['Todas', 'Manada', 'Tropa', 'Comunidad', 'Clan'];

  useEffect(() => {
    cargarScouts();
  }, []);

  useEffect(() => {
    filtrarScouts();
  }, [busqueda, ramaFiltro, scouts]);

  const cargarScouts = async () => {
    setLoading(true);
    try {
      const data = await ScoutService.getAllScouts();
      console.log('📱 Scouts cargados:', data);
      setScouts(data || []);
      setFiltrados(data || []);
    } catch (error) {
      console.error('Error al cargar scouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarScouts = () => {
    let resultado = scouts;

    // Filtrar por rama
    if (ramaFiltro && ramaFiltro !== 'Todas') {
      resultado = resultado.filter(s => s.rama_actual === ramaFiltro);
    }

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(s => 
        s.nombres.toLowerCase().includes(termino) ||
        s.apellidos.toLowerCase().includes(termino) ||
        s.codigo_asociado.toLowerCase().includes(termino)
      );
    }

    setFiltrados(resultado);
  };

  const calcularEdad = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const getRamaBadgeColor = (rama: string) => {
    const colores: Record<string, string> = {
      'Manada': 'bg-yellow-100 text-yellow-800',
      'Tropa': 'bg-green-100 text-green-800',
      'Comunidad': 'bg-blue-100 text-blue-800',
      'Clan': 'bg-red-100 text-red-800'
    };
    return colores[rama] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header con Botón CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Scouts</h2>
          </div>
          <button
            onClick={() => setMostrarRegistro(true)}
            className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold shadow-lg active:scale-95 transition-transform"
          >
            <UserPlus className="w-5 h-5" />
            <span>Nuevo</span>
          </button>
        </div>
        <p className="text-blue-50">Lista de scouts activos</p>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl p-4 shadow">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>

        <select
          value={ramaFiltro}
          onChange={(e) => setRamaFiltro(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        >
          {ramas.map(r => (
            <option key={r} value={r === 'Todas' ? '' : r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Contador */}
      <div className="bg-white rounded-xl p-4 shadow">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Scouts encontrados:</span>
          <span className="text-2xl font-bold text-blue-600">{filtrados.length}</span>
        </div>
      </div>

      {/* Estado Vacío */}
      {filtrados.length === 0 && !loading && (
        <div className="bg-white rounded-xl p-8 shadow text-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-12 h-12 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {busqueda || ramaFiltro ? 'No se encontraron scouts' : 'No hay scouts registrados'}
          </h3>
          <p className="text-gray-500 mb-4 text-sm">
            {busqueda || ramaFiltro 
              ? 'Intenta cambiar los filtros de búsqueda' 
              : 'Comienza registrando el primer scout del grupo'}
          </p>
          {!busqueda && !ramaFiltro && (
            <button
              onClick={() => setMostrarRegistro(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-semibold mx-auto active:scale-95 transition-transform shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              <span>Registrar Primer Scout</span>
            </button>
          )}
        </div>
      )}

      {/* Lista de Scouts */}
      {filtrados.length > 0 && (
      <div className="space-y-3">
        {filtrados.map(scout => (
          <button
            key={scout.id}
            onClick={() => setScoutSeleccionado(scout)}
            className="w-full bg-white rounded-xl p-4 shadow active:scale-95 transition-transform text-left"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg">
                  {scout.nombres} {scout.apellidos}
                </h3>
                <p className="text-sm text-gray-500">{scout.codigo_asociado}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRamaBadgeColor(scout.rama_actual)}`}>
                {scout.rama_actual}
              </span>
            </div>

            {scout.patrulla && (
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <Award className="w-4 h-4 mr-1" />
                Patrulla {scout.patrulla}
              </div>
            )}

            {scout.fecha_nacimiento && (
              <div className="text-sm text-gray-500">
                {calcularEdad(scout.fecha_nacimiento)} años
              </div>
            )}
          </button>
        ))}
      </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando scouts...</p>
        </div>
      )}

      {/* Modal Detalle Scout */}
      {scoutSeleccionado && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setScoutSeleccionado(null)}
        >
          <div 
            className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {scoutSeleccionado.nombres} {scoutSeleccionado.apellidos}
              </h2>
              <p className="text-gray-500">{scoutSeleccionado.codigo_asociado}</p>
            </div>

            <div className="space-y-4">
              <InfoRow icon={Award} label="Rama" value={scoutSeleccionado.rama_actual} />
              
              {scoutSeleccionado.patrulla && (
                <InfoRow icon={Users} label="Patrulla" value={scoutSeleccionado.patrulla} />
              )}

              {scoutSeleccionado.fecha_nacimiento && (
                <InfoRow 
                  icon={Users} 
                  label="Edad" 
                  value={`${calcularEdad(scoutSeleccionado.fecha_nacimiento)} años`} 
                />
              )}

              {scoutSeleccionado.celular_scout && (
                <InfoRow 
                  icon={Phone} 
                  label="Teléfono" 
                  value={scoutSeleccionado.celular_scout}
                  link={`tel:${scoutSeleccionado.celular_scout}`}
                />
              )}

              {scoutSeleccionado.celular_apoderado && (
                <InfoRow 
                  icon={Phone} 
                  label="Teléfono Apoderado" 
                  value={scoutSeleccionado.celular_apoderado}
                  link={`tel:${scoutSeleccionado.celular_apoderado}`}
                />
              )}

              {scoutSeleccionado.direccion && (
                <InfoRow 
                  icon={MapPin} 
                  label="Dirección" 
                  value={scoutSeleccionado.direccion} 
                />
              )}
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => {
                  setMostrarEditar(true);
                }}
                className="flex-1 flex items-center justify-center space-x-2 bg-amber-500 text-white py-3 rounded-xl font-semibold active:scale-95 transition-transform"
              >
                <Edit3 className="w-5 h-5" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => setScoutSeleccionado(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {mostrarEditar && scoutSeleccionado && (
        <EditarScoutMobile
          scout={scoutSeleccionado}
          onClose={() => setMostrarEditar(false)}
          onSuccess={() => {
            setMostrarEditar(false);
            setScoutSeleccionado(null);
            cargarScouts();
          }}
        />
      )}

      {/* Modal de Registro Rápido */}
      {mostrarRegistro && (
        <RegistroScoutRapido
          onClose={() => setMostrarRegistro(false)}
          onSuccess={() => {
            setMostrarRegistro(false);
            cargarScouts(); // Recargar lista
          }}
        />
      )}
    </div>
  );
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  link?: string;
}

function InfoRow({ icon: Icon, label, value, link }: InfoRowProps) {
  const content = (
    <div className="flex items-start space-x-3">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
      <div className="flex-1">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-gray-800 font-medium">{value}</div>
      </div>
    </div>
  );

  if (link) {
    return (
      <a href={link} className="block p-3 bg-gray-50 rounded-lg active:bg-gray-100">
        {content}
      </a>
    );
  }

  return <div className="p-3 bg-gray-50 rounded-lg">{content}</div>;
}
