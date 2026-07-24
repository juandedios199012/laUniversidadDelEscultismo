/**
 * Listas fijas de condiciones/alergias/vacunas del formulario de Historia
 * Médica (ANEXO 08) y el matcher usado para saber si el scout las declaró.
 * Fuente única compartida entre el PDF y el Word para que ambos formatos
 * siempre marquen las mismas casillas y no se desincronicen entre sí.
 */

export interface FilaFija {
  fila: string;
  nombres: string[];
}

/**
 * Quita tildes/diacríticos y pasa a minúsculas. Así el matching no depende
 * de si el texto guardado en la UI está tildeado ("psicológico") o no
 * ("psicolog") — antes cada lista tenía que declarar ambas variantes a mano
 * y era fácil olvidar alguna (como pasó con "psicológico o psiquiátrico").
 */
export function normalizarTexto(texto?: string | null): string {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** true si `texto` contiene alguna de las palabras clave, sin importar tildes ni mayúsculas. */
export function coincideConAlguno(texto: string | undefined | null, nombres: string[]): boolean {
  const normalizado = normalizarTexto(texto);
  if (!normalizado) return false;
  return nombres.some((n) => normalizado.includes(normalizarTexto(n)));
}

export const CONDICIONES_FIJAS: FilaFija[] = [
  { fila: 'Diabetes Mellitus', nombres: ['diabetes'] },
  { fila: 'Hipertension Arterial', nombres: ['hipertension'] },
  { fila: 'Asma', nombres: ['asma'] },
  { fila: 'Convulsiones', nombres: ['convulsion', 'epilepsia'] },
  { fila: 'Lesion traumatica', nombres: ['lesion', 'traumatic', 'trauma'] },
  { fila: 'Tratamiento psicologico o psiquiatrico', nombres: ['psicolog', 'psiquiat'] },
  { fila: 'Cirugias y hospitalizaciones', nombres: ['cirug', 'hospital'] },
];

export const ALERGIAS_FIJAS: FilaFija[] = [
  { fila: 'Medicamentos', nombres: ['medicamentos', 'medicamento', 'penicilina', 'aspirina', 'ibuprofeno', 'sulfas', 'anestesico', 'otros medicamentos'] },
  { fila: 'Alimentos', nombres: ['alimentos', 'alimento', 'mani', 'mariscos', 'pescado', 'huevo', 'leche', 'lacteos', 'gluten', 'trigo', 'soya', 'frutos secos', 'otros alimentos'] },
  { fila: 'Plantas', nombres: ['plantas', 'planta', 'polen', 'acaros', 'moho', 'pelo de animales', 'ambiental'] },
  { fila: 'Picaduras / mordeduras de insectos', nombres: ['picaduras', 'insectos', 'mordeduras', 'insecto', 'picadura'] },
  { fila: 'Sustancias u otros', nombres: ['sustancias', 'otros', 'otra', 'latex', 'niquel', 'cosmeticos', 'contacto'] },
];

export const VACUNAS_FIJAS: FilaFija[] = [
  { fila: 'Antiamarilica (fiebre amarilla)', nombres: ['amaril', 'fiebre'] },
  { fila: 'Hepatitis B', nombres: ['hepatitis'] },
  { fila: 'Influenza', nombres: ['influenza', 'gripe'] },
  { fila: 'COVID - 19', nombres: ['covid'] },
  { fila: 'Neumococo', nombres: ['neumococo', 'neumonia'] },
];
