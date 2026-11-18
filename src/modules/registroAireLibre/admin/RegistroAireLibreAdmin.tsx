import { useState } from 'react';
import { toast } from 'sonner';
import { ClipboardList, Copy, ExternalLink, Settings, Tent } from 'lucide-react';
import { useRegistroAireLibre } from '../mockStore';
import ListaInscritos from './ListaInscritos';
import ConfiguracionFormulario from './ConfiguracionFormulario';

type Pestana = 'inscritos' | 'configuracion';

/** Perfil Administrador: configura el formulario y gestiona los registros. */
export default function RegistroAireLibreAdmin() {
  const { config, registros, guardarConfig, restablecerConfig, actualizarRegistro, eliminarRegistro } = useRegistroAireLibre();
  const [pestana, setPestana] = useState<Pestana>('inscritos');
  const enlace = `${window.location.origin}/inscripcion/${config.codigo}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-green-600 to-teal-600 text-white shadow-lg">
            <Tent className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registro · Programa al Aire Libre</h1>
            <p className="text-sm text-gray-500">Formulario público para inscribir patrullas de cualquier grupo</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => guardarConfig({ ...config, activo: !config.activo })}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${config.activo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
            title="Abrir o cerrar inscripciones"
          >
            <span className={`h-2 w-2 rounded-full ${config.activo ? 'bg-green-500' : 'bg-gray-400'}`} />
            {config.activo ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}
          </button>
          <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white text-sm">
            <span className="max-w-[16rem] truncate px-3 py-2 text-gray-500">{enlace}</span>
            <button onClick={copiar} className="border-l border-gray-300 px-3 py-2 text-gray-600 hover:bg-gray-50" title="Copiar enlace"><Copy className="w-4 h-4" /></button>
            <a href={enlace} target="_blank" rel="noreferrer" className="border-l border-gray-300 px-3 py-2 text-gray-600 hover:bg-gray-50" title="Abrir formulario"><ExternalLink className="w-4 h-4" /></a>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <TabBoton activo={pestana === 'inscritos'} onClick={() => setPestana('inscritos')} icono={<ClipboardList className="w-4 h-4" />}>
          Inscritos <span className="ml-1 rounded-full bg-gray-100 px-2 text-xs text-gray-600">{registros.length}</span>
        </TabBoton>
        <TabBoton activo={pestana === 'configuracion'} onClick={() => setPestana('configuracion')} icono={<Settings className="w-4 h-4" />}>
          Configuración
        </TabBoton>
      </div>

      {pestana === 'inscritos' ? (
        <ListaInscritos config={config} registros={registros} onActualizar={actualizarRegistro} onEliminar={eliminarRegistro} />
      ) : (
        <ConfiguracionFormulario config={config} onGuardar={guardarConfig} onRestablecer={restablecerConfig} />
      )}
    </div>
  );
}

function TabBoton({ activo, onClick, icono, children }: { activo: boolean; onClick: () => void; icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${activo ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
      {icono}{children}
    </button>
  );
}
