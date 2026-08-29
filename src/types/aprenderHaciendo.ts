/**
 * Tipos para el módulo "Aprender Haciendo" (Fase 1)
 * Módulo gamificado de entrenamiento de habilidades scout (nudos,
 * cocina, campismo, historia, primeros auxilios, morse, semáforo,
 * señales de pista) con contenido paso a paso + mini-juegos ("retos").
 *
 * Las RPCs devuelven las filas de las tablas `ah_*` tal cual (columnas
 * en snake_case), por eso estas interfaces usan snake_case — mismo
 * criterio que `src/types/colaborador.ts` con las columnas heredadas
 * de `personas`/`colaboradores`.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type AhCategoria =
  | 'NUDOS'
  | 'COCINA'
  | 'CAMPISMO'
  | 'HISTORIA'
  | 'PRIMEROS_AUXILIOS'
  | 'MORSE'
  | 'SEMAFORO'
  | 'SENALES_PISTA'
  | 'OTRO';

export type AhNivel = 'INICIAL' | 'INTERMEDIO' | 'AVANZADO';

export type AhTipoJuego =
  | 'TRIVIA'
  | 'ARRASTRAR_SOLTAR'
  | 'SECUENCIA'
  | 'MORSE'
  | 'MEMORIA'
  | 'JENGA_EQUIPO'
  | 'ROMPECABEZAS';

export type AhTipoMedia = 'NINGUNO' | 'IMAGEN' | 'VIDEO';

export type AhRama = 'MANADA' | 'TROPA' | 'COMUNIDAD' | 'CLAN' | 'GRUPO' | string;

// ============================================================================
// INTERFACES PRINCIPALES (columnas tal cual las devuelve Postgres)
// ============================================================================

export interface AhModulo {
  id: string;
  titulo: string;
  slug: string;
  categoria: AhCategoria;
  descripcion?: string | null;
  nivel_dificultad: AhNivel;
  rama_objetivo?: AhRama | null;
  portada_url?: string | null;
  color_gradiente_inicio: string;
  color_gradiente_fin: string;
  icono: string;
  orden: number;
  activo: boolean;
  creado_por?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AhPaso {
  id: string;
  modulo_id: string;
  numero_paso: number;
  titulo: string;
  instruccion_texto: string;
  pictograma_url?: string | null;
  tipo_media: AhTipoMedia;
  media_url?: string | null;
  materiales_requeridos: string[];
  /** Efecto de sonido real opcional (relincho, cañón, morse, etc.), se
   * reproduce al mostrarse el paso — complementa la lectura por voz. */
  efecto_sonido_url?: string | null;
  created_at: string;
}

export interface AhReto {
  id: string;
  modulo_id?: string | null;
  tipo_juego: AhTipoJuego;
  titulo: string;
  configuracion: Record<string, unknown>;
  puntos_base: number;
  tiempo_limite_segundos?: number | null;
  activo: boolean;
  orden: number;
  created_at: string;
}

export interface AhIntento {
  id: string;
  reto_id: string;
  scout_id?: string | null;
  patrulla_id?: string | null;
  puntaje_obtenido: number;
  tiempo_segundos?: number | null;
  registrado_por?: string | null;
  completado_en: string;
}

export interface AhProgresoScout {
  id: string;
  scout_id: string;
  modulo_id: string;
  paso_actual: number;
  completado_en?: string | null;
  updated_at: string;
}

export interface AhModuloDetalle {
  modulo: AhModulo;
  pasos: AhPaso[];
  retos: AhReto[];
}

export interface AhRankingPatrulla {
  patrulla_id: string;
  nombre: string;
  animal_totem?: string | null;
  color_patrulla?: string | null;
  rama: string;
  total_puntos: number;
}

export interface AhRankingScout {
  scout_id: string;
  nombres: string;
  apellidos: string;
  rama: string;
  patrulla_nombre?: string | null;
  total_puntos: number;
  retos_completados: number;
}

// ============================================================================
// CONFIGURACIÓN DE JUEGOS
// ============================================================================

// SeleccionableConfiguracion — juegos de "elegir 1 de hasta 3 opciones":
// absorbe la antigua TriviaConfiguracion (modoVisual 'lista') y la antigua
// JengaConfiguracion (modoVisual 'torre'). Ver TriviaStrategy.tsx.
export interface SeleccionablePregunta {
  id?: string; // sólo relevante en modoVisual 'torre' (Jenga), para identificar cada bloque removible
  texto: string;
  opciones: string[]; // máximo 3
  respuestaCorrecta: number; // índice en `opciones`
  pictograma?: string;
  color?: string; // clase de gradiente Tailwind, sólo se usa en modoVisual 'torre'
}

