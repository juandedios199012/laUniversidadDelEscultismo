#!/usr/bin/env python3
"""
export_catalog_to_json.py
-------------------------
Exporta los 120 juegos y dinámicas del Excel del catálogo (hoja 'Catálogo de Juegos y Dinámicas')
hacia 'data/games.json', que la app Juegos3D importa con tipos (lib/catalog.ts).
El texto de cada juego se exporta tal cual está en el Excel.

Requisitos: pip install openpyxl
Uso (desde cualquier carpeta): python scripts/export_catalog_to_json.py [ruta_excel] [ruta_json_salida]
"""

import openpyxl
import json
import re
import os
import sys

# Detección de formación y materiales (reglas como datos, compartidas con el reporte de revisión)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalog_detection import detect_activity, detect_formation, detect_materials, detect_visible_props  # noqa: E402

def infer_archetype(game_id: str, name: str, formation: str, rules: str) -> str:
    """
    Clasifica automáticamente cada juego en uno de los 6 arquetipos cinemáticos
    del simulador táctico en Canvas / Next.js:
      1. chain     -> Cuncuna, cadena humana, tren, serpiente física
      2. territory -> Dos campos divididos, captura de bandera, frontera, prisioneros
      3. stealth   -> Acecho, sigilo, guardia ciego, cono de visión, juegos de sentidos/Kim
      4. circle    -> Formación en círculo grande, chicote, rondas, duelos centrales
      5. relay     -> Carreras en columnas paralelas, relevos por postas con testigos/pañoleta
      6. station   -> Taller técnico en rincón de patrulla, cabuyería, amarres, construcciones
    """
    text = f"{name} {formation} {rules}".lower()
    
    # 1. Cadena / Serpiente física
    if any(k in text for k in ['cuncuna', 'cadena', 'nudo humano', 'barcas humanas', 'ciempiés']):
        return 'chain'
    # 2. Territorio / Cancha dividida / Captura / Frontera
    if any(k in text for k in ['asalto a la bandera', 'frontera', 'bulldog', 'prisionero', 'cribol', 'conquista del círculo']):
        return 'territory'
    # 3. Acecho / Sigilo / Escucha / Visión / Kim / Rastreo
    # ('silbato' no cuenta: casi todos los juegos arrancan "al silbato"; 'kim' solo como palabra completa)
    if any(k in text for k in ['acecho', 'sigilo', 'ciego', 'olfato', 'oído', 'pitador', 'pirata dormido', 'huellas', 'pistas']) \
            or re.search(r'\bkim\b', text):
        return 'stealth'
    # 4. Gran Círculo / Rondas
    if any(k in text for k in ['círculo', 'circulo', 'chicote', 'rueda', 'ronda', 'pies quietos', 'balones parlantes', 'gente a gente']):
        return 'circle'
    # 5. Relevos / Carreras por postes / Columnas
    if any(k in text for k in ['relevo', 'relevos', 'columnas', 'carrera', 'posta', 'postas', 'marcha rítmica']):
        return 'relay'
    # 6. Estación / Proyecto de taller técnico por defecto
    return 'station'

# Elemento focal de cada juego de taller (solo arquetipo 'station'): define el objeto central
# de la escena 3D y las posturas. Puntaje = coincidencias en reglas y materiales + 5 por cada
# coincidencia en el nombre (el nombre describe mejor la actividad). Empate: gana el primero
# en el orden de esta tabla. Sin coincidencias: None (taller genérico por postas).
FOCAL_KEYWORDS = {
    'ground_mosaic': ['flor de lis', 'mosaico', 'hojas caídas', 'huellas', 'yeso', 'en el suelo', 'constelaci',
                      'detective', 'impecable', 'limpieza', 'recolecci', 'basura'],
    'stress_test_rig': ['rigidez', 'peso', 'mojadas', 'tracción', 'tijera pionera', 'soporte', 'nudo', 'amarre',
                        'cabuyer', 'cuerda floja', 'transporte', 'jalando', 'torciendo'],
    'pioneering_tripod': ['trípode', 'lavamanos', 'mástil', 'ballestrinque', 'cruz pionera', 'torre', 'hacha',
                          'hachero', 'pionerismo', 'letrina'],
    'first_aid_stretcher': ['camilla', 'vendaje', 'botiquín', 'primeros auxilios', 'lesionado', 'torcedura',
                            'hipotermia', 'tierra fría', 'emergencia'],
    'campfire_cooking': ['pan de cazador', 'fogata', 'yesca', 'leña', 'fuego', 'cocina'],
    'tent_assembly': ['carpa', 'estacas', 'vientos'],
    'cartography_table': ['croquis', 'brújula', 'mapa', 'cifrado', 'morse', 'libro de oro', 'derechos', 'consejo',
                          'tótem', 'ceremonia', 'clausura', 'cinta métrica', 'doble paso', 'visera', 'señales', 'triangulaci', 'obstáculo a 90',
                          'misión secreta', 'ley'],
    'seed_bomb_craft': ['bombas de semillas', 'siembra', 'herbario', 'banderín', 'pintado', 'pintura', 'tablero',
                        'feria', 'tradiciones', 'mimodrama', 'demostración'],
}

NAME_WEIGHT = 5

