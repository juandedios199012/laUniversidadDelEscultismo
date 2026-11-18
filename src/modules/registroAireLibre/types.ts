// Módulo: Formulario de Registro para PROGRAMA AL AIRE LIBRE
// Fase actual: SOLO DISEÑO DE UI. Los datos viven en mockStore.ts
// (localStorage) hasta que exista el backend en Supabase.

/** Campo de texto que el público completa en el formulario. */
export interface CampoFormulario {
  id: string;
  etiqueta: string;
  placeholder: string;
  obligatorio: boolean;
  /** Los campos base (patrulla, jefe, grupo) no se pueden eliminar, solo editar. */
  base: boolean;
}

/** Documento que el administrador publica para que el público lo descargue. */
export interface DocumentoDescarga {
  id: string;
  nombre: string;
  descripcion: string;
  /** Nombre del archivo adjunto (null = aún no se subió). */
  archivoNombre: string | null;
  /** URL de descarga. En la maqueta es un objectURL que solo dura la sesión. */
  url: string | null;
}

/** Documento que el público debe subir al registrarse. */
export interface DocumentoCarga {
  id: string;
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
  /** Extensiones aceptadas, p. ej. ['.pdf', '.jpg']. */
  formatos: string[];
  tamanoMaxMB: number;
}

export interface ConfigCabecera {
  titulo: string;
  subtitulo: string;
  /** Imagen del encabezado (banner o emblema). */
  imagenUrl: string;
  /** Texto corto opcional (fechas, lugar…). */
  detalle: string;
}

export interface ConfigMarcaAgua {
  imagenUrl: string;
  /** 0–100 */
  opacidad: number;
}

export interface ConfigFormulario {
  codigo: string;
  activo: boolean;
  cabecera: ConfigCabecera;
  marcaAgua: ConfigMarcaAgua;
  campos: CampoFormulario[];
  descargas: DocumentoDescarga[];
  cargas: DocumentoCarga[];
}

/** Metadatos del archivo subido (la maqueta no guarda el binario). */
export interface ArchivoSubido {
  documentoId: string;
  nombreArchivo: string;
  tamanoBytes: number;
}

export interface RegistroInscrito {
  id: string;
  creadoEn: string; // ISO
  valores: Record<string, string>; // campoId -> valor
  archivos: ArchivoSubido[];
}
