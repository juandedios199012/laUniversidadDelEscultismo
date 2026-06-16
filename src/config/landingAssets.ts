// ================================================================
// CONFIGURACIÓN CENTRALIZADA DE ASSETS — LANDING PAGE
// Grupo Scout Lima 12
// ================================================================
// Edita SOLO este archivo para actualizar fotos, videos, textos
// del equipo y redes sociales. El resto del código no cambia.
//
// Cómo obtener link directo de OneDrive:
//   Archivo → ⋯ → Compartir → Copiar link
//   Reemplazar "view.aspx" → "download" en la URL obtenida
// ================================================================

export interface MiembroEquipo {
  id: string;
  nombre: string;
  rolVoluntariado: string;
  perfilProfesional: string;
  /** URL directa de descarga — OneDrive o similar */
  foto: string;
  linkedin: string;
}

export interface ActividadScout {
  icono: 'tent' | 'compass' | 'users' | 'heart' | 'award' | 'leaf' | 'shield' | 'star';
  titulo: string;
  descripcion: string;
}

export interface LogroMetrica {
  numero: string;
  descripcion: string;
  icono: 'users' | 'calendar' | 'award' | 'map-pin' | 'heart';
}

export interface LandingAssets {
  /** URL directa de video .mp4 comprimido (recomendado < 10 MB) */
  heroVideo: string;
  /** URL de imagen estática para Open Graph / redes sociales (1200×630 px) */
  ogImage: string;
  /** URL pública del sitio, sin barra final */
  siteUrl: string;
  socials: {
    instagram: string;
    tiktok: string;
    facebook: string;
  };
  equipo: MiembroEquipo[];
  actividades: ActividadScout[];
  logros: LogroMetrica[];
}

// ─── REEMPLAZA los valores "REEMPLAZAR_*" con tus URLs reales ───────────────
export const LANDING_ASSETS: LandingAssets = {
  heroVideo: 'https://1drv.ms/v/c/a877d6f23a3de7d5/IQAcasd8CKMfSr5BUSmeRU2tAcNs7RqhJx47eJHHQf9PGts?e=Lmrg5v',
  ogImage:   'https://1drv.ms/i/c/a877d6f23a3de7d5/IQCUeXng_6SgR69iUFObBcxeAdTH19nyQMaHBBAhxzt-Kxc?e=fVDjG5',
  siteUrl:   'https://REEMPLAZAR_TU_DOMINIO.com',

  socials: {
    instagram: 'https://instagram.com/REEMPLAZAR',
    tiktok:    'https://www.tiktok.com/@gruposcoutlima12',
    facebook:  'https://www.facebook.com/gruposcout.lima12',
  },

  // ─── Equipo ─────────────────────────────────────────────────────────────
  // Agrega o quita objetos según el tamaño de tu equipo.
  equipo: [
    {
      id: 'miembro-1',
      nombre: 'Nombre Apellido',
      rolVoluntariado: 'Jefe de Grupo',
      perfilProfesional:
        'Profesional con experiencia en liderazgo y gestión de equipos multidisciplinarios.',
      foto:     'https://onedrive.live.com/download?cid=REEMPLAZAR_FOTO_1',
      linkedin: 'https://linkedin.com/in/REEMPLAZAR',
    },
    {
      id: 'miembro-2',
      nombre: 'Juan De Dios Baudazio Sanchez',
      rolVoluntariado: 'Coordinador Rama Tropa',
      perfilProfesional:
        'Ingeniero de Sistema con Maestria en Inteligencia Artificial',
      foto:     'https://onedrive.live.com/download?cid=REEMPLAZAR_FOTO_2',
      linkedin: 'https://www.linkedin.com/in/juandediosbaudaziosanchez/',
    },
    {
      id: 'miembro-3',
      nombre: 'Nombre Apellido',
      rolVoluntariado: 'Coordinadora de Logística',
      perfilProfesional:
        'Gestora de proyectos con experiencia en planificación operativa y presupuestos.',
      foto:     'https://onedrive.live.com/download?cid=REEMPLAZAR_FOTO_3',
      linkedin: 'https://linkedin.com/in/REEMPLAZAR',
    },
  ],

  // ─── Actividades ────────────────────────────────────────────────────────
  actividades: [
    {
      icono: 'tent',
      titulo: 'Campamentos y Expediciones',
      descripcion:
        'Aventuras en la naturaleza que forjan carácter, resiliencia y trabajo en equipo.',
    },
    {
      icono: 'heart',
      titulo: 'Servicio Comunitario',
      descripcion:
        'Proyectos de impacto real en la comunidad, desarrollando ciudadanos comprometidos.',
    },
    {
      icono: 'compass',
      titulo: 'Habilidades para la Vida',
      descripcion:
        'Orientación, primeros auxilios, liderazgo y comunicación efectiva.',
    },
    {
      icono: 'award',
      titulo: 'Progresión Personal',
      descripcion:
        'Sistema de logros y especialidades que impulsa el crecimiento individual.',
    },
    {
      icono: 'users',
      titulo: 'Trabajo en Patrulla',
      descripcion:
        'Pequeños grupos que aprenden a colaborar, decidir y crecer juntos.',
    },
    {
      icono: 'leaf',
      titulo: 'Conciencia Ambiental',
      descripcion:
        'Respeto por la naturaleza como valor central del movimiento scout mundial.',
    },
  ],

  // ─── Logros / Métricas ──────────────────────────────────────────────────
  logros: [
    { numero: '+30',  descripcion: 'Años de trayectoria formando líderes',            icono: 'calendar' },
    { numero: '+500', descripcion: 'Jóvenes formados a lo largo de nuestra historia', icono: 'users'    },
    { numero: '+50',  descripcion: 'Campamentos y actividades realizadas',            icono: 'map-pin'  },
    { numero: '7',    descripcion: 'Dirigentes voluntarios profesionales activos',    icono: 'award'    },
  ],
};
