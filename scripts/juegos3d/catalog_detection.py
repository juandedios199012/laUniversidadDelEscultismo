"""
catalog_detection.py
--------------------
Detección de formación y materiales a partir del texto libre del Excel del catálogo.

Las reglas son datos (tablas de abajo): para corregir una detección se edita la tabla,
no la lógica. Cada material detectado tiene un `kind` estable (en inglés, para el código)
y una etiqueta en español para el reporte de revisión.

Usado por:
  - export_catalog_to_json.py  → agrega `formation_detected` y `materials_detected` a data/games.json
  - report_catalog_mapping.py  → genera el CSV de revisión para Excel
"""

import re
import unicodedata


def normalize(text: str) -> str:
    """Minúsculas y sin tildes, para comparar sin depender de cómo se escribió en el Excel."""
    text = unicodedata.normalize('NFD', text or '')
    return ''.join(c for c in text if unicodedata.category(c) != 'Mn').lower()


# ---------------------------------------------------------------------------
# FORMACIONES
# ---------------------------------------------------------------------------
# Orden importa: gana la primera regla cuyo patrón aparece (de lo más específico a lo general).
FORMATION_RULES = [
    ('horseshoe',  'Herradura',              [r'herradura']),
    ('star',       'Estrella',               [r'estrella']),
    ('cross',      'Cruz',                   [r'\bcruz\b']),
    ('circle',     'Círculo',                [r'circulo', r'puntos cardinales']),
    ('pairs',      'Parejas enfrentadas',    [r'enfrentad', r'parejas']),
    ('columns',    'Columnas',               [r'columna']),
    ('rows',       'Filas',                  [r'\bfilas?\b']),
    ('lines',      'Líneas',                 [r'linea']),
    ('corner',     'Rincón de equipo',       [r'rincon', r'mesa', r'manta', r'sala techada']),
    ('scattered',  'Dispersión por sectores', [r'dispersion', r'sectores']),
    ('open_field', 'Campo abierto',          [r'campo', r'area amplia', r'espacio libre', r'cancha', r'pista',
                                              r'rectangulo', r'cuadrado', r'paralelogramo', r'superficie']),
]

FORMATION_MODIFIERS = [
    ('closed',       'cerrada',            [r'cerrad']),
    ('open',         'abierta',            [r'abiert']),
    ('holding_hands', 'manos enlazadas',   [r'manos enlazadas']),
    ('safety_zone',  'zona de seguridad',  [r'zona de seguridad']),
    ('divided',      'campo dividido',     [r'dividid']),
    ('soft_ground',  'césped suave',       [r'cesped suave', r'superficie de cesped']),
    ('trees',        'con árboles',        [r'arbol']),
]


def detect_formation(formation: str) -> dict:
    text = normalize(formation)
    kind, label = 'unknown', 'Sin reconocer'
    for k, lbl, patterns in FORMATION_RULES:
        if any(re.search(p, text) for p in patterns):
            kind, label = k, lbl
            break

    size = None
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*m', text)
    if m:
        size = {'width_m': float(m.group(1).replace(',', '.')), 'depth_m': float(m.group(2).replace(',', '.'))}
    else:
        m = re.search(r'(\d+(?:[.,]\d+)?)\s*m(?:\s*de\s*diametro)?\b', text)
        if m:
            value = float(m.group(1).replace(',', '.'))
            size = {'diameter_m': value} if kind == 'circle' else {'length_m': value}

    modifiers = [k for k, _, pats in FORMATION_MODIFIERS if any(re.search(p, text) for p in pats)]
    return {'kind': kind, 'label': label, 'size': size, 'modifiers': modifiers}


def formation_modifier_labels(modifiers):
    labels = {k: lbl for k, lbl, _ in FORMATION_MODIFIERS}
    return [labels[m] for m in modifiers]


