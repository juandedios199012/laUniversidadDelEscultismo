import { Axe, BriefcaseMedical, Dumbbell, EyeOff, Flag, Flame, Flower2, Footprints, Hammer, Handshake, Heart, MapPinned, Orbit, Palette, Repeat, Scale, Sprout, Sun, Tent, Weight } from 'lucide-react';
import type { ArchetypeId, SceneId } from '../engine/types';
import { sceneFor, type Area, type CatalogGame, type Category } from '../lib/catalog';
import type { Glow } from './ui/GlassCard';

/** Identidad visual de cada tipo de escena 3D (solo UI; el motor no sabe de colores de interfaz). */
export const ARCHETYPE_THEME: Record<ArchetypeId, { label: string; icon: React.ElementType; gradient: string; glow: Glow; hint: string }> = {
  chain: { label: 'Cadena', icon: Footprints, gradient: 'from-amber-400 via-orange-500 to-pink-500', glow: 'amber', hint: 'Fila unida, manos en los hombros' },
  territory: { label: 'Territorio', icon: Flag, gradient: 'from-emerald-400 via-teal-400 to-cyan-400', glow: 'emerald', hint: 'Dos campos, captura de bandera' },
  circle: { label: 'Círculo', icon: Orbit, gradient: 'from-violet-500 via-fuchsia-500 to-pink-500', glow: 'violet', hint: 'Ronda y persecución por fuera' },
  relay: { label: 'Relevos', icon: Repeat, gradient: 'from-sky-400 via-blue-500 to-indigo-500', glow: 'cyan', hint: 'Columnas, salida y entrega' },
  stealth: { label: 'Sigilo', icon: EyeOff, gradient: 'from-rose-500 via-fuchsia-600 to-violet-700', glow: 'pink', hint: 'Acecho a un guardián vendado' },
  station: { label: 'Taller por postas', icon: Hammer, gradient: 'from-lime-400 via-emerald-500 to-teal-500', glow: 'emerald', hint: 'Trabajo manual y rotación' },
};

type SceneTheme = (typeof ARCHETYPE_THEME)[ArchetypeId];

/** Las variantes de taller tienen su propia identidad; el resto usa la de su arquetipo. */
export const SCENE_THEME: Record<SceneId, SceneTheme> = {
  ...ARCHETYPE_THEME,
  station_ground_mosaic: { label: 'Mosaico en el suelo', icon: Flower2, gradient: 'from-orange-400 via-amber-500 to-lime-500', glow: 'amber', hint: 'Figura trazada con hojas, piedras y ramitas' },
  station_stress_test_rig: { label: 'Fuerza y cuerdas', icon: Weight, gradient: 'from-slate-400 via-blue-500 to-indigo-600', glow: 'cyan', hint: 'Tijera de leños con un peso suspendido' },
  station_pioneering_tripod: { label: 'Trípode pionero', icon: Axe, gradient: 'from-amber-500 via-orange-600 to-yellow-700', glow: 'amber', hint: 'Trípode amarrado con vientos a estacas' },
  station_first_aid_stretcher: { label: 'Camilla y botiquín', icon: BriefcaseMedical, gradient: 'from-red-500 via-rose-500 to-pink-500', glow: 'pink', hint: 'Paciente en reposo y vendaje' },
  station_campfire_cooking: { label: 'Fogata y cocina', icon: Flame, gradient: 'from-yellow-400 via-orange-500 to-red-600', glow: 'amber', hint: 'Pan de cazador sobre las brasas' },
  station_tent_assembly: { label: 'Armado de carpa', icon: Tent, gradient: 'from-orange-500 via-amber-600 to-emerald-600', glow: 'emerald', hint: 'Parantes, vientos y estacas' },
  station_cartography_table: { label: 'Cartografía y consejo', icon: MapPinned, gradient: 'from-cyan-400 via-sky-500 to-indigo-500', glow: 'cyan', hint: 'Mesa con mapa, papelógrafo y brújula' },
  station_seed_bomb_craft: { label: 'Manualidades y siembra', icon: Sprout, gradient: 'from-lime-400 via-green-500 to-emerald-600', glow: 'emerald', hint: 'Bombas de semillas y herbario' },
};

