# Checklist de Migracion: Objetivos por Grupo

Fecha: 7 de mayo de 2026

## Alcance

- Etapa scout individual se mantiene: PISTA, SENDA, RUMBO, TRAVESIA.
- Solo objetivos educativos se agrupan en:
1. PISTA_SENDA
2. RUMBO_TRAVESIA

## 1. Pre-ejecucion

- [ ] Confirmar backup de BD reciente.
- [ ] Confirmar que existen tablas base de progresion.
- [ ] Registrar linea base de conteos:

```sql
SELECT ep.codigo AS etapa, COUNT(*) AS objetivos
FROM objetivos_educativos oe
JOIN etapas_progresion ep ON ep.id = oe.etapa_id
WHERE oe.estado = 'ACTIVO'
GROUP BY ep.codigo, ep.orden
ORDER BY ep.orden;

SELECT COUNT(*) AS progreso_total,
       COUNT(*) FILTER (WHERE completado = TRUE) AS progreso_completado
FROM progreso_scout;
```

## 2. Ejecucion

- [ ] Ejecutar [database/progresion/06_migracion_objetivos_por_grupo.sql](database/progresion/06_migracion_objetivos_por_grupo.sql).
- [ ] Verificar salida final sin excepciones.

## 3. Verificacion funcional inmediata

- [ ] No hay objetivos sin grupo:

```sql
SELECT COUNT(*) AS objetivos_sin_grupo
FROM objetivos_educativos
WHERE etapa_objetivo_grupo_id IS NULL;
```

- [ ] Distribucion por grupo:

```sql
SELECT eog.codigo, COUNT(*) AS total
FROM objetivos_educativos oe
JOIN etapa_objetivos_grupo eog ON eog.id = oe.etapa_objetivo_grupo_id
WHERE oe.estado = 'ACTIVO'
GROUP BY eog.codigo
ORDER BY eog.codigo;
```

- [ ] Mapeo legacy consistente:

```sql
SELECT ep.codigo AS etapa_legacy, eog.codigo AS grupo_objetivo, COUNT(*) AS total
FROM objetivos_educativos oe
JOIN etapas_progresion ep ON ep.id = oe.etapa_id
JOIN etapa_objetivos_grupo eog ON eog.id = oe.etapa_objetivo_grupo_id
GROUP BY ep.codigo, eog.codigo, ep.orden
ORDER BY ep.orden;
```

Esperado:
- PISTA y SENDA -> PISTA_SENDA
- RUMBO y TRAVESIA -> RUMBO_TRAVESIA

## 4. Verificacion de no regresion de progreso

- [ ] Conteos de progreso_scout no cambian antes/despues:

```sql
SELECT COUNT(*) AS progreso_total,
       COUNT(*) FILTER (WHERE completado = TRUE) AS progreso_completado
FROM progreso_scout;
```

- [ ] Muestreo de scouts mantiene objetivos completados:

```sql
SELECT ps.scout_id,
       COUNT(*) FILTER (WHERE ps.completado = TRUE) AS completados
FROM progreso_scout ps
GROUP BY ps.scout_id
ORDER BY completados DESC
LIMIT 20;
```

## 5. Integracion de backend/frontend (siguiente fase)

- [ ] Actualizar RPC para consultar objetivos por grupo.
- [ ] Mantener parametros legacy de etapa por compatibilidad temporal.
- [ ] Actualizar formularios admin para crear objetivo por grupo, no por etapa individual.

## 6. Rollback seguro

Si solo se ejecuto esta migracion y aun no se actualizo frontend/RPC:

```sql
BEGIN;

DROP VIEW IF EXISTS vw_objetivos_educativos_con_grupo;
DROP FUNCTION IF EXISTS obtener_grupo_objetivo_por_fecha_nacimiento(DATE);
DROP FUNCTION IF EXISTS obtener_grupo_objetivo_por_etapa_codigo(VARCHAR);

ALTER TABLE objetivos_educativos
DROP CONSTRAINT IF EXISTS fk_objetivos_etapa_objetivo_grupo;

DROP INDEX IF EXISTS idx_objetivos_grupo_area;
DROP INDEX IF EXISTS idx_objetivos_etapa_objetivo_grupo;

ALTER TABLE objetivos_educativos
DROP COLUMN IF EXISTS etapa_objetivo_grupo_id;

DROP TABLE IF EXISTS etapa_objetivos_grupo;

COMMIT;
```

## 7. Criterio de salida

- [ ] Migracion ejecutada sin errores.
- [ ] objetivos_sin_grupo = 0.
- [ ] Conteos de progreso sin alteracion.
- [ ] Equipo valida que etapa scout individual sigue intacta.