# ---------------------------------------------------------------------------
# MATERIALES
# ---------------------------------------------------------------------------
# (kind, etiqueta, patrones). Un segmento puede tener varios materiales ("libreta y lápiz").
# Orden importa dentro de un mismo segmento: los patrones más específicos van primero.
MATERIAL_RULES = [
    ('tape_measure',  'Cinta métrica / regla', [r'cinta metrica', r'wincha', r'\breglas? graduada', r'\bregla\b']),
    ('tape',          'Cinta adhesiva / de señal', [r'cinta adhesiva', r'cinta de advertencia', r'cinta de embalaje', r'masking']),
    ('first_aid_kit', 'Botiquín / gasas',     [r'botiquin', r'gasa', r'esparadrapo', r'curita', r'agua destilada', r'guantes de (latex|nitrilo)', r'^guantes$']),
    ('blindfold',     'Venda (ojos/vendaje)', [r'\bvendas?\b', r'antifaz', r'tapar (los )?ojos', r'para vendar']),
    ('neckerchief',   'Pañoleta / pañuelo',   [r'panolet', r'panuelo']),
    ('rope',          'Cuerda / soguilla',    [r'cuerda', r'soguilla', r'cordel', r'cordon', r'sisal', r'rafia', r'\bpita\b']),
    ('stake',         'Estaca',               [r'estaca']),
    ('staff',         'Bordón / palo / vara', [r'bordon', r'\bpalos?\b', r'\bvaras?\b', r'varilla', r'poste', r'escoba']),
    ('cone',          'Cono',                 [r'\bconos?\b']),
    ('chalk',         'Tiza',                 [r'\btiza']),
    ('whistle',       'Silbato',              [r'silbato']),
    ('ball',          'Balón / pelota',       [r'balon', r'pelota']),
    ('compass',       'Brújula',              [r'brujula']),
    ('map',           'Mapa / croquis',       [r'\bmapas?\b', r'croquis', r'\bplanos?\b']),
    ('notebook',      'Libreta / cuaderno',   [r'libreta', r'cuaderno', r'carpeta', r'bitacora', r'\blibro', r'tablas? con clip']),
    ('board',         'Tablero de juego',     [r'tablero']),
    ('cards',         'Tarjetas / códigos',   [r'tarjeta', r'silueta', r'ficha', r'\bcartas?\b', r'morse']),
    ('paper',         'Papel / papelógrafo',  [r'papel', r'cartulina', r'hojas? bond', r'cuadriculad', r'carton']),
    ('pen',           'Lápiz / plumón',       [r'lapic', r'plumon', r'marcador', r'crayon']),
    ('weight',        'Peso / pesa',          [r'\bpesas?\b', r'\bpeso\b', r'\bkg\b']),
    ('water',         'Agua / bidón',         [r'\bagua\b', r'bidon', r'botell']),
    ('bucket',        'Balde / caja / recipiente',   [r'balde', r'cubeta', r'\blatas?\b', r'\bollas?\b', r'recipiente', r'jarro', r'\bcajas?\b']),
    ('backpack',      'Mochila',              [r'mochila']),
    ('flag',          'Banderín / bandera',   [r'banderin', r'bandera']),
    ('tent',          'Carpa',                [r'carpa', r'iglu']),
    ('hammer',        'Herramienta (martillo, pala)', [r'martillo', r'\bmazo', r'\bpalas?\b', r'jardiner']),
    ('blade',         'Navaja / hacha / sierra', [r'navaja', r'cuchillo', r'hacha', r'sierra']),
    ('fire',          'Fuego / fósforos',     [r'fosforo', r'yesca', r'encendedor', r'vela']),
    ('logs',          'Leños / troncos',      [r'leno', r'lena\b', r'tronco']),
    ('natural',       'Material natural',     [r'\bramas?\b', r'\bramitas?\b', r'\bhojas? secas', r'\bhojas\b(?! bond| de papel| cuadriculad)',
                                               r'piedra', r'tierra', r'semilla', r'arcilla', r'flores', r'arena',
                                               r'elementos del parque']),
    ('food',          'Alimentos (harina, masa)', [r'harina', r'\bmasa\b', r'\bpan\b', r'fruta']),
    ('camp_gear',     'Equipo de campamento', [r'aislante', r'\bropa\b', r'saco de dormir', r'objetos de campamento']),
    ('stool',         'Taburete / asiento',   [r'taburete', r'\bsillas?\b', r'\bbanco\b']),
    ('music',         'Música / palmas',      [r'musica', r'palmas']),
    ('soap',          'Jabón',                [r'jabon']),
    ('sack',          'Bolsa / saco',         [r'\bbolsas?\b', r'\bsacos?\b', r'costal']),
    ('blanket',       'Manta / lona / tela',  [r'manta', r'\blona', r'\btela\b', r'sabana', r'toalla']),
    ('stopwatch',     'Cronómetro / reloj',   [r'cronometro', r'\breloj']),
    ('flashlight',    'Linterna',             [r'linterna']),
    ('mirror',        'Espejo',               [r'espejo']),
    ('carabiner',     'Mosquetón',            [r'mosqueton']),
    ('uniform',       'Prenda / insignia',    [r'camisa', r'insignia']),
    ('none',          'Sin materiales',       [r'sin materiales', r'ninguno']),
]

