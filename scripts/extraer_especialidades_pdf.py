#!/usr/bin/env python3
"""
Extractor Completo de Especialidades del PDF v2
================================================
Extrae automáticamente todas las especialidades con:
- Nombre
- Área
- Exploración (viñetas separadas)
- Taller (viñetas separadas)
- Desafío (viñetas separadas)

MEJORAS v2:
- Detecta viñetas correctamente (terminan en punto)
- Une líneas cortadas del PDF
- Genera descripción única (no duplica exploración)
- Separa cada viñeta con " • " para mejor legibilidad

USO:
    python3 scripts/extraer_especialidades_pdf.py

REQUISITOS:
    pip install pdfplumber
"""

import re
import sys
from pathlib import Path
from datetime import date
from typing import Optional, List, Dict

try:
    import pdfplumber
except ImportError:
    print("❌ Instala pdfplumber: pip install pdfplumber")
    sys.exit(1)


# ============================================================
# ESPECIALIDADES ACTUALES EN BASE DE DATOS
# ============================================================
ESPECIALIDADES_BD = {
    "ciencia": [
        "Aeromodelismo", "Agricultura", "Agrimensor", "Albañilería", 
        "Antropología", "Arqueología", "Arquitectura", "Astronomía",
        "Aviación", "Carpintería", "Cartografía", "Climatología",
        "Cocina", "Cocina de Campamento", "Cocina sin Utensilios",
        "Contabilidad", "Contramaestre", "Costura", "Criptografía",
        "Dibujo Técnico", "Electricidad", "Electrónica", "Encuadernación",
        "Energía Eólica", "Energía Hidráulica", "Energía Solar",
        "Fotografía", "Geografía", "Geología", "Herrería", "Informática",
        "Maquetismo", "Mecánica", "Meteorología", "Plomería", "Química",
        "Radio Operador",
    ],
    "naturaleza": [
        "Acecho", "Actividades Agropecuarias", "Apicultura", "Avicultura",
        "Botánica", "Campismo", "Ecología", "Entomología", "Excursionismo",
        "Exploración Forestal", "Guardabosque", "Herpetología", "Horticultura",
        "Jardinería", "Navegación", "Observación de la Naturaleza",
        "Orientación y Topografía", "Ornitología", "Pionerismo",
        "Pionerismo Mayor", "Protección de Animales", "Rastreo", "Reciclaje",
        "Remo", "Supervivencia", "Supervivencia en la Costa",
        "Supervivencia en la Montaña", "Supervivencia en la Selva",
        "Vida Silvestre", "Zoología",
    ],
    "arte": [
        "Bordado", "Cerámica", "Coleccionismo", "Danza", "Decoración",
        "Dibujo", "Escenografía", "Escultura", "Filatelia",
        "Folklore y Tradiciones", "Fotografía Artística", "Genealogía",
        "Guardián de Leyendas", "Guitarra", "Música", "Numismática",
        "Oratoria", "Periodismo", "Pintura", "Teatro", "Tejer", "Traducción",
    ],
    "deportes": [
        "Ajedrez", "Andinismo", "Arquería", "Atletismo", "Básquet", "Buceo",
        "Ciclismo", "Defensa Personal", "Equitación", "Escalada", "Fútbol",
        "Gimnasia", "Karate", "Levantamiento de Pesas", "Natación",
        "Patinaje", "Tenis", "Vóleibol",
    ],
    "servicio": [
        "Guía Turístico", "Intérprete", "Primeros Auxilios", "Socorrista",
    ],
    "institucional": [],
}


def normalizar(texto: str) -> str:
    """Normaliza texto para comparación."""
    texto = texto.lower().strip()
    for old, new in {"á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ñ": "n"}.items():
        texto = texto.replace(old, new)
    return texto


def limpiar_texto_sql(texto: str) -> str:
    """Limpia texto para SQL."""
    texto = texto.strip()
    texto = re.sub(r'\s+', ' ', texto)
    texto = texto.replace("'", "''")
    return texto


