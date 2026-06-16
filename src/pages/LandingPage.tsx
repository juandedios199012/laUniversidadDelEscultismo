import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Heart, Compass, Award, Leaf, MapPin, Calendar,
  Mountain, Shield, Star, ChevronDown, ExternalLink, Menu, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  LANDING_ASSETS,
  type ActividadScout,
  type LogroMetrica,
} from '../config/landingAssets';

// ── Mapeo de claves de config → componentes Lucide ──────────────────────────
const ACTIVITY_ICONS: Record<ActividadScout['icono'], LucideIcon> = {
  tent:    Mountain,
  compass: Compass,
  users:   Users,
  heart:   Heart,
  award:   Award,
  leaf:    Leaf,
  shield:  Shield,
  star:    Star,
};

const STAT_ICONS: Record<LogroMetrica['icono'], LucideIcon> = {
  users:     Users,
  calendar:  Calendar,
  award:     Award,
  'map-pin': MapPin,
  heart:     Heart,
};

// ── Fallback SVG cuando la imagen del miembro no carga ──────────────────────
function avatarFallback(inicial: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>` +
    `<rect width='64' height='64' rx='32' fill='%231e3a5f'/>` +
    `<text x='32' y='42' text-anchor='middle' font-size='28' fill='%2360a5fa' ` +
    `font-family='sans-serif' font-weight='bold'>${inicial.toUpperCase()}</text>` +
    `</svg>`
  )}`;
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function LandingPage() {
  const [videoError, setVideoError] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans antialiased">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">⚜️</span>
            <div>
              <p className="text-sm font-bold text-white leading-none">Grupo Scout</p>
              <p className="text-xs text-blue-400 font-semibold tracking-wide">Lima 12</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav
            className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80"
            aria-label="Navegación principal"
          >
            <a href="#nosotros"    className="hover:text-blue-400 transition-colors">Nosotros</a>
            <a href="#dirigentes-scouts"      className="hover:text-blue-400 transition-colors">Dirigentes Scouts</a>
            <a href="#que-hacemos" className="hover:text-blue-400 transition-colors">Qué Hacemos</a>
            <a href="#logros"      className="hover:text-blue-400 transition-colors">Logros</a>
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full transition-all shadow-lg shadow-blue-600/30 font-semibold ml-2"
            >
              Acceso Sistema →
            </Link>
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-900/95 backdrop-blur-md px-6 py-4 space-y-1">
            {[
              { href: '#nosotros',    label: 'Nosotros'    },
              { href: '#dirigentes-scouts',      label: 'Dirigentes Scouts'      },
              { href: '#que-hacemos', label: 'Qué Hacemos' },
              { href: '#logros',      label: 'Logros'      },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="block py-2.5 text-white/80 hover:text-blue-400 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
            <Link
              to="/dashboard"
              className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-full transition-all font-semibold mt-3"
              onClick={() => setMenuOpen(false)}
            >
              Acceso Sistema →
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">

        {/* Video de fondo con fallback a gradiente cuando falla la carga */}
        {!videoError ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          >
            <source src={LANDING_ASSETS.heroVideo} type="video/mp4" />
          </video>
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900"
            aria-hidden="true"
          />
        )}

        {/* Overlay de contraste — garantiza legibilidad WCAG AA (4.5:1) */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-900/55 to-slate-900"
          aria-hidden="true"
        />

        {/* Contenido principal del hero */}
        <div className="relative z-10 text-center max-w-4xl px-6 space-y-6">
          <span className="inline-block bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border border-blue-500/30">
            Movimiento Scout — Lima, Perú
          </span>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            Formando los líderes
            <br className="hidden md:block" />
            <span className="text-blue-400"> del mañana</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 font-light max-w-2xl mx-auto">
            A través del servicio, la aventura y los valores scout, impulsamos el crecimiento
            integral de cada joven que se une a nuestra comunidad.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-full transition-all shadow-xl shadow-blue-600/40 font-semibold text-base"
            >
              Acceso Sistema →
            </Link>
            <a
              href="#nosotros"
              className="border border-white/30 hover:border-white/60 text-white px-8 py-3.5 rounded-full transition-all font-semibold text-base hover:bg-white/5"
            >
              Conoce más
            </a>
          </div>
        </div>

        {/* Indicador de scroll */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-50"
          aria-hidden="true"
        >
          <ChevronDown className="w-6 h-6 text-white" />
        </div>
      </section>

      {/* ── NOSOTROS ───────────────────────────────────────────────────── */}
      <section id="nosotros" className="py-24 max-w-7xl mx-auto px-6 scroll-mt-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">

          <div className="space-y-6">
            <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase">
              Nuestra misión
            </span>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Voluntariado profesional al servicio de la juventud
            </h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              El Grupo Scout Lima 12 es una comunidad de voluntarios comprometidos con el
              desarrollo integral de niños y jóvenes, usando la metodología scout como
              herramienta de transformación personal y social.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Nuestros dirigentes combinan su experiencia profesional con la pasión por el
              voluntariado para brindar a cada scout un espacio seguro de aprendizaje,
              aventura y servicio.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { titulo: 'Valores Scout', desc: 'Honestidad, respeto, servicio y responsabilidad como base de todo.' },
              { titulo: 'Metodología',   desc: 'Aprendizaje por la acción, en la naturaleza y en comunidad.' },
              { titulo: 'Seguridad',     desc: 'Protocolos rigurosos y dirigentes capacitados en cada actividad.' },
              { titulo: 'Inclusión',     desc: 'Un espacio para jóvenes de todas las realidades y capacidades.' },
            ].map((item) => (
              <div
                key={item.titulo}
                className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition-colors"
              >
                <h3 className="font-semibold text-white mb-2">{item.titulo}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIRIGENTES SCOUTS ────────────────────────────────────────────── */}
      <section id="dirigentes-scouts" className="py-24 bg-slate-800/30 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-16 space-y-3">
            <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase">
              Las personas detrás del grupo
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">
              Un equipo con propósito y experiencia
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Profesionales de distintas áreas que dedican su tiempo libre a guiar a la
              próxima generación.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {LANDING_ASSETS.equipo.map((miembro) => (
              <div
                key={miembro.id}
                className="bg-slate-800/60 border border-white/5 rounded-2xl p-6 backdrop-blur-sm hover:border-blue-500/30 hover:bg-slate-800/80 transition-all group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={miembro.foto}
                    alt={`Foto de ${miembro.nombre}`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-600 group-hover:border-blue-500 transition-colors flex-shrink-0"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = avatarFallback(
                        miembro.nombre.charAt(0)
                      );
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{miembro.nombre}</h3>
                    <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider mt-0.5">
                      {miembro.rolVoluntariado}
                    </p>
                  </div>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  {miembro.perfilProfesional}
                </p>

                <a
                  href={miembro.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors text-sm"
                  aria-label={`Perfil de LinkedIn de ${miembro.nombre}`}
                >
                  {/* LinkedIn icon inline SVG — no dep. externa */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.8v8.37h2.8v-4.67c0-.25.02-.5.1-.68a1.14 1.14 0 0 1 1-.77c.76 0 1 .58 1 1.42v4.7zM6.5 8.37a1.37 1.37 0 1 0 0-2.75 1.37 1.37 0 0 0 0 2.75M8 18.5V10.13H5V18.5z" />
                  </svg>
                  Ver LinkedIn
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUÉ HACEMOS ────────────────────────────────────────────────── */}
      <section id="que-hacemos" className="py-24 max-w-7xl mx-auto px-6 scroll-mt-20">
        <div className="text-center mb-16 space-y-3">
          <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase">
            Nuestras actividades
          </span>
          <h2 className="text-3xl md:text-4xl font-bold">Qué hacemos</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Cada actividad está diseñada para desarrollar competencias reales para el siglo XXI.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {LANDING_ASSETS.actividades.map((actividad) => {
            const Icono = ACTIVITY_ICONS[actividad.icono] ?? Shield;
            return (
              <div
                key={actividad.titulo}
                className="bg-slate-800/40 border border-white/5 rounded-2xl p-6 hover:border-blue-500/20 hover:bg-slate-800/60 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <Icono className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{actividad.titulo}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{actividad.descripcion}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── LOGROS ─────────────────────────────────────────────────────── */}
      <section id="logros" className="py-24 bg-gradient-to-b from-blue-950/30 to-slate-900/50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase">
              Nuestro impacto
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">Nuestros logros</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {LANDING_ASSETS.logros.map((logro) => {
              const Icono = STAT_ICONS[logro.icono] ?? Award;
              return (
                <div
                  key={logro.descripcion}
                  className="text-center space-y-3 p-6 bg-slate-800/30 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                    <Icono className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-4xl font-extrabold text-white">{logro.numero}</p>
                  <p className="text-gray-400 text-sm leading-snug">{logro.descripcion}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-slate-950 py-14">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">⚜️</span>
            <div>
              <p className="font-bold text-white">Grupo Scout Lima 12</p>
              <p className="text-xs text-gray-500">Formando líderes — Lima, Perú</p>
            </div>
          </div>

          {/* Redes sociales — todos con rel="noopener noreferrer" (OWASP A01) */}
          <nav className="flex items-center gap-6" aria-label="Redes sociales">
            <a
              href={LANDING_ASSETS.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-400 hover:scale-110 transition-all"
              aria-label="Instagram del Grupo Scout Lima 12"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
              </svg>
            </a>
            <a
              href={LANDING_ASSETS.socials.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyan-400 hover:scale-110 transition-all"
              aria-label="TikTok del Grupo Scout Lima 12"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z" />
              </svg>
            </a>
            <a
              href={LANDING_ASSETS.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-500 hover:scale-110 transition-all"
              aria-label="Facebook del Grupo Scout Lima 12"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </nav>

          <p className="text-gray-500 text-sm text-center">
            © {new Date().getFullYear()} Grupo Scout Lima 12. Todos los derechos reservados.
          </p>
        </div>
      </footer>

    </div>
  );
}