MATERIAL_LABELS = {k: lbl for k, lbl, _ in MATERIAL_RULES}

# Palabras de relleno que no son materiales: no cuentan como "no reconocido"
FILLER = re.compile(r'^(|etc|para delimitar|de muestra|de colores|opcional|por patrulla|por equipo|scouts?)$')

_NUMBER_WORDS = {'un': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5, 'seis': 6, 'ocho': 8, 'diez': 10, 'doce': 12}


def _quantity(segment_norm: str, match_start: int):
    """Cantidad al inicio del segmento ("4 pañoletas"), salvo que el material esté entre paréntesis
    ("20 objetos variados (brújula…": el 20 es de los objetos, no de las brújulas)."""
    if '(' in segment_norm[:match_start]:
        return None
    m = re.match(r'\s*(\d+)\b', segment_norm)
    if m:
        return int(m.group(1))
    m = re.match(r'\s*(\w+)\b', segment_norm)
    return _NUMBER_WORDS.get(m.group(1)) if m else None


def split_materials(materials: str):
    """Corta el texto en segmentos ("4 pañoletas", "tiza o conos para delimitar")."""
    parts = re.split(r',|;|\.(?!\d)|\by\b|\be\b|\+', materials or '')
    return [p.strip() for p in parts if p and p.strip()]


def detect_materials(materials: str):
    """Devuelve (detectados, no_reconocidos). Detectados: [{kind, label, qty, text}], sin duplicar kind."""
    found = {}
    unmatched = []
    for segment in split_materials(materials):
        seg_norm = normalize(segment)
        hits = []
        for k, lbl, pats in MATERIAL_RULES:
            starts = [m.start() for p in pats for m in [re.search(p, seg_norm)] if m]
            if starts:
                hits.append((k, lbl, min(starts)))
        if not hits:
            if not FILLER.match(seg_norm.strip(' ()')):
                unmatched.append(segment)
            continue
        # La cantidad ("2 cuerdas…") es del primer material nombrado en el fragmento
        first = min(start for _, _, start in hits)
        for k, lbl, start in hits:
            if k not in found:
                qty = _quantity(seg_norm, start) if start == first else None
                found[k] = {'kind': k, 'label': lbl, 'qty': qty, 'text': segment}
    return list(found.values()), unmatched


# ---------------------------------------------------------------------------
# OBJETOS VISIBLES EN LA ESCENA (materiales + reglas)
# ---------------------------------------------------------------------------
# El campo "materiales" es el kit base del día (compartido por los juegos A## y T## de la misma
# semana); las reglas describen cómo se usa en ESTE juego. Por eso los objetos que nombran las
# reglas van primero, y luego los del kit que las reglas no mencionan.

# Tipos que no se dibujan como objeto en el suelo (o no aportan a la escena)
NOT_VISIBLE = {'none', 'music', 'soap', 'uniform', 'pen'}


def detect_visible_props(materials: str, rules: str):
    """[{kind, label, qty, source}] ordenado: primero lo que nombran las reglas (source 'rules' o 'both')."""
    from_materials, _ = detect_materials(materials)
    from_rules = []
    rules_norm = normalize(rules)
    for k, lbl, pats in MATERIAL_RULES:
        if k in NOT_VISIBLE:
            continue
        if any(re.search(p, rules_norm) for p in pats):
            from_rules.append(k)

    by_kind = {m['kind']: m for m in from_materials}
    result = []
    for k in from_rules:
        base = by_kind.get(k)
        result.append({'kind': k, 'label': MATERIAL_LABELS[k], 'qty': base['qty'] if base else None,
                       'source': 'both' if base else 'rules'})
    for m in from_materials:
        if m['kind'] in NOT_VISIBLE or m['kind'] in from_rules:
            continue
        result.append({'kind': m['kind'], 'label': m['label'], 'qty': m['qty'], 'source': 'materials'})
    return result


# ---------------------------------------------------------------------------
# ACTIVIDAD (qué se HACE en el juego, dentro de su tipo de escena)
# ---------------------------------------------------------------------------
# La escena base da la estructura (columnas de relevo, rincones de taller…); la actividad define
# la acción concreta que muestra la coreografía. Gana la primera regla que coincide (orden importa).