def detectar_area(texto: str) -> Optional[str]:
    """Detecta si una línea indica un cambio de área."""
    patterns = {
        "ciencia": r"ÁREA\s+DE\s+CIENCIA|CIENCIA\s+Y\s+TECNOLOG[ÍI]A",
        "naturaleza": r"ÁREA\s+DE\s+(?:VIDA\s+EN\s+LA\s+)?NATURALEZA|NATURALEZA\s+Y\s+MEDIO",
        "arte": r"ÁREA\s+DE\s+ARTE|ARTE.*EXPRESI[ÓO]N|EXPRESI[ÓO]N\s+Y\s+CULTURA",
        "deportes": r"ÁREA\s+DE\s+DEPORTES?",
        "servicio": r"ÁREA\s+DE\s+SERVICIO",
        "institucional": r"ÁREA\s+INSTITUCIONAL",
    }
    for area, pattern in patterns.items():
        if re.search(pattern, texto, re.IGNORECASE):
            return area
    return None


def es_titulo_especialidad(linea: str) -> bool:
    """Detecta si una línea es el título de una especialidad."""
    linea = linea.strip()
    if not linea:
        return False
    
    # Ignorar secciones y palabras clave
    palabras_ignorar = [
        "EXPLORACIÓN", "TALLER", "DESAFÍO", "ÁREA", "PÁGINA", "ÍNDICE",
        "RAMA SCOUT", "MANUAL", "ASOCIACIÓN", "SCOUTS DEL PERÚ",
        "IMPORTANTE", "NOTA", "ANEXO", "PRE-REQUISITO", "REQUISITO"
    ]
    linea_upper = linea.upper()
    for palabra in palabras_ignorar:
        if palabra in linea_upper:
            return False
    
    # Debe ser mayúsculas, longitud razonable, pocas palabras
    if linea.isupper() and 3 <= len(linea) <= 50:
        palabras = linea.split()
        if 1 <= len(palabras) <= 6:
            # Verificar que no sea solo números o símbolos
            if re.search(r'[A-ZÁÉÍÓÚÑ]', linea):
                return True
    
    return False


def unir_lineas_cortadas(lineas: List[str]) -> List[str]:
    """
    Une líneas que fueron cortadas en el PDF.
    Una línea está cortada si:
    - No termina en punto, paréntesis, etc.
    - La siguiente no empieza con mayúscula (inicio de nueva oración)
    """
    if not lineas:
        return []
    
    resultado = []
    buffer = ""
    
    for linea in lineas:
        linea = linea.strip()
        if not linea:
            continue
        
        # Ignorar líneas de paginación
        if re.match(r'^Página\s+\d+\s+de\s+\d+$', linea):
            continue
        
        if buffer:
            # Verificar si esta línea es continuación
            terminadores = '.?!:)'
            buffer_termina = buffer[-1] in terminadores if buffer else False
            linea_continua = linea[0].islower() if linea else False
            
            if not buffer_termina and linea_continua:
                # Es continuación
                buffer = buffer + " " + linea
            else:
                # No es continuación, guardar buffer anterior
                resultado.append(buffer)
                buffer = linea
        else:
            buffer = linea
    
    if buffer:
        resultado.append(buffer)
    
    return resultado


def extraer_vinetas(texto: str) -> List[str]:
    """
    Extrae viñetas individuales de un bloque de texto.
    Cada viñeta termina en punto (o similar).
    """
    if not texto:
        return []
    
    # Primero unir líneas cortadas
    lineas = texto.split('\n')
    lineas_unidas = unir_lineas_cortadas(lineas)
    
    # Ahora separar por punto seguido de espacio o fin
    texto_unido = ' '.join(lineas_unidas)
    texto_unido = re.sub(r'\s+', ' ', texto_unido).strip()
    
    # Dividir por puntos que terminan oraciones
    vinetas = []
    oraciones = re.split(r'(?<=[.?!)])\s+(?=[A-ZÁÉÍÓÚÑ])', texto_unido)
    
    for oracion in oraciones:
        oracion = oracion.strip()
        if oracion and len(oracion) > 5:
            vinetas.append(oracion)
    
    return vinetas


