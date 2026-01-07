# 🎯 Instrucciones para Implementar las Plantillas DNGI-03

## ✅ PASOS COMPLETADOS

1. ✔️ Carpeta creada: `/public/templates/dngi03/`
2. ✔️ Código actualizado: `DNGI03Template.tsx` usa imágenes como fondo
3. ✔️ Servidor reiniciado

## 📋 LO QUE NECESITAS HACER

### 1. Guardar las imágenes en la carpeta correcta

Desde tu Finder (macOS), navega a:
\`\`\`
/Users/juandediosbaudazio/Documents/source/GrupoScoutLima12/laUniversidadDelEscultismo/public/templates/dngi03/
\`\`\`

### 2. Convierte las imágenes que me enviaste a PNG

Guárdalas con estos **nombres exactos**:

- `page1.png` → La imagen 1 que me enviaste (Datos del Miembro Juvenil)
- `page2.png` → La imagen 2 que me enviaste (Datos de los Padres)
- `page3.png` → La imagen 3 que me enviaste (Declaraciones)
- `page4.png` → La imagen 4 que me enviaste (Firma y huella)

### 3. Cómo convertir desde Word a PNG

**Opción A: Desde Word/Google Docs**
1. Abre el documento Word
2. Archivo → Guardar como → Formato: PNG
3. Selecciona "Todas las páginas"

**Opción B: Screenshot (más rápido)**
1. Abre el documento Word en pantalla completa
2. Presiona `Cmd + Shift + 4` → Espacio → Clic en la ventana
3. Guarda con el nombre correspondiente

**Opción C: Desde PDF**
1. Guarda el Word como PDF
2. Abre el PDF en Vista Previa
3. Archivo → Exportar → Formato: PNG

### 4. Verifica que las imágenes estén en el lugar correcto

Deberías ver esta estructura:
\`\`\`
public/
  templates/
    dngi03/
      README.md
      page1.png  ← AQUÍ
      page2.png  ← AQUÍ
      page3.png  ← AQUÍ
      page4.png  ← AQUÍ
\`\`\`

### 5. Prueba el PDF

1. Ve a tu aplicación
2. Navega al módulo de Reportes o Registro Scout
3. Genera el PDF DNGI-03
4. ¡Debería verse exactamente como tu plantilla!

## 🔧 AJUSTAR POSICIONES (Si es necesario)

Si los datos no aparecen en los lugares correctos, edita el archivo:
\`src/modules/reports/templates/pdf/DNGI03Template.tsx\`

Busca los estilos como:
\`\`\`tsx
apellidosCompletos: {
  position: 'absolute',
  top: 310,    // ← Ajusta este número
  left: 60,    // ← Ajusta este número
  width: 260,
  fontSize: 10,
}
\`\`\`

- `top`: Mueve arriba/abajo (en pixeles desde arriba)
- `left`: Mueve izquierda/derecha (en pixeles desde la izquierda)

## ❓ ¿PROBLEMAS?

Si las imágenes no aparecen:
1. Verifica que los nombres sean exactos (minúsculas, sin espacios)
2. Verifica que sean PNG (no JPG, no JPEG)
3. Reinicia el servidor: `npm run dev`
4. Limpia caché del navegador: `Cmd + Shift + R`

## 📞 SIGUIENTE PASO

Cuando tengas las imágenes listas, avísame y:
1. Pruebo el PDF contigo
2. Ajustamos las posiciones si es necesario
3. Agregamos más campos dinámicos que necesites
