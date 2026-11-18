import { useParams } from 'react-router-dom';
import { Lock, SearchX } from 'lucide-react';
import FondoMarcaAgua from './components/FondoMarcaAgua';
import FormularioRegistro from './components/FormularioRegistro';
import { nuevoId, useRegistroAireLibre } from './mockStore';

/**
 * Página pública (sin login): /inscripcion/:codigo
 * Cualquier persona de cualquier grupo puede registrar su patrulla.
 */
export default function RegistroAireLibrePublico() {
  const { codigo } = useParams<{ codigo: string }>();
  const { config, agregarRegistro } = useRegistroAireLibre();

  let contenido: React.ReactNode;
  if (codigo !== config.codigo) {
    contenido = <Aviso icono={<SearchX className="w-8 h-8 text-gray-500" />} titulo="Formulario no encontrado"
      texto="Revisa que el enlace esté completo o pide uno nuevo a los dirigentes." />;
  } else if (!config.activo) {
    contenido = <Aviso icono={<Lock className="w-8 h-8 text-amber-600" />} titulo="Inscripciones cerradas"
      texto="Este formulario ya no recibe registros. Comunícate con los organizadores." />;
  } else {
    contenido = (
      <FormularioRegistro
        config={config}
        onEnviar={async (valores, archivos) => {
          // Maqueta: simula la latencia del envío real.
          await new Promise((r) => setTimeout(r, 700));
          agregarRegistro({ id: nuevoId(), creadoEn: new Date().toISOString(), valores, archivos });
        }}
      />
    );
  }

  return (
    <FondoMarcaAgua marcaAgua={config.marcaAgua}>
      <main className="px-4 py-6 sm:py-10">{contenido}</main>
      <footer className="pb-6 text-center text-xs text-gray-500">Grupo Scout Lima 12 · La Universidad del Escultismo</footer>
    </FondoMarcaAgua>
  );
}

function Aviso({ icono, titulo, texto }: { icono: React.ReactNode; titulo: string; texto: string }) {
  return (
    <div className="max-w-md mx-auto mt-16 rounded-2xl bg-white/90 backdrop-blur p-8 text-center shadow-xl">
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">{icono}</div>
      <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
      <p className="mt-2 text-gray-600">{texto}</p>
    </div>
  );
}
