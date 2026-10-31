#!/usr/bin/env python3
"""
report_catalog_mapping.py
-------------------------
Reporte de revisión: qué formación y qué materiales detectó la exportación en cada juego.
Lee data/games.json (generado por export_catalog_to_json.py) y escribe:
  - data/catalog_mapping_report.csv  → para abrir en Excel (separador ';', UTF-8 con BOM)
  - un resumen en la terminal (totales y casos a revisar)

Uso: python3 scripts/report_catalog_mapping.py
"""

import csv
import json
import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalog_detection import MATERIAL_LABELS, formation_modifier_labels  # noqa: E402

# scripts/juegos3d/ → raíz del repo → src/modules/juegos3d
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'src', 'modules', 'juegos3d')
GAMES = os.path.join(ROOT, 'data', 'games.json')
OUT = os.path.join(ROOT, 'data', 'catalog_mapping_report.csv')


def size_text(size):
    if not size:
        return ''
    if 'width_m' in size:
        return f"{size['width_m']:g} x {size['depth_m']:g} m"
    if 'diameter_m' in size:
        return f"Ø {size['diameter_m']:g} m"
    return f"{size['length_m']:g} m"


def materials_text(detected):
    return ', '.join(f"{m['label']}{f' ×{m[chr(113)+chr(116)+chr(121)]}' if m['qty'] else ''}" for m in detected)


def main():
    games = json.load(open(GAMES, encoding='utf-8'))
    rows = []
    for g in games:
        f = g['formation_detected']
        rows.append({
            'ID': g['id'],
            'Juego': g['name'],
            'Escena (tipo)': g['archetype'] + (f" / {g['focal_prop']}" if g.get('focal_prop') else ''),
            'Formación (Excel)': g['formation'],
            'Formación detectada': f['label'],
            'Tamaño': size_text(f['size']),
            'Detalles formación': ', '.join(formation_modifier_labels(f['modifiers'])),
            'Materiales (Excel)': g['materials'],
            'Materiales detectados': materials_text(g['materials_detected']),
            'NO reconocido': ' | '.join(g['materials_unmatched']),
            'Revisar': 'SÍ' if g['materials_unmatched'] or f['kind'] == 'unknown' else '',
        })

    with open(OUT, 'w', encoding='utf-8-sig', newline='') as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()), delimiter=';')
        writer.writeheader()
        writer.writerows(rows)

    forms = Counter(g['formation_detected']['label'] for g in games)
    mats = Counter(m['label'] for g in games for m in g['materials_detected'])
    to_review = [r for r in rows if r['Revisar']]
    print(f"📄 Reporte: {OUT}")
    print(f"\n🧭 Formaciones detectadas ({len(forms)} tipos):")
    for label, n in forms.most_common():
        print(f"   {n:3}  {label}")
    print(f"\n🧰 Materiales detectados ({len(mats)} tipos, {sum(mats.values())} menciones):")
    for label, n in mats.most_common():
        print(f"   {n:3}  {label}")
    print(f"\n⚠️  Juegos a revisar: {len(to_review)} de {len(rows)}")
    for r in to_review:
        print(f"   {r['ID']}  no reconocido → {r['NO reconocido']}")


if __name__ == '__main__':
    main()
