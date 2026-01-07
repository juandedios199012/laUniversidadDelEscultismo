/**
 * Plantilla PDF para Formato de Registro Institucional DNGI-03
 * Documento oficial de 4 páginas para registro de miembros juveniles
 * Usa imágenes PNG como base con datos dinámicos posicionados encima
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { ScoutReportData, ReportMetadata } from '../../types/reportTypes';

// Estilos para posicionamiento absoluto sobre las imágenes
const styles = StyleSheet.create({
  page: {
    position: 'relative',
  },
  
  // Imagen de fondo
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  
  // Contenedor para campos dinámicos
  content: {
    position: 'relative',
    padding: 0,
  },
  
  // Campos dinámicos - PÁGINA 1
  // Ajusta estas coordenadas según las posiciones exactas en tu imagen
  
  // Fila: Apellidos y Nombres
  apellidosCompletos: {
    position: 'absolute',
    top: 310,
    left: 60,
    width: 260,
    fontSize: 10,
  },
  
  nombresCompletos: {
    position: 'absolute',
    top: 310,
    left: 330,
    width: 240,
    fontSize: 10,
  },
  
  // Fila: Sexo, Fecha Nac, Tipo Doc, Número Doc
  sexo: {
    position: 'absolute',
    top: 355,
    left: 60,
    width: 70,
    fontSize: 10,
  },
  
  fechaNacimiento: {
    position: 'absolute',
    top: 355,
    left: 140,
    width: 120,
    fontSize: 10,
  },
  
  tipoDocumento: {
    position: 'absolute',
    top: 355,
    left: 270,
    width: 140,
    fontSize: 10,
  },
  
  numeroDocumento: {
    position: 'absolute',
    top: 355,
    left: 420,
    width: 140,
    fontSize: 10,
  },
  
  // Dirección
  direccion: {
    position: 'absolute',
    top: 485,
    left: 60,
    width: 400,
    fontSize: 10,
  },
  
  // Correo personal
  correoPersonal: {
    position: 'absolute',
    top: 555,
    left: 310,
    width: 250,
    fontSize: 10,
  },
  
  // Celular
  celular: {
    position: 'absolute',
    top: 595,
    left: 60,
    width: 150,
    fontSize: 10,
  },
  
  // Observaciones/Discapacidad
  observaciones: {
    position: 'absolute',
    top: 740,
    left: 60,
    width: 500,
    fontSize: 9,
  },
  
  // PÁGINA 2 - Datos de Padres
  padre1Apellidos: {
    position: 'absolute',
    top: 165,
    left: 60,
    width: 260,
    fontSize: 10,
  },
  
  padre1Nombres: {
    position: 'absolute',
    top: 165,
    left: 330,
    width: 240,
    fontSize: 10,
  },
  
  madre2Apellidos: {
    position: 'absolute',
    top: 485,
    left: 60,
    width: 260,
    fontSize: 10,
  },
  
  madre2Nombres: {
    position: 'absolute',
    top: 485,
    left: 330,
    width: 240,
    fontSize: 10,
  },
  
  // PÁGINA 4 - Firma
  tipoRegistro: {
    position: 'absolute',
    top: 240,
    left: 220,
    width: 350,
    fontSize: 10,
  },
  
  fechaRegistro: {
    position: 'absolute',
    top: 450,
    left: 140,
    width: 200,
    fontSize: 10,
  },
  
});

interface DNGI03TemplateProps {
  scout: ScoutReportData;
  metadata: ReportMetadata;
  additionalData?: {
    padre?: any;
    madre?: any;
    tipoRegistro?: string;
    fechaRegistro?: string;
  };
}

export const DNGI03Template: React.FC<DNGI03TemplateProps> = ({
  scout,
  metadata,
  additionalData = {},
}) => {
  
  // Helper para formatear fecha
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleDateString('es-PE');
    } catch {
      return typeof date === 'string' ? date : '';
    }
  };

  return (
    <Document>
      {/* PÁGINA 1: Datos del Miembro Juvenil */}
      <Page size="A4" style={styles.page}>
        {/* Imagen de fondo */}
        <Image 
          src={`${window.location.origin}/templates/dngi03/page1.png`}
          style={styles.backgroundImage}
        />
        
        {/* Contenido dinámico */}
        <View style={styles.content}>
          {/* Apellidos Completos */}
          <Text style={styles.apellidosCompletos}>
            {scout.apellido || ''}
          </Text>
          
          {/* Nombres Completos */}
          <Text style={styles.nombresCompletos}>
            {scout.nombre || ''}
          </Text>
          
          {/* Fecha de Nacimiento */}
          <Text style={styles.fechaNacimiento}>
            {formatDate(scout.fechaNacimiento)}
          </Text>
          
          {/* Número de Documento */}
          <Text style={styles.numeroDocumento}>
            {scout.numeroRegistro || ''}
          </Text>
          
          {/* Dirección */}
          <Text style={styles.direccion}>
            {scout.direccion || ''}
          </Text>
          
          {/* Correo Electrónico Personal */}
          <Text style={styles.correoPersonal}>
            {scout.email || ''}
          </Text>
          
          {/* Celular */}
          <Text style={styles.celular}>
            {scout.telefono || ''}
          </Text>
          
          {/* Observaciones (Discapacidad) */}
          <Text style={styles.observaciones}>
            {scout.observaciones || ''}
          </Text>
        </View>
      </Page>

      {/* PÁGINA 2: Datos de los Padres de Familia */}
      <Page size="A4" style={styles.page}>
        {/* Imagen de fondo */}
        <Image 
          src={`${window.location.origin}/templates/dngi03/page2.png`}
          style={styles.backgroundImage}
        />
        
        {/* Contenido dinámico */}
        <View style={styles.content}>
          {/* Padre 1 - Apellidos */}
          <Text style={styles.padre1Apellidos}>
            {scout.nombrePadre ? scout.nombrePadre.split(' ').slice(1).join(' ') : ''}
          </Text>
          
          {/* Padre 1 - Nombres */}
          <Text style={styles.padre1Nombres}>
            {scout.nombrePadre ? scout.nombrePadre.split(' ')[0] : ''}
          </Text>
          
          {/* Madre 2 - Apellidos */}
          <Text style={styles.madre2Apellidos}>
            {scout.nombreMadre ? scout.nombreMadre.split(' ').slice(1).join(' ') : ''}
          </Text>
          
          {/* Madre 2 - Nombres */}
          <Text style={styles.madre2Nombres}>
            {scout.nombreMadre ? scout.nombreMadre.split(' ')[0] : ''}
          </Text>
        </View>
      </Page>

      {/* PÁGINA 3: Declaraciones y compromisos (solo imagen estática) */}
      <Page size="A4" style={styles.page}>
        <Image 
          src={`${window.location.origin}/templates/dngi03/page3.png`}
          style={styles.backgroundImage}
        />
      </Page>

      {/* PÁGINA 4: Firma y huella digital */}
      <Page size="A4" style={styles.page}>
        {/* Imagen de fondo */}
        <Image 
          src={`${window.location.origin}/templates/dngi03/page4.png`}
          style={styles.backgroundImage}
        />
        
        {/* Contenido dinámico */}
        <View style={styles.content}>
          {/* Tipo de Registro */}
          <Text style={styles.tipoRegistro}>
            {additionalData.tipoRegistro || ''}
          </Text>
          
          {/* Fecha */}
          <Text style={styles.fechaRegistro}>
            {additionalData.fechaRegistro || formatDate(metadata.generatedAt)}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default DNGI03Template;