def extraer_especialidades_pdf(pdf_path: str) -> List[Dict]:
    """
    Extrae todas las especialidades del PDF con sus fases.
    """
    especialidades = []
    
    print(f"\n📖 Leyendo PDF: {pdf_path}")
    
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        total_pages = len(pdf.pages)
        
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            full_text += text + "\n"
            if (i + 1) % 20 == 0:
                print(f"   Procesando página {i + 1}/{total_pages}...")
        
        print(f"   ✅ {total_pages} páginas procesadas")
    
    # Procesar el texto línea por línea
    lineas = full_text.split("\n")
    current_area = None
    current_especialidad = None
    current_section = None
    section_buffer = []
    
    for linea in lineas:
        linea_strip = linea.strip()
        
        # 1. Detectar cambio de área
        area = detectar_area(linea_strip)
        if area:
            # Guardar especialidad anterior
            if current_especialidad and current_section and section_buffer:
                vinetas = extraer_vinetas('\n'.join(section_buffer))
                current_especialidad[current_section] = vinetas
                if current_especialidad.get("exploracion") or current_especialidad.get("taller"):
                    especialidades.append(current_especialidad)
            
            current_area = area
            current_especialidad = None
            current_section = None
            section_buffer = []
            print(f"   📂 Área: {area.upper()}")
            continue
        
        # 2. Detectar secciones
        if linea_strip in ["Exploración:", "Exploración"]:
            if current_especialidad and current_section and section_buffer:
                vinetas = extraer_vinetas('\n'.join(section_buffer))
                current_especialidad[current_section] = vinetas
            current_section = "exploracion"
            section_buffer = []
            continue
        
        if linea_strip in ["Taller:", "Taller"]:
            if current_especialidad and current_section and section_buffer:
                vinetas = extraer_vinetas('\n'.join(section_buffer))
                current_especialidad[current_section] = vinetas
            current_section = "taller"
            section_buffer = []
            continue
        
        if linea_strip in ["Desafío:", "Desafío"]:
            if current_especialidad and current_section and section_buffer:
                vinetas = extraer_vinetas('\n'.join(section_buffer))
                current_especialidad[current_section] = vinetas
            current_section = "desafio"
            section_buffer = []
            continue
        
        # 3. Detectar nueva especialidad
        if es_titulo_especialidad(linea_strip) and current_area:
            # Guardar especialidad anterior
            if current_especialidad and current_section and section_buffer:
                vinetas = extraer_vinetas('\n'.join(section_buffer))
                current_especialidad[current_section] = vinetas
                if current_especialidad.get("exploracion") or current_especialidad.get("taller"):
                    especialidades.append(current_especialidad)
            
            nombre = linea_strip.title()
            current_especialidad = {
                "nombre": nombre,
                "area": current_area,
                "exploracion": [],
                "taller": [],
                "desafio": []
            }
            current_section = None
            section_buffer = []
            continue
        
        # 4. Acumular contenido
        if current_section and linea_strip:
            if not re.match(r'^Página\s+\d+\s+de\s+\d+$', linea_strip):
                section_buffer.append(linea_strip)
    
    # Guardar última especialidad
    if current_especialidad and current_section and section_buffer:
        vinetas = extraer_vinetas('\n'.join(section_buffer))
        current_especialidad[current_section] = vinetas
        if current_especialidad.get("exploracion") or current_especialidad.get("taller"):
            especialidades.append(current_especialidad)
    
    return especialidades


def filtrar_faltantes(especialidades: List[Dict]) -> List[Dict]:
    """Filtra solo las especialidades que no están en la BD."""
    bd_normalizado = set()
    for area, lista in ESPECIALIDADES_BD.items():
        for nombre in lista:
            bd_normalizado.add(normalizar(nombre))
    
    faltantes = []
    for esp in especialidades:
        if normalizar(esp["nombre"]) not in bd_normalizado:
            faltantes.append(esp)
    
    return faltantes


def generar_descripcion(esp: Dict) -> str:
    """
    Genera una descripción única para la especialidad.
    No repite el texto de exploración.
    """
    nombre = esp["nombre"]
    area = esp["area"]
    
    descripciones_area = {
        "ciencia": f"Especialidad de Ciencia y Tecnología sobre {nombre}.",
        "naturaleza": f"Especialidad de Vida en la Naturaleza sobre {nombre}.",
        "arte": f"Especialidad de Arte, Expresión y Cultura sobre {nombre}.",
        "deportes": f"Especialidad deportiva de {nombre}.",
        "servicio": f"Especialidad de Servicio a los Demás sobre {nombre}.",
        "institucional": f"Especialidad Institucional de {nombre}.",
    }
    
    return descripciones_area.get(area, f"Especialidad de {nombre}.")


