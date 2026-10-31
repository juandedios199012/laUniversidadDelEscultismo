# Juegos3D

Simulador de dinámicas grupales con personas en 3D (three.js + @react-three/fiber), marcha y carrera realistas y controles Flipbook. Migrado desde la app independiente en Next.js.

- **Entrada:** `Juegos3DPage.tsx`, cargada con `lazy()` desde `src/App.tsx` (tab `juegos-3d`, menú *Actividades → Juegos 3D*, permiso `programa_semanal`).
- **Estilos:** `juegos3d.css`, importado desde `src/index.css`. El tema oscuro queda aislado en el contenedor `.juegos3d`.
- **Motor:** `engine/` (coreografías por arquetipo, sin dependencias de React), `components/three/` (escena 3D).
- **Catálogo:** `data/games.json` (120 juegos) generado desde `catalog-source/banco_maestro_scout-v6.xlsx`:

```bash
python3 scripts/juegos3d/export_catalog_to_json.py   # Excel → data/games.json
python3 scripts/juegos3d/report_catalog_mapping.py   # data/catalog_mapping_report.csv
```

Identificadores y textos de la interfaz son genéricos (equipo, líder, competidor); solo el contenido del catálogo se muestra tal cual viene del Excel.
