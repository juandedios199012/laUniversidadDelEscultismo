// ================================================================
// 🔄 Utilidades para Plantillas Word - Método Profesional
// ================================================================

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

export interface ScoutTemplateData {
  apellidos: string;
  nombres: string;
  sexo?: string;
  fecha_nacimiento?: string;
  tipo_documento?: string;
  numero_documento?: string;
  region: string;
  localidad: string;
  numeral: string;
  unidad: string;
  direccion?: string;
  codigo_postal?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  correo_institucional?: string;
  correo_personal?: string;
  celular?: string;
  telefono?: string;
  religion?: string;
  centro_estudios?: string;
  ano_estudios?: string;
  grupo_sanguineo?: string;
  factor_sanguineo?: string;
  seguro_medico?: string;
  tipo_discapacidad?: string;
  carne_conadis?: string;
  especificar_discapacidad?: string;
  fecha_actual: string;
  nombre_apoderado?: string;
  dni_apoderado?: string;
}

export class WordTemplateUtils {
  
  /**
   * Genera documento DNGI-03 usando plantilla Word
   */
  static async generateFromTemplate(scoutData: ScoutTemplateData): Promise<Blob> {
    try {
      // Por ahora, creamos el template programáticamente
      // En producción, cargarías el archivo .docx real
      const templateBuffer = await this.createDNGI03Template();
      
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Renderizar con datos del scout
      doc.render(scoutData);
      
      const buffer = doc.getZip().generate({
        type: 'arraybuffer',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
    } catch (error) {
      console.error('Error generando documento desde plantilla:', error);
      throw new Error('No se pudo generar el documento desde la plantilla');
    }
  }

  /**
   * Descarga documento generado desde plantilla
   */
  static async downloadFromTemplate(scoutData: ScoutTemplateData, filename: string): Promise<void> {
    try {
      const blob = await this.generateFromTemplate(scoutData);
      saveAs(blob, filename);
    } catch (error) {
      console.error('Error descargando documento:', error);
      throw error;
    }
  }

  /**
   * Crea una plantilla básica DNGI-03 (placeholder hasta tener archivo real)
   */
  private static async createDNGI03Template(): Promise<ArrayBuffer> {
    // Este método sería reemplazado por la carga del archivo .docx real
    // Por ahora retornamos un buffer vacío que será manejado por el fallback
    throw new Error('Template file not implemented yet');
  }

  /**
   * Convierte datos del scout al formato de plantilla
   */
  static convertScoutToTemplateData(scout: any): ScoutTemplateData {
    return {
      apellidos: scout.apellidos || '',
      nombres: scout.nombres || '',
      sexo: scout.sexo || '',
      fecha_nacimiento: scout.fecha_nacimiento || '',
      tipo_documento: scout.tipo_documento || '',
      numero_documento: scout.numero_documento || '',
      region: 'XVIII',
      localidad: 'LIMA',
      numeral: '12',
      unidad: 'TROPA',
      direccion: scout.direccion || '',
      codigo_postal: scout.codigo_postal || '',
      departamento: scout.departamento || '',
      provincia: scout.provincia || '',
      distrito: scout.distrito || '',
      correo_institucional: scout.correo_institucional || '',
      correo_personal: scout.correo || '',
      celular: scout.celular || '',
      telefono: scout.telefono || '',
      religion: scout.religion || '',
      centro_estudios: scout.centro_estudio || '',
      ano_estudios: scout.ano_estudios || '',
      grupo_sanguineo: scout.grupo_sanguineo || '',
      factor_sanguineo: scout.factor_sanguineo || '',
      seguro_medico: scout.seguro_medico || '',
      tipo_discapacidad: scout.tipo_discapacidad || '',
      carne_conadis: scout.carne_conadis || '',
      especificar_discapacidad: scout.especificar_discapacidad || '',
      fecha_actual: new Date().toLocaleDateString('es-PE'),
      nombre_apoderado: '',
      dni_apoderado: '',
    };
  }
}

export default WordTemplateUtils;