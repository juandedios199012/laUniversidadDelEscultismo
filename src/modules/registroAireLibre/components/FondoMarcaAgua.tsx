import type { ConfigMarcaAgua } from '../types';

/** Fondo con la foto configurada como marca de agua detrás del formulario. */
export default function FondoMarcaAgua({ marcaAgua, children, fijo = true }: {
  marcaAgua: ConfigMarcaAgua;
  children: React.ReactNode;
  /** fijo=false para la vista previa dentro del panel admin. */
  fijo?: boolean;
}) {
  return (
    <div className={`relative isolate ${fijo ? 'min-h-screen' : 'min-h-full'} bg-linear-to-br from-green-50 via-stone-50 to-teal-50`}>
      {marcaAgua.imagenUrl && (
        <div
          aria-hidden
          className={`${fijo ? 'fixed' : 'absolute'} inset-0 -z-10 bg-cover bg-center grayscale-[30%]`}
          style={{ backgroundImage: `url("${marcaAgua.imagenUrl}")`, opacity: marcaAgua.opacidad / 100 }}
        />
      )}
      {children}
    </div>
  );
}