def formatear_vinetas_sql(vinetas: List[str]) -> str:
    """
    Formatea lista de viñetas para SQL.
    Separa con ' • ' para legibilidad.
    """
    if not vinetas:
        return ""
    
    vinetas_limpias = []
    for v in vinetas:
        v = limpiar_texto_sql(v)
        if v and len(v) > 3:
            vinetas_limpias.append(v)
    
    return " • ".join(vinetas_limpias)


def generar_sql(especialidades: List[Dict], output_path: str) -> int:
    """Genera archivo SQL con INSERTs completos."""
    
    lines = [
        "-- ================================================================",
        "-- ESPECIALIDADES EXTRAÍDAS DEL PDF - COMPLETAS v2",
        f"-- Fecha: {date.today()}",
        "-- Fuente: Manual de Especialidades Rama Scout 2021",
        "-- ================================================================",
        "-- Cada viñeta está separada por ' • '",
        "-- Revisar antes de ejecutar en producción",
        "-- ================================================================",
        "",
        "-- ================================================================",
        "-- FUNCIÓN AUXILIAR (crear si no existe)",
        "-- ================================================================",
        "CREATE OR REPLACE FUNCTION _insertar_especialidad(",
        "    p_codigo VARCHAR,",
        "    p_nombre VARCHAR,",
        "    p_area_codigo VARCHAR,",
        "    p_descripcion TEXT,",
        "    p_exploracion TEXT,",
        "    p_taller TEXT,",
        "    p_desafio TEXT",
        ")",
        "RETURNS VOID AS $$",
        "DECLARE",
        "    v_area_id UUID;",
        "BEGIN",
        "    SELECT id INTO v_area_id FROM areas_especialidad WHERE codigo = p_area_codigo;",
        "    ",
        "    IF v_area_id IS NULL THEN",
        "        RAISE NOTICE 'Área % no encontrada, saltando especialidad %', p_area_codigo, p_nombre;",
        "        RETURN;",
        "    END IF;",
        "    ",
        "    INSERT INTO especialidades (codigo, nombre, area_id, descripcion, exploracion, taller, desafio)",
        "    VALUES (p_codigo, p_nombre, v_area_id, p_descripcion, p_exploracion, p_taller, p_desafio)",
        "    ON CONFLICT (codigo) DO UPDATE SET",
        "        nombre = EXCLUDED.nombre,",
        "        area_id = EXCLUDED.area_id,",
        "        descripcion = EXCLUDED.descripcion,",
        "        exploracion = EXCLUDED.exploracion,",
        "        taller = EXCLUDED.taller,",
        "        desafio = EXCLUDED.desafio,",
        "        updated_at = CURRENT_TIMESTAMP;",
        "END;",
        "$$ LANGUAGE plpgsql;",
        "",
        "-- ================================================================",
        "-- INSERTAR ESPECIALIDADES",
        "-- ================================================================",
        "DO $$",
        "BEGIN",
        ""
    ]
    
    por_area = {}
    for esp in especialidades:
        area = esp["area"]
        if area not in por_area:
            por_area[area] = []
        por_area[area].append(esp)
    
    total = 0
    for area, lista in sorted(por_area.items()):
        lines.append(f"    -- ============================================")
        lines.append(f"    -- {area.upper()} ({len(lista)} especialidades)")
        lines.append(f"    -- ============================================")
        lines.append("")
        
        for esp in sorted(lista, key=lambda x: x["nombre"]):
            total += 1
            
            codigo = esp["nombre"].lower().replace(" ", "-")
            for old, new in {"á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ñ": "n"}.items():
                codigo = codigo.replace(old, new)
            codigo = re.sub(r'[^a-z0-9-]', '', codigo)[:30]
            
            nombre = limpiar_texto_sql(esp["nombre"])
            descripcion = limpiar_texto_sql(generar_descripcion(esp))
            exploracion = formatear_vinetas_sql(esp.get("exploracion", []))
            taller = formatear_vinetas_sql(esp.get("taller", []))
            desafio = formatear_vinetas_sql(esp.get("desafio", []))
            
            lines.append(f"    -- {esp['nombre']}")
            lines.append(f"    PERFORM _insertar_especialidad(")
            lines.append(f"        '{codigo}',")
            lines.append(f"        '{nombre}',")
            lines.append(f"        '{area}',")
            lines.append(f"        '{descripcion}',")
            lines.append(f"        '{exploracion}',")
            lines.append(f"        '{taller}',")
            lines.append(f"        '{desafio}'")
            lines.append(f"    );")
            lines.append("")
    
    lines.extend([
        "    RAISE NOTICE '✅ Especialidades insertadas correctamente';",
        "END $$;",
        "",
        f"-- ================================================================",
        f"-- Total: {total} especialidades",
        f"-- ================================================================",
    ])
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))
    
    return total