RELAY_TASKS = [
    ('circuit',       ['circuito', 'perimetr', 'marcha ritmica']),
    ('collect',       ['recogiendo', 'residuos', 'rally ecologico']),
    ('wash_hands',    ['lava las manos', 'lavarse las manos']),
    ('splint',        ['luxacion', 'cabestrillo', 'inmoviliz']),
    ('rescue_rope',   ['se lanza una cuerda', 'as de guia']),
    ('greet',         ['saludar', 'saluda al', 'saludo']),
    ('memorize_draw', ['memoriza', 'croquis', 'dibuja', 'pizarra', 'cifrad', 'descifr']),
    ('measure',       ['triangulacion', 'graduado', 'medir la altura']),
    ('animal_move',   ['imitando', 'desplazamiento y sonido']),
    ('fetch_item',    ['traer', 'trae un', 'buscar un']),
    ('place_piece',   ['colocar una pieza', 'coloca una pieza', 'colocar un objeto', 'deposita', 'clavar una ramita']),
    ('tie_knot',      ['nudo', 'amarre', 'atar', ' ata ', 'templar', 'ballestrinque', 'tripode', 'travesano',
                       'vuelta de escota', 'desata']),
]

RIG_MECHANICS = [
    ('queen_chair',    ['silla de la reina', 'silla de cuatro manos']),
    ('human_bridge',   ['cruza sobre los brazos', 'brazos entrelazados']),
    ('tug_cross',      ['cruz de cuerdas', 'jalan de los 4']),
    ('staff_twist',    ['hacer girar la vara', 'sujetan un bordon']),
    ('drag_weight',    ['arrastrar', 'traccion']),
    ('tightrope',      ['soga tensa', 'cuerda floja', 'margarita']),
    ('backpack_fit',   ['cinturon lumbar', 'correas de hombros', 'ergonomic']),
    ('knot_together',  ['una sola mano', 'entre todos los integrantes']),
    ('hang_backpacks', ['colgar mochilas']),
]

ACTIVITY_DEFAULTS = {'relay': 'round_flag', 'stress_test_rig': 'hang_load'}

# Resto de los grupos: (actividad, frases). Sin coincidencia → None (coreografía base del grupo).
GROUP_ACTIVITIES = {
    'cartography_table': [
        ('talking_stick',      ['baston de hablar']),
        ('closing_ceremony',   ['clausura', 'estampillas']),
        ('rights_tree',        ['derechos']),
        ('golden_book',        ['libro de oro']),
        ('totem_council',      ['grito oficial', 'lema']),
        ('mime',               ['escenifica', 'mimodrama']),
        ('card_hunt',          ['tarjetas graficas', 'busca la tarjeta']),
        ('camp_plan',          ['plano de campamento', 'campamento ideal']),
        ('visor_estimate',     ['visera']),
        ('compass_azimuth',    ['azimut']),
        ('obstacle_90',        ['girando 90', 'obstaculo a 90']),
        ('double_step',        ['doble paso', 'dobles pasos']),
        ('tree_triangulation', ['triangulacion']),
        ('tape_check',         ['medida real']),
        ('topo_map',           ['cotas', 'topografico']),
        ('park_sketch',        ['croquis', 'trazar el perimetro']),
        ('morse_signal',       ['morse', 'puntos cortos']),
        ('secret_mission',     ['mision secreta', 'regar jardines']),
    ],
    'circle': [
        ('relay_greet_cones',  ['saludo scout reglamentario']),
        ('relay_safety_circle', ['circulo de seguridad', 'gira 360']),
        ('compass_rose_star',  ['formacion de estrella']),
        ('compass_rose_swap',  ['intercambiar posiciones']),
        ('torch_pass',         ['linterna', 'farol']),
        ('whistle_signals',    ['toques de silbato', 'llamada de guias']),
        ('badger',             ['saquito']),
        ('kick_stool',         ['taburete']),
        ('square_circles',     ['cuerdas al cuello']),
        ('rooster_fight',      ['pata coja']),
        ('talking_ball',       ['balones parlantes', 'balon diciendo']),
        ('people_to_people',   ['gente a gente']),
        ('freeze_ball',        ['pies quietos']),
    ],
    'stealth': [
        ('sleeping_pirate',    ['pirata']),
        ('whistle_blind',      ['pitador']),
        ('sentinel_whistle',   ['vigilante']),
        ('flag_defense',       ['panoletas a la cintura', '4 banderines']),
        ('blind_mute_pairs',   ['mensajero ciego', 'mudo']),
        ('trail_signs',        ['sendero de 5 pistas', 'pistas naturales']),
        ('footprint_analysis', ['arenero', 'huellas de perros']),
        ('blind_triangle',     ['triangulo equilatero', 'triangulo ciego']),
        ('kim_game',           ['kim']),
        ('trail_laying',       ['traza una pista', 'trazado de pistas']),
    ],
    'chain': [
        ('bucket_chain',       ['de mano en mano', 'linea de extincion']),
        ('yarn_web',           ['ovillo']),
        ('human_knot',         ['ojos cerrados']),
        ('human_knot_troop',   ['manos cruzadas']),
        ('human_boats',        ['barcas', 'barca de remos']),
    ],
    'territory': [
        ('bulldog',            ['bulldog']),
        ('cribol',             ['cribol']),
        ('circle_conquest',    ['manos en la espalda', 'conquista del circulo']),
    ],
    'station': [
        ('fog_boats',          ['barcos', 'timonel']),
        ('tail_snakes',        ['serpiente', 'atrapando la cola']),
    ],
    'pioneering_tripod': [
        ('axe_area',           ['area de hachero']),
        ('semaphore_tower',    ['semaforo']),
        ('mast_anchor',        ['mastil']),
        ('water_tripod',       ['suspender una olla', 'transporte de agua']),
        ('washstand',          ['lavamanos']),
        ('latrine',            ['letrina']),
        ('trash_tripod',       ['basurero']),
    ],
    'seed_bomb_craft': [
        ('banner_care',        ['cintas de merito', 'banderin']),
        ('tool_demo',          ['sierra de arco', 'taller de demostracion']),
        ('park_cleanup',       ['piedras peligrosas', 'jardineras']),
        ('herbarium',          ['herbario']),
        ('tradition_fair',     ['danza', 'feria de tradiciones']),
        ('wali_board',         ['wali', 'tablero']),
    ],
    'campfire_cooking': [
        ('kindling_sort',      ['yesca']),
        ('mirror_mime',        ['espejo']),
        ('fire_build',         ['montaje de una fogata', 'sin fosforos']),
        ('skit',               ['skit']),
    ],
    'ground_mosaic': [
        ('park_detective',     ['detective']),
        ('leaf_hunt',          ['especies']),
        ('footprint_cast',     ['huella', 'calcar']),
        ('constellation',      ['cruz del sur', 'constelaciones']),
    ],
    'first_aid_stretcher': [
        ('woggle_sling',       ['pasador']),
        ('kit_inventory',      ['inventario']),
        ('cold_ground',        ['tierra fria']),
        ('stretcher_build',    ['camilla']),
    ],
    'tent_assembly': [
        ('knife_safety',       ['cortaplumas']),
    ],
}

