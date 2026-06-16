/**
 * PersonRoleBadge
 * Badge de color pequeño que indica el rol de una persona en el sistema.
 */

import React from 'react';
import { PersonaRol } from '../../../services/personaService';

const ROL_STYLES: Record<PersonaRol['tipo'], { bg: string; text: string; label: string }> = {
  familiar:  { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Familiar' },
  dirigente: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Dirigente' },
  comite:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Comité' },
  scout:     { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Scout' },
};

interface PersonRoleBadgeProps {
  tipo: PersonaRol['tipo'];
  detalle?: string;
}

export function PersonRoleBadge({ tipo, detalle }: PersonRoleBadgeProps) {
  const style = ROL_STYLES[tipo];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      title={detalle}
    >
      {detalle ?? style.label}
    </span>
  );
}