/** Descripción de la acción concreta que muestra la coreografía (según `activity` del catálogo). */
const ACTIVITY_HINT: Record<string, string> = {
  round_flag: 'Columnas, vuelta al banderín y entrega del relevo',
  animal_move: 'Relevo avanzando agachados, imitando a su animal',
  'tie_knot:tree': 'Relevo: cada uno ata su cuerda al árbol',
  'tie_knot:cross': 'Relevo: cada uno hace una fase del amarre en la cruz de palos',
  'tie_knot:shears': 'Relevo: amarre de la tijera en diagonal',
  'tie_knot:tripod': 'Relevo: amarre de trípode con bordones',
  'tie_knot:crossbar': 'Relevo: fijar un travesaño entre dos soportes',
  'tie_knot:stakes': 'Relevo: tensar vientos y clavar estacas',
  'tie_knot:rope_join': 'Relevo: unir dos cuerdas con vuelta de escota',
  'tie_knot:ring': 'Relevo con el pañuelo: desatar el anillo en la base',
  'place_piece:pattern': 'Relevo: cada uno coloca una pieza de la figura',
  'place_piece:backpack': 'Relevo: ordenar los objetos en la mochila',
  'place_piece:sundial': 'Relevo: clavar ramitas en la punta de la sombra',
  'place_piece:pot': 'Relevo: llevar la semilla a la maceta sin que caiga',
  wash_hands: 'Relevo: lavarse las manos en la mesa de intendencia',
  'memorize_draw:board': 'Relevo: memorizar en la pizarra y dibujar al volver',
  'memorize_draw:fist': 'Relevo: dibujar curvas de nivel en el puño',
  'memorize_draw:cipher': 'Relevo: traer fragmentos de un mensaje cifrado',
  fetch_item: 'Relevo: elegir y traer un implemento de primeros auxilios',
  splint: 'Relevo: inmovilizar el brazo de un lesionado',
  greet: 'Relevo: saludar al dirigente y decir una frase en otro idioma',
  measure: 'Relevo: medir la altura de un árbol con el bordón',
  rescue_rope: 'Relevo: lanzar la cuerda al caído y tirar con seguridad',
  circuit: 'Circuito en fila alternando trote y marcha',
  collect: 'Recolección por sectores y clasificación en bolsas',
  hang_load: 'Tijera de leños con un peso suspendido',
  hang_backpacks: 'Colgar mochilas de la tijera, fuera del suelo',
  queen_chair: 'Silla de cuatro manos cargando a un compañero',
  human_bridge: 'Cruzar sobre los brazos entrelazados de dos filas',
  drag_weight: 'Arrastrar un peso con la cuerda mojada',
  tightrope: 'Reforzar con nudo Margarita una soga tensa',
  backpack_fit: 'Ajustar correas y cinturón de una mochila',
  knot_together: 'Un nudo llano entre todos, con una mano cada uno',
  staff_twist: 'Pulseada con bordón frente a frente',
  tug_cross: 'Cinchada en cruz de cuatro equipos',
  // Cartografía, medición y consejo
  card_hunt: 'Un representante corre a buscar la tarjeta del artículo',
  camp_plan: 'Plano de campamento con palos y piedras en el césped',
  visor_estimate: 'Estimar el ancho de la zanja con el método de la visera',
  mime: 'Escenificar una situación sin palabras',
  totem_council: 'Consejo alrededor del banderín: lema y grito del equipo',
  golden_book: 'El Libro de Oro circula y cada uno escribe',
  compass_azimuth: 'Tomar azimut con la brújula hacia un árbol',
  obstacle_90: 'Sortear un obstáculo con giros de 90° y recuperar el rumbo',
  double_step: 'Calibrar el doble paso sobre una pista medida',
  tree_triangulation: 'Medir la altura de tres árboles por triangulación',
  tape_check: 'Estimar una distancia y comprobarla con la cinta',
  topo_map: 'Interpretar un mapa topográfico en la mesa',
  park_sketch: 'Recorrer el perímetro y dibujar el croquis',
  morse_signal: 'Emisor con silbato y receptores que anotan en Morse',
  secret_mission: 'Servicio espontáneo: regar, ordenar bancas, orientar',
  rights_tree: 'Colgar hojas con derechos en el árbol del papelógrafo',
  talking_stick: 'El bastón de hablar pasa en el círculo sentado',
  closing_ceremony: 'Entrega de insignias y renovación del compromiso',
  // Círculo y ronda
  relay_greet_cones: 'Relevo sorteando conos y saludo al dirigente',
  relay_safety_circle: 'Relevo: girar 360° en el círculo de seguridad',
  compass_rose_star: 'El equipo nombrado corre a su rumbo en el círculo',
  torch_pass: 'La linterna pasa de mano en mano en el gran círculo',
  whistle_signals: 'Cada toque de silbato provoca una reacción distinta',
  badger: 'Parejas tiran de sus cuerdas hacia su saquito',
  kick_stool: 'Ronda de la mano girando alrededor del taburete',
  compass_rose_swap: 'Dos rumbos intercambian lugares y el centro intenta ocupar uno',
  square_circles: 'Parejas atan sus cuerdas y se echan atrás a probar el nudo',
  rooster_fight: 'Duelo a la pata coja con los brazos cruzados',
  talking_ball: 'El balón vuela diciendo una cualidad del compañero',
  people_to_people: 'Parejas siguen consignas y cambian al grito',
  freeze_ball: 'Pelota al aire, todos se congelan y tres saltos para tocar',
  // Sigilo, rastreo y observación
  sentinel_whistle: 'Vigilante vendado con silbato, acecho sobre hojas secas',
  whistle_blind: 'Pitador vendado: quien es descubierto queda eliminado',
  sleeping_pirate: 'Pirata sentado y vendado custodia el cofre',
  flag_defense: 'Dos equipos defienden 4 banderines, dos atacan en sigilo',
  blind_mute_pairs: 'Parejas: vendado guiado con toques por un compañero mudo',
  trail_signs: 'Cada equipo sigue 5 señales hasta su banderín oculto',
  footprint_analysis: 'Analizar huellas en el arenero',
  blind_triangle: 'Triángulo de 3 rumbos con brújula de vuelta a la estaca',
  kim_game: 'Observar objetos, cubrirlos y listarlos; luego Kim tacto',
  trail_laying: 'Un equipo traza la pista y el otro la sigue',
  // Cadena, territorio y activos
  bucket_chain: 'Botellas de mano en mano hasta llenar el recipiente',
  yarn_web: 'El ovillo teje una red que sostiene un balón',
  human_knot: 'Nudo humano por equipo: desenredarse sin soltarse',
  human_knot_troop: 'Nudo humano de toda la tropa',
  human_boats: 'Barcas humanas remando sentadas al unísono',
  bulldog: 'Cruzar el campo; los tocados se vuelven bulldogs',
  cribol: 'Pases sin caminar con el balón hasta el trípode',
  circle_conquest: 'Manos atrás, sacar a los rivales del círculo',
  fog_boats: 'Filas vendadas guiadas al muelle por el sonido',
  tail_snakes: 'Serpientes que intentan quitar la cola de las otras',
  // Talleres
  axe_area: 'Delimitar el área de hachero con una cuerda',
  semaphore_tower: 'Señales de semáforo con pañoletas y una base que anota',
  mast_anchor: 'Mástil anclado con vientos a estacas',
  water_tripod: 'Olla colgada del trípode, sin derramar',
  washstand: 'Lavamanos con botella invertida y zapatero elevado',
  latrine: 'Cavar la trinchera y señalizar con un bordón',
  trash_tripod: 'Basurero de trípode con bolsa',
  banner_care: 'Cuidado del banderín: cintas y muescas en el bordón',
  tool_demo: 'Sierra de arco y entrega segura de herramientas',
  park_cleanup: 'Retirar piedras peligrosas y limpiar jardineras',
  herbarium: 'Prensar hojas entre papel para el herbario',
  tradition_fair: 'Danza tradicional y público que aplaude',
  wali_board: 'Wali: dos jugadores siembran semillas en el tablero',
  kindling_sort: 'Recolectar ramas y clasificarlas en tres pilas',
  mirror_mime: 'Espejo: el equipo imita los gestos al unísono',
  fire_build: 'Armar una fogata en pirámide con entrada de aire',
  skit: 'Ensayo de un skit frente a la fogata',
  park_detective: 'Inspeccionar el rincón buscando rastros',
  leaf_hunt: 'Recolectar hojas caídas y clasificarlas en la mesa',
  footprint_cast: 'Calcar y medir una huella',
  constellation: 'La Cruz del Sur trazada con piedras',
  woggle_sling: 'Tejer el pasador y usar la pañoleta como cabestrillo',
  kit_inventory: 'Inventario y rotulado del botiquín',
  cold_ground: 'Remover cenizas, rociar agua y comprobar con la palma',
  stretcher_build: 'Armar la camilla y trasladar a un compañero',
  knife_safety: 'Tallar estacas y entregar la cortaplumas cerrada',
};

