// Almacén de maqueta (solo UI). Persiste en localStorage para que lo que
// configura el administrador se vea en el formulario público durante la demo.
// Reemplazar por un servicio de Supabase cuando se implemente el backend.
import { useCallback, useEffect, useState } from 'react';
import type { ConfigFormulario, DocumentoCarga, RegistroInscrito } from './types';

const CLAVE_CONFIG = 'registro_aire_libre_config_v1';
const CLAVE_REGISTROS = 'registro_aire_libre_registros_v1';
const EVENTO = 'registro-aire-libre:cambio';

export const CODIGO_DEMO = 'aire-libre-2026';

export const nuevoId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const CONFIG_POR_DEFECTO: ConfigFormulario = {
  codigo: CODIGO_DEMO,
  activo: true,
  cabecera: {
    titulo: 'Programa al Aire Libre',
    subtitulo: 'Formulario de registro de patrullas',
    imagenUrl: '/images/cabecera-banner-scouts-peru.png',
    detalle: 'Completa los datos de tu patrulla y adjunta los documentos solicitados.',
  },
  marcaAgua: {
    // Imagen provisional: reemplazar por la foto oficial desde Configuración.
    imagenUrl: '/images/fondo-anual.jpg',
    opacidad: 12,
  },
  campos: [
    { id: 'nombre_patrulla', etiqueta: 'Nombre de Patrulla', placeholder: 'Ej. Patrulla Cóndores', obligatorio: true, base: true },
    { id: 'jefe_patrulla', etiqueta: 'Nombre de Jefe de Patrulla', placeholder: 'Nombres y apellidos', obligatorio: true, base: true },
    { id: 'grupo_scout', etiqueta: 'Grupo Scout', placeholder: 'Ej. Grupo Scout Lima 12', obligatorio: true, base: true },
  ],
  descargas: [
    { id: 'd1', nombre: 'Bases del programa', descripcion: 'Reglamento, horarios y lista de equipo.', archivoNombre: null, url: null },
    { id: 'd2', nombre: 'Autorización de padres', descripcion: 'Imprimir, firmar y volver a subir.', archivoNombre: null, url: null },
    { id: 'd3', nombre: 'Ficha médica', descripcion: 'Una por cada integrante de la patrulla.', archivoNombre: null, url: null },
  ],
  cargas: [
    { id: 'c1', nombre: 'Autorización de padres firmada', descripcion: 'Escaneada o foto legible.', obligatorio: true, formatos: ['.pdf', '.jpg', '.png'], tamanoMaxMB: 5 },
    { id: 'c2', nombre: 'Fichas médicas', descripcion: 'Un solo PDF con todas las fichas.', obligatorio: true, formatos: ['.pdf'], tamanoMaxMB: 10 },
    { id: 'c3', nombre: 'Comprobante de pago', descripcion: 'Voucher de depósito o captura de transferencia.', obligatorio: true, formatos: ['.pdf', '.jpg', '.png'], tamanoMaxMB: 5 },
  ],
};

const REGISTROS_DEMO: RegistroInscrito[] = [
  {
    id: 'r1', creadoEn: '2026-11-10T15:20:00.000Z',
    valores: { nombre_patrulla: 'Cóndores', jefe_patrulla: 'Mateo Quispe', grupo_scout: 'Lima 12' },
    archivos: [
      { documentoId: 'c1', nombreArchivo: 'autorizacion.pdf', tamanoBytes: 820_000 },
      { documentoId: 'c2', nombreArchivo: 'fichas.pdf', tamanoBytes: 2_400_000 },
      { documentoId: 'c3', nombreArchivo: 'voucher.jpg', tamanoBytes: 410_000 },
    ],
  },
  {
    id: 'r2', creadoEn: '2026-11-12T19:05:00.000Z',
    valores: { nombre_patrulla: 'Pumas', jefe_patrulla: 'Valeria Huamán', grupo_scout: 'Lima 25' },
    archivos: [{ documentoId: 'c1', nombreArchivo: 'autorizacion-pumas.pdf', tamanoBytes: 640_000 }],
  },
  {
    id: 'r3', creadoEn: '2026-11-15T13:42:00.000Z',
    valores: { nombre_patrulla: 'Halcones', jefe_patrulla: 'Diego Rojas', grupo_scout: 'Callao 3' },
    archivos: [],
  },
];

function leer<T>(clave: string, porDefecto: T): T {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function escribir(clave: string, valor: unknown): boolean {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    window.dispatchEvent(new Event(EVENTO));
    return true;
  } catch {
    // Cuota excedida (imagen muy grande) o almacenamiento bloqueado.
    return false;
  }
}

/** Hook de maqueta: misma forma que tendrá el hook real con Supabase. */
export function useRegistroAireLibre() {
  const [config, setConfig] = useState<ConfigFormulario>(() => leer(CLAVE_CONFIG, CONFIG_POR_DEFECTO));
  const [registros, setRegistros] = useState<RegistroInscrito[]>(() => leer(CLAVE_REGISTROS, REGISTROS_DEMO));

  useEffect(() => {
    const recargar = () => {
      setConfig(leer(CLAVE_CONFIG, CONFIG_POR_DEFECTO));
      setRegistros(leer(CLAVE_REGISTROS, REGISTROS_DEMO));
    };
    window.addEventListener(EVENTO, recargar);
    window.addEventListener('storage', recargar); // otra pestaña
    return () => {
      window.removeEventListener(EVENTO, recargar);
      window.removeEventListener('storage', recargar);
    };
  }, []);

  const guardarConfig = useCallback((nueva: ConfigFormulario) => {
    setConfig(nueva);
    return escribir(CLAVE_CONFIG, nueva);
  }, []);

  const restablecerConfig = useCallback(() => {
    setConfig(CONFIG_POR_DEFECTO);
    escribir(CLAVE_CONFIG, CONFIG_POR_DEFECTO);
  }, []);

  const guardarRegistros = useCallback((lista: RegistroInscrito[]) => {
    setRegistros(lista);
    return escribir(CLAVE_REGISTROS, lista);
  }, []);

  const agregarRegistro = useCallback((r: RegistroInscrito) => {
    const lista = [r, ...leer(CLAVE_REGISTROS, REGISTROS_DEMO)];
    return guardarRegistros(lista);
  }, [guardarRegistros]);

  const actualizarRegistro = useCallback((r: RegistroInscrito) => {
    return guardarRegistros(registros.map((x) => (x.id === r.id ? r : x)));
  }, [registros, guardarRegistros]);

  const eliminarRegistro = useCallback((id: string) => {
    return guardarRegistros(registros.filter((x) => x.id !== id));
  }, [registros, guardarRegistros]);

  return { config, registros, guardarConfig, restablecerConfig, agregarRegistro, actualizarRegistro, eliminarRegistro };
}

/** Estado de carga de archivos de un registro respecto a lo que exige la config. */
export function estadoArchivos(registro: RegistroInscrito, cargas: DocumentoCarga[]) {
  const obligatorios = cargas.filter((c) => c.obligatorio);
  const subidos = new Set(registro.archivos.map((a) => a.documentoId));
  const completos = obligatorios.filter((c) => subidos.has(c.id)).length;
  return {
    completos,
    total: obligatorios.length,
    completo: completos === obligatorios.length,
    subidosTotal: cargas.filter((c) => subidos.has(c.id)).length,
  };
}

export const formatearTamano = (bytes: number) =>
  bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`;