export interface SeleccionableConfiguracion {
  preguntas: SeleccionablePregunta[];
  modoVisual?: 'lista' | 'torre'; // default: 'lista' para TRIVIA, 'torre' para JENGA_EQUIPO cuando se omite
}

// DragAndDropConfiguracion — juegos de arrastrar con @dnd-kit: absorbe la
// antigua ArrastrarSoltarConfiguracion (modo 'emparejar') y la antigua
// SecuenciaConfiguracion (modo 'ordenar'). Ver DragAndDropStrategy.tsx.
//
// ROMPECABEZAS ("rompecabezas de partes con significado") reutiliza el
// mismo modo 'emparejar' — no es un modo nuevo — sólo agrega
// `imagenBaseUrl` + un `posicion` por par: cuando ambos están presentes,
// DragAndDropStrategy.tsx renderiza las zonas de destino ubicadas
// espacialmente sobre la imagen base en vez de en la lista genérica. Si
// están ausentes (todo reto ARRASTRAR_SOLTAR ya existente), el render no
// cambia — 100% retrocompatible.
export interface DragAndDropConfiguracion {
  modo: 'emparejar' | 'ordenar';
  instruccion: string;
  pares?: { id: string; pictograma: string; etiqueta: string; posicion?: { x: number; y: number } }[]; // se usa cuando modo === 'emparejar'
  pasos?: { id: string; texto: string; pictograma?: string }[]; // se usa cuando modo === 'ordenar' (el orden correcto = orden del array)
  imagenBaseUrl?: string; // sólo relevante cuando modo === 'emparejar' y cada par tiene `posicion`; activa el layout espacial de rompecabezas en vez de la lista genérica
}

// ParserConfiguracion — decodificar un código a su significado: hoy sólo
// Morse; la unión de `codificacion` queda abierta para un futuro
// 'semaforo' | 'pistas' sin agregar un componente Strategy nuevo. Ver
// ParserStrategy.tsx.
export interface ParserReto {
  id: string;
  codigo: string; // para 'morse': string de '.'/'-' separados por espacios
  respuestaCorrecta: string;
  opciones: string[]; // exactamente 3, incluye la respuesta correcta
  pista?: string;
}

export interface ParserConfiguracion {
  codificacion: 'morse'; // unión abierta a futuro 'semaforo' | 'pistas' — no implementados todavía
  retos: ParserReto[];
}

export interface MemoriaPar {
  id: string;
  pictograma: string;
  etiqueta?: string;
}

export interface MemoriaConfiguracion {
  pares: MemoriaPar[];
}

// ============================================================================
// PROPS COMPARTIDAS POR TODOS LOS JUEGOS (Strategy pattern — punto de
// extensión: un nuevo tipo de juego = un componente nuevo + una entrada
// nueva en el registro GAME_COMPONENTS de RetoRunner.tsx)
// ============================================================================

export interface GameProps {
  configuracion: any;
  puntosBase: number;
  onComplete: (puntaje: number, tiempoSegundos: number) => void;
  /** Tipo de juego (`ah_reto.tipo_juego`) que este componente está actualmente
   * renderizando — necesario porque una Strategy puede implementar más de un
   * valor del enum (ej. TriviaStrategy cubre TRIVIA y JENGA_EQUIPO) y necesita
   * saber cuál para elegir un `modoVisual`/`modo` por defecto sensato cuando
   * el JSON de configuración no lo especifica explícitamente. */
  tipoJuego: AhTipoJuego;
}

// ============================================================================
// FORMULARIOS (para las pantallas de administración de contenido)
// ============================================================================

export interface FormularioModulo {
  id?: string;
  titulo: string;
  slug: string;
  categoria: AhCategoria;
  descripcion?: string;
  nivel_dificultad: AhNivel;
  rama_objetivo?: string;
  portada_url?: string;
  color_gradiente_inicio?: string;
  color_gradiente_fin?: string;
  icono?: string;
  orden?: number;
}

export interface FormularioPaso {
  id?: string;
  modulo_id: string;
  numero_paso: number;
  titulo: string;
  instruccion_texto: string;
  pictograma_url?: string;
  tipo_media?: AhTipoMedia;
  media_url?: string;
  materiales_requeridos?: string[];
  efecto_sonido_url?: string;
}

export interface FormularioReto {
  id?: string;
  modulo_id?: string;
  tipo_juego: AhTipoJuego;
  titulo: string;
  configuracion: Record<string, unknown>;
  puntos_base?: number;
  tiempo_limite_segundos?: number;
  orden?: number;
}