def infer_focal_prop(name: str, rules: str, materials: str):
    name_l = name.lower()
    body_l = f"{rules} {materials}".lower()
    score = {
        k: sum(body_l.count(w) + NAME_WEIGHT * name_l.count(w) for w in words)
        for k, words in FOCAL_KEYWORDS.items()
    }
    best = max(score.values())
    if best == 0:
        return None
    return next(k for k in FOCAL_KEYWORDS if score[k] == best)

def export_excel_to_json(excel_path: str, output_json_path: str):
    if not os.path.exists(excel_path):
        print(f"❌ Error: No se encontró el archivo de origen: {excel_path}")
        print("   Asegúrate de colocar 'banco_maestro_scout-v6.xlsx' en la misma carpeta o indicar su ruta.")
        sys.exit(1)

    print(f"📖 Abriendo libro de trabajo: {excel_path}...")
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    
    sheet_name = 'Catálogo de Juegos y Dinámicas'
    if sheet_name not in wb.sheetnames:
        print(f"❌ Error: La hoja '{sheet_name}' no existe en el libro.")
        print(f"   Hojas disponibles: {wb.sheetnames}")
        sys.exit(1)
        
    ws = wb[sheet_name]
    
    # Los datos comienzan en la fila 5 (las 4 primeras son títulos y encabezados)
    rows = list(ws.iter_rows(min_row=5, values_only=True))
    catalog = []
    archetypes_count = {}
    areas_count = {}

    for row in rows:
        if not row or not row[0]:
            continue
            
        gid, name, source, block, week, area, obj_ps, obj_rt, formation, materials, rules, inclusion = row[:12]
        
        arch = infer_archetype(str(gid), str(name), str(formation), str(rules))
        archetypes_count[arch] = archetypes_count.get(arch, 0) + 1
        
        area_str = str(area or "Sin área").strip()
        areas_count[area_str] = areas_count.get(area_str, 0) + 1
        
        # Extraer número de semana si aplica
        week_num = None
        if week and 'Semana' in str(week):
            m = re.search(r'Semana\s*(\d+)', str(week))
            if m:
                week_num = int(m.group(1))

        game_id = str(gid).strip()
        focal = infer_focal_prop(str(name), str(rules), str(materials)) if arch == 'station' else None
        # Categoría por prefijo del ID: JUE-A (Juegos Activos), JUE-T (Desafíos Técnicos), JUE-C (Clásicos)
        m_cat = re.match(r'JUE-([ATC])', game_id)

        catalog.append({
            "id": game_id,
            "category": m_cat.group(1) if m_cat else "A",
            "name": str(name).strip(),
            "source": str(source or "").strip(),
            "block": str(block or "").strip(),
            "week": str(week or "").strip(),
            "week_number": week_num,
            "area": area_str,
            "archetype": arch,
            "focal_prop": focal,
            "activity": detect_activity(arch, focal, str(name), str(rules)),
            "objectives": {
                "ages_11_12": str(obj_ps or "").strip(),
                "ages_13_15": str(obj_rt or "").strip()
            },
            "formation": str(formation or "").strip(),
            "formation_detected": detect_formation(str(formation or "")),
            "materials": str(materials or "").strip(),
            **dict(zip(("materials_detected", "materials_unmatched"), detect_materials(str(materials or "")))),
            "rules": str(rules or "").strip(),
            "visible_props": detect_visible_props(str(materials or ""), str(rules or "")),
            "inclusion": str(inclusion or "").strip()
        })

    # Crear carpeta de salida si no existe
    out_dir = os.path.dirname(os.path.abspath(output_json_path))
    os.makedirs(out_dir, exist_ok=True)
    
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    file_size_kb = os.path.getsize(output_json_path) / 1024
    print(f"\n✅ ¡Exportación completada con éxito!")
    print(f"📁 Archivo generado: {output_json_path} ({file_size_kb:.1f} KB)")
    print(f"🎯 Total de juegos exportados: {len(catalog)}")
    
    print("\n📊 Distribución por Arquetipos Tácticos:")
    for arch, count in sorted(archetypes_count.items()):
        print(f"   • {arch.upper():<10}: {count} juegos")
        
    focals = {}
    for g in catalog:
        if g["archetype"] == 'station':
            v = g["focal_prop"] or 'genérico'
            focals[v] = focals.get(v, 0) + 1
    print("\n🔧 Elemento focal de los talleres:")
    for v, count in sorted(focals.items()):
        print(f"   • {v:<20}: {count} juegos")

    print("\n📊 Distribución por Áreas:")
    for ar, count in sorted(areas_count.items()):
        print(f"   • {ar:<15}: {count} juegos")

if __name__ == "__main__":
    # Rutas por defecto relativas a la raíz del proyecto (funciona desde cualquier carpeta)
    # scripts/juegos3d/ → raíz del repo → src/modules/juegos3d
    root = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "src", "modules", "juegos3d")
    excel_default = os.path.join(root, "catalog-source", "banco_maestro_scout-v6.xlsx")
    json_default = os.path.join(root, "data", "games.json")
    
    excel_arg = sys.argv[1] if len(sys.argv) > 1 else excel_default
    json_arg = sys.argv[2] if len(sys.argv) > 2 else json_default
    
    export_excel_to_json(excel_arg, json_arg)