/** Identidad de la escena del juego; si tiene actividad propia, la descripción es la de su acción. */
export const sceneTheme = (game: CatalogGame): SceneTheme => {
  const base = SCENE_THEME[sceneFor(game)];
  const hint = game.activity ? ACTIVITY_HINT[game.activity] : undefined;
  return hint ? { ...base, hint } : base;
};

/** Color e icono de cada área (chips de filtro y etiquetas). */
export const AREA_THEME: Record<Area, { icon: React.ElementType; chip: string; dot: string }> = {
  Corporalidad: { icon: Dumbbell, chip: 'border-sky-300/50 bg-sky-400/15 text-sky-100', dot: 'bg-sky-400' },
  Creatividad: { icon: Palette, chip: 'border-fuchsia-300/50 bg-fuchsia-400/15 text-fuchsia-100', dot: 'bg-fuchsia-400' },
  Carácter: { icon: Scale, chip: 'border-amber-300/50 bg-amber-400/15 text-amber-100', dot: 'bg-amber-400' },
  Afectividad: { icon: Heart, chip: 'border-rose-300/50 bg-rose-400/15 text-rose-100', dot: 'bg-rose-400' },
  Sociabilidad: { icon: Handshake, chip: 'border-emerald-300/50 bg-emerald-400/15 text-emerald-100', dot: 'bg-emerald-400' },
  Espiritualidad: { icon: Sun, chip: 'border-violet-300/50 bg-violet-400/15 text-violet-100', dot: 'bg-violet-400' },
};

export const CATEGORY_LABEL: Record<Category, string> = { A: 'Activos', T: 'Técnicos', C: 'Clásicos' };
