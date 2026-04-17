/**
 * Template para colección de DNI (scouts o familiares)
 * Genera un PDF o DOCX con los documentos de identidad
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { getTipoDocumentoLabel } from '../../../../data/constants';

// Registrar fuente Open Sans
Font.register({
  family: 'OpenSans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'OpenSans',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a5f',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  personContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  personHeader: {
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  personName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  personInfo: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  imagesContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
    justifyContent: 'center',
  },
  imageWrapper: {
    flex: 1,
    maxWidth: '48%',
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  dniImage: {
    width: '100%',
    height: 140,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    textAlign: 'center',
  },
  itemsPerPage: {
    backgroundColor: '#fef3c7',
    padding: 8,
    marginBottom: 15,
    borderRadius: 4,
  },
  alertText: {
    fontSize: 9,
    color: '#92400e',
    textAlign: 'center',
  },
});

export interface DniPersonData {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  // Para scouts
  rama?: string;
  codigoScout?: string;
  // Para familiares
  parentesco?: string;
  scoutAsociado?: string;
  // URLs de los documentos
  dniAnversoUrl?: string;
  dniReversoUrl?: string;
}

interface DniCollectionTemplateProps {
  tipo: 'scouts' | 'familiares';
  personas: DniPersonData[];
  metadata: {
    organizacion: string;
    fechaGeneracion: string;
  };
}

export const DniCollectionTemplate: React.FC<DniCollectionTemplateProps> = ({
  tipo,
  personas,
  metadata,
}) => {
  const titulo = tipo === 'scouts' 
    ? 'Documentos de Identidad - Scouts' 
    : 'Documentos de Identidad - Familiares/Apoderados';

  // Agrupar 2 personas por página para mejor visualización
  const personasPorPagina = 2;
  const totalPaginas = Math.ceil(personas.length / personasPorPagina);

  const renderPersona = (persona: DniPersonData) => (
    <View style={styles.personContainer} key={persona.id}>
      {/* Header con datos de la persona */}
      <View style={styles.personHeader}>
        <Text style={styles.personName}>
          {persona.nombres} {persona.apellidos}
        </Text>
        <Text style={styles.personInfo}>
          {getTipoDocumentoLabel(persona.tipoDocumento) || 'DNI'}: {persona.numeroDocumento || 'Sin documento'}
          {tipo === 'familiares' && persona.parentesco && ` • ${persona.parentesco}`}
          {tipo === 'familiares' && persona.scoutAsociado && ` • Scout: ${persona.scoutAsociado}`}
        </Text>
      </View>
      
      {/* Imágenes del DNI */}
      <View style={styles.imagesContainer}>
        {/* Anverso */}
        <View style={styles.imageWrapper}>
          <Text style={styles.imageLabel}>Anverso (Cara Frontal)</Text>
          {persona.dniAnversoUrl ? (
            <Image src={persona.dniAnversoUrl} style={styles.dniImage} />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>Sin imagen</Text>
            </View>
          )}
        </View>
        
        {/* Reverso */}
        <View style={styles.imageWrapper}>
          <Text style={styles.imageLabel}>Reverso (Cara Posterior)</Text>
          {persona.dniReversoUrl ? (
            <Image src={persona.dniReversoUrl} style={styles.dniImage} />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>Sin imagen</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <Document>
      {Array.from({ length: totalPaginas }).map((_, pageIndex) => {
        const startIdx = pageIndex * personasPorPagina;
        const personasEnPagina = personas.slice(startIdx, startIdx + personasPorPagina);
        
        return (
          <Page size="A4" style={styles.page} key={pageIndex}>
            {/* Header solo en primera página */}
            {pageIndex === 0 && (
              <>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>{titulo}</Text>
                  <Text style={styles.headerSubtitle}>
                    {metadata.organizacion} • {metadata.fechaGeneracion}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    Total: {personas.length} {tipo === 'scouts' ? 'scouts' : 'familiares'}
                  </Text>
                </View>
              </>
            )}

            {/* Personas en esta página */}
            {personasEnPagina.map(renderPersona)}

            {/* Footer */}
            <View style={styles.footer} fixed>
              <Text>{metadata.organizacion}</Text>
              <Text style={styles.pageNumber}>
                Página {pageIndex + 1} de {totalPaginas}
              </Text>
              <Text>{metadata.fechaGeneracion}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default DniCollectionTemplate;
