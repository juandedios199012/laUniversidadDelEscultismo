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
import { DniPersonData } from './DniCollectionTemplate';

Font.register({
  family: 'OpenSans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'OpenSans',
    fontSize: 10,
  },
  header: {
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
    paddingBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a5f',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 5,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    padding: 8,
  },
  personText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: 'bold',
  },
  infoText: {
    marginTop: 2,
    fontSize: 9,
    color: '#4b5563',
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 8,
  },
  imageBlock: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    objectFit: 'contain',
  },
  noImage: {
    width: '100%',
    height: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: 9,
  },
});

interface DniScoutApoderadoTemplateProps {
  scout: DniPersonData;
  apoderado: DniPersonData;
  metadata: {
    organizacion: string;
    fechaGeneracion: string;
  };
}

const PersonSection: React.FC<{ person: DniPersonData; hideRama?: boolean }> = ({ person, hideRama = false }) => {
  const tipoDoc = getTipoDocumentoLabel(person.tipoDocumento) || 'DNI';
  const baseInfo = `${tipoDoc}: ${person.numeroDocumento || 'Sin documento'}`;
  const ramaInfo = !hideRama && person.rama ? ` • Rama: ${person.rama}` : '';

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.personText}>{person.nombres} {person.apellidos}</Text>
        <Text style={styles.infoText}>{`${baseInfo}${ramaInfo}`}</Text>
      </View>

      <View style={styles.imagesRow}>
        <View style={styles.imageBlock}>
          {person.dniAnversoUrl ? (
            <Image src={person.dniAnversoUrl} style={styles.image} />
          ) : (
            <View style={styles.noImage}><Text>Sin imagen</Text></View>
          )}
        </View>

        <View style={styles.imageBlock}>
          {person.dniReversoUrl ? (
            <Image src={person.dniReversoUrl} style={styles.image} />
          ) : (
            <View style={styles.noImage}><Text>Sin imagen</Text></View>
          )}
        </View>
      </View>
    </View>
  );
};

const DniScoutApoderadoTemplate: React.FC<DniScoutApoderadoTemplateProps> = ({
  scout,
  apoderado,
  metadata,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Documentos de Identidad</Text>
          <Text style={styles.subtitle}>{metadata.organizacion}</Text>
        </View>

        <PersonSection person={scout} />
        <PersonSection person={apoderado} hideRama />
      </Page>
    </Document>
  );
};

export default DniScoutApoderadoTemplate;