def main():
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent
    pdf_path = project_dir / "archive" / "Manual-de-Especialidades-Rama-Scout-2021-1.pdf"
    output_all = project_dir / "database" / "XX_todas_especialidades_pdf.sql"
    output_faltantes = project_dir / "database" / "XX_especialidades_faltantes_completas.sql"
    
    print("\n" + "=" * 60)
    print("🔍 EXTRACTOR DE ESPECIALIDADES DEL PDF v2")
    print("=" * 60)
    
    if not pdf_path.exists():
        print(f"\n❌ No se encontró: {pdf_path}")
        sys.exit(1)
    
    # 1. Extraer todas las especialidades
    todas = extraer_especialidades_pdf(str(pdf_path))
    print(f"\n📋 ESPECIALIDADES EXTRAÍDAS: {len(todas)}")
    
    por_area = {}
    for esp in todas:
        area = esp["area"]
        if area not in por_area:
            por_area[area] = []
        por_area[area].append(esp["nombre"])
    
    for area, nombres in sorted(por_area.items()):
        print(f"   • {area.upper()}: {len(nombres)}")
    
    # 2. Filtrar faltantes
    faltantes = filtrar_faltantes(todas)
    print(f"\n⚠️  FALTANTES EN BD: {len(faltantes)}")
    
    if faltantes:
        for esp in sorted(faltantes, key=lambda x: (x["area"], x["nombre"]))[:15]:
            num_exp = len(esp.get("exploracion", []))
            num_tal = len(esp.get("taller", []))
            num_des = len(esp.get("desafio", []))
            print(f"   [{esp['area'][:3].upper()}] {esp['nombre']} (E:{num_exp} T:{num_tal} D:{num_des})")
        if len(faltantes) > 15:
            print(f"   ... y {len(faltantes) - 15} más")
    
    # 3. Generar SQL
    print("\n" + "-" * 60)
    
    count_all = generar_sql(todas, str(output_all))
    print(f"📝 SQL todas: {output_all.name} ({count_all} especialidades)")
    
    if faltantes:
        count_falt = generar_sql(faltantes, str(output_faltantes))
        print(f"📝 SQL faltantes: {output_faltantes.name} ({count_falt} especialidades)")
    
    print("\n" + "=" * 60)
    print("✅ Extracción completada")
    print("=" * 60)
    
    # Mostrar ejemplo
    if faltantes:
        print("\n📄 Ejemplo de especialidad extraída:")
        ejemplo = next((e for e in faltantes if e["nombre"] == "Balón Mano"), faltantes[0])
        print(f"   Nombre: {ejemplo['nombre']}")
        print(f"   Área: {ejemplo['area']}")
        print(f"   Exploración ({len(ejemplo.get('exploracion', []))} viñetas):")
        for i, v in enumerate(ejemplo.get('exploracion', [])[:3], 1):
            print(f"      {i}. {v[:80]}...")
        print(f"   Taller ({len(ejemplo.get('taller', []))} viñetas):")
        for i, v in enumerate(ejemplo.get('taller', [])[:3], 1):
            print(f"      {i}. {v[:80]}...")
        print(f"   Desafío ({len(ejemplo.get('desafio', []))} viñetas):")
        for v in ejemplo.get('desafio', [])[:2]:
            print(f"      • {v[:80]}...")
    
    print()


if __name__ == "__main__":
    main()
