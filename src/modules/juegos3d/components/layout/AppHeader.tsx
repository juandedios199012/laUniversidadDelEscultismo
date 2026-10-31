import { WifiOff } from 'lucide-react';
import { LogoMark } from './LogoMark';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function AppHeader() {
  const online = useOnlineStatus();

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <LogoMark />
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-gradient">Juegos3D</span>
          </h1>
          <p className="truncate text-xs text-white/55 sm:text-sm">Dinámicas grupales en 3D · cuadro a cuadro</p>
        </div>
      </div>

      {!online && (
        <span
          role="status"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-400/10 px-3 text-xs font-semibold text-amber-100"
        >
          <WifiOff size={14} aria-hidden /> <span className="hidden sm:inline">Sin conexión ·</span> offline
        </span>
      )}
    </header>
  );
}
