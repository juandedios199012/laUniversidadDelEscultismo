export const EDADES_POR_RAMA = {
  'Manada': { min: 7, max: 10 },
  'Tropa': { min: 11, max: 14 },
  'Caminantes': { min: 15, max: 17 },
  'Clan': { min: 18, max: 21 },
  'Dirigentes': { min: 22, max: 65 }
};

export const CARGOS_POR_RAMA = {
  'Manada': ['Seisenero', 'Seisenera', 'Lobato', 'Lobata'],
  'Tropa': ['Guía', 'Subguía', 'Primer Scout', 'Segundo Scout'],
  'Caminantes': ['Coordinador', 'Secretario', 'Tesorero', 'Caminante'],
  'Clan': ['Primer Rover', 'Segundo Rover'],
  'Dirigentes': ['Jefe de Grupo', 'Jefe de Rama', 'Subjefe', 'Dirigente']
};

export const AREAS_CRECIMIENTO = [
  'Afectividad', 'Corporalidad', 'Espiritualidad', 
  'Carácter', 'Creatividad', 'Sociabilidad'
];

export const PARENTESCOS = [
  'Papa', 'Mama', 'Hermano', 'Hermana', 'Primo', 'Prima',
  'Tío', 'Tía', 'Hijo', 'Hija', 'Abuelo', 'Abuela'
];

/**
 * Tipos de documento de identidad.
 * ⚠️ IMPORTANTE: Estos valores deben coincidir con el enum `tipo_documento_enum` en la BD.
 * Valores válidos: 'DNI', 'CARNET_EXTRANJERIA', 'PASAPORTE'
 */
export const TIPOS_DOCUMENTO = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CARNET_EXTRANJERIA', label: 'Carné de Extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
] as const;

export type TipoDocumentoValue = typeof TIPOS_DOCUMENTO[number]['value'];

/**
 * Obtiene el label amigable de un tipo de documento.
 * Útil para mostrar en PDFs, reportes y UI.
 * @param value - El valor del enum (ej: 'CARNET_EXTRANJERIA')
 * @returns El label amigable (ej: 'Carné de Extranjería') o el valor original si no se encuentra
 */
export function getTipoDocumentoLabel(value: string | null | undefined): string {
  if (!value) return '';
  const tipo = TIPOS_DOCUMENTO.find(t => t.value === value);
  return tipo?.label ?? value;
}