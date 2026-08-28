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
  | 'JENGA_EQUIPO';

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

// ============================================================================
// CONFIGURACIÓN DE JUEGOS
// ============================================================================

export interface TriviaPregunta {
  texto: string;
  opciones: string[]; // máximo 3
  respuestaCorrecta: number; // índice en `opciones`
  pictograma?: string;
}

export interface TriviaConfiguracion {
  preguntas: TriviaPregunta[];
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
