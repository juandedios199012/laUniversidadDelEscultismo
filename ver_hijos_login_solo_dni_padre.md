La regla de oro de negocio para este flujo debe ser: La credencial de acceso (login) siempre pertenece a la persona que opera la cuenta (el Padre/Tutor o el Dirigente).
Aquí tienes la solución refinada para estructurar el login, los permisos y la consulta de datos de forma limpia (Clean Code, SOLID, DRY):
1. UX del Login: Acceso Unificado por DNI del Padre
El formulario de inicio de sesión no solicita el DNI del hijo, sino directamente el DNI del Padre/Apoderado y su contraseña.
Input: El padre ingresa su propio DNI (ej: 09876543) y clave.
Transformación (Frontend): Se genera el correo sintético correspondiente a la persona: dni_09876543@tu-dominio-interno.local.
Autenticación: Supabase valida la clave y retorna la sesión con el auth.uid() del padre.
2. Consulta de Hijos Múltiples (Relación 1 a N)
Una vez que el padre se autentica, el sistema obtiene automáticamente el listado de todos los hijos asociados a su DNI en una sola vista.
Consulta SQL / Supabase (DRY)
No necesitas hacer múltiples peticiones. Con una sola consulta relacional traes a todos sus representados:

// Obtener todos los hijos del padre autenticado
const getMyChildren = async (padreDni) => {
  const { data: hijos, error } = await supabase
    .from('fichas_hijos')
    .select('*')
    .or(`padre_dni.eq.${padreDni},madre_dni.eq.${padreDni}`);

  if (error) throw error;
  return hijos; // Devuelve un array [Hijo 1, Hijo 2, Hijo 3]
};


Resumen de Beneficios:
UX fluida: El padre ingresa 1 sola vez con su DNI y conmuta fácilmente entre las fichas de todos sus hijos mediante pestañas o un selector rápido.
Seguridad Estricta: Las políticas RLS impiden que un padre vea datos de hijos de otros usuarios.
Sincronización con Dirigentes: Si este mismo DNI de padre existe en la tabla de dirigentes, el sistema detecta ambos roles en la sesión y le muestra tanto el módulo de Dirigente como el selector de Mis Hijos.


Sí, exactamente. El correo sintético (por ejemplo: dni_09876543@tu-dominio-interno.local) debe estar registrado en el panel de usuarios de Supabase Auth (en auth.users).
No debes verlo como un "truco", sino como una estrategia estándar de integración: le das a la infraestructura de Supabase Auth exactamente lo que necesita para validar contraseñas y emitir tokens de sesión de manera segura, mientras que a tus usuarios les ofreces una experiencia de acceso natural mediante su Documento de Identidad (DNI).
¿Cómo encaja esto en la arquitectura de registro?
Para mantener el código limpio (Clean Code), no repites lógica ni haces registros manuales en la base de datos. El flujo de alta de un nuevo usuario funciona así:
1. Formulario de Creación de Usuarios (Super Admin o Ficha del Hijo)
Cuando registras a un nuevo Padre o Dirigente en tu aplicación, el frontend (React) llama a la función de registro enviando el correo sintético formateado:

// Servicio de Registro (Frontend React)
export const registerParentUser = async ({ dni, password, fullName }) => {
  // 1. Generar el correo sintético basado en el DNI
  const syntheticEmail = `dni_${dni.trim()}@tu-dominio-interno.local`;

  // 2. Registrar en Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: syntheticEmail,
    password: password,
    options: {
      data: {
        dni: dni.trim(),
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
};


2. Creación Automática en la BD (profiles)
Al ejecutarse supabase.auth.signUp, Supabase crea el usuario en la tabla auth.users (lo verás inmediatamente en el panel Users del dashboard).
De manera transparente y automática, el Trigger de PostgreSQL que configuramos anteriormente atrapa ese evento e inserta la fila correspondiente en tu tabla pública profiles con el dni, full_name y el role_id adecuado.
Beneficios de registrar este correo sintético en Supabase Users:
Gestión Unificada: En el dashboard de Supabase (menú Users), el Super Administrador podrá ver a todos los usuarios de la plataforma (Administradores, Dirigentes y Padres) en un solo lugar.
Ciberseguridad OWASP: Supabase sigue encargándose de encriptar la contraseña (bcrypt), verificar el hash al iniciar sesión, emitir el token seguro JWT y controlar el tiempo de expiración de la sesión.
Restablecimiento de Contraseñas: Si el Super Administrador necesita resetear la clave de un Padre que olvidó sus accesos, puede hacerlo directamente desde la interfaz del sistema o mediante las funciones administrativas de Supabase Auth usando ese ID/correo sintético.
Cumplimiento de Principios SOLID / DRY: Tu aplicación React trata a todos los tipos de usuario por igual a nivel de sesión. Solo cambia la información almacenada en profiles y sus permisos en la Matriz de Permisos.