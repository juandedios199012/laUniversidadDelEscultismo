/** Manchas de luz difusa detrás de la interfaz (decorativo, solo CSS). */
export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="aurora-blob absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="aurora-blob absolute top-1/3 -right-40 h-[26rem] w-[26rem] rounded-full bg-cyan-500/20 blur-[120px] [animation-delay:-6s]" />
      <div className="aurora-blob absolute -bottom-40 left-1/4 h-[24rem] w-[24rem] rounded-full bg-fuchsia-600/20 blur-[120px] [animation-delay:-12s]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
    </div>
  );
}
