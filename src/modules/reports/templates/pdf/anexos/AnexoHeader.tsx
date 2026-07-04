/**
 * Cabecera compartida por los Anexos del módulo Aire Libre (Anexo 1, 3, 4).
 * El logo "Scouts del Perú" es un asset fijo del grupo (no cambia con el
 * tiempo), igual que en `cabeceraDefaults.ts` para la carta oficial —
 * se embebe por defecto y no depende de configuración.
 */

import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { anexoStyles } from './anexoPdfStyles';

export const LOGO_ANEXOS_URL = '/images/logo-anexos.png';

interface AnexoHeaderProps {
  titulo: string;
  subtitulo?: string;
}

export const AnexoHeader: React.FC<AnexoHeaderProps> = ({ titulo, subtitulo }) => (
  <View style={anexoStyles.header}>
    <View style={anexoStyles.logoContainer}>
      <Image src={LOGO_ANEXOS_URL} style={anexoStyles.logoImage} />
    </View>
    <View style={anexoStyles.headerTitleContainer}>
      <Text style={anexoStyles.headerTitle}>{titulo}</Text>
      {subtitulo ? <Text style={anexoStyles.headerSubtitle}>{subtitulo}</Text> : null}
    </View>
  </View>
);