# Objetivo dentro de una tarea de relevo: qué hay en el destino (define la pieza que se dibuja).
TASK_TARGETS = {
    'tie_knot': [
        ('tree',     ['a un arbol']),
        ('cross',    ['cruzados a 90']),
        ('shears',   ['forma de x', 'tijera']),
        ('tripod',   ['tripode', 'piramide']),
        ('crossbar', ['travesano', 'soportes fijos']),
        ('stakes',   ['estaca', 'vientos de carpa']),
        ('rope_join', ['dos cuerdas', 'unirlas']),
        ('ring',     ['anillo']),
    ],
    'place_piece': [
        ('pattern',  ['flor de lis', 'pieza']),
        ('backpack', ['mochila']),
        ('sundial',  ['sombra']),
        ('pot',      ['maceta', 'semilla']),
    ],
    'memorize_draw': [
        ('board',  ['pizarra', 'croquis']),
        ('fist',   ['nudillos', 'puno']),
        ('cipher', ['cifrad', 'clave']),
    ],
}


def _first_match(rules_table, text):
    for kind, phrases in rules_table:
        if any(p in text for p in phrases):
            return kind
    return None


def detect_activity(archetype: str, focal_prop, name: str, rules: str):
    """Actividad concreta del juego dentro de su escena (o None si su escena aún no tiene variantes)."""
    text = normalize(f"{name} {rules}")
    if archetype == 'relay':
        task = _first_match(RELAY_TASKS, text) or ACTIVITY_DEFAULTS['relay']
        target = _first_match(TASK_TARGETS.get(task, []), text)
        return f"{task}:{target}" if target else task
    if focal_prop == 'stress_test_rig':
        return _first_match(RIG_MECHANICS, text) or ACTIVITY_DEFAULTS['stress_test_rig']
    group = focal_prop if archetype == 'station' and focal_prop else archetype
    return _first_match(GROUP_ACTIVITIES.get(group, []), text)
