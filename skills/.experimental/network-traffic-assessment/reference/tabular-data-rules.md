# Datos completos, no solo el comando — detalle y justificación

El `SKILL.md` tiene la regla operativa corta ("default: tabla completa" + la
whitelist cerrada de tres excepciones). Esto es el resto del razonamiento:
por qué la whitelist es así, y cómo no confundirla con otro tipo de check.

## Default: tabla completa

Si el comando/tag citado en un check devuelve más de un elemento
(procesos, filesystems, archivos, sensores, pools, categorías de log, reglas...), el check lleva
la tabla de datos **completa** — todas las filas, no una muestra, no un resumen en prosa. Esto
no es un juicio caso por caso: es el comportamiento por defecto para **todo** check con salida
tabular, salvo los tres que están en la whitelist del `SKILL.md`. Si un check nuevo no está ni
en la whitelist ni ya clasificado en `system-health-checklist.md`, **asume tabla completa** —
nunca lo contrario.

## Por qué la whitelist es esa y no otra

Verificado contra el PDF de referencia (págs. 64-65): ahí el total ya es el dato completo — no
hay una fila individual que un especialista necesite verificar por separado. Esta whitelist es
intencionalmente cerrada: si dudas si un check nuevo califica para ella, la respuesta es que no
— repórtalo con tabla completa y, si de verdad resulta ser un check de solo-totales, agrégalo
al `SKILL.md` explícitamente para la próxima vez (no lo asumas en el momento).

## No confundir con checks de valor único

CPU/memoria management/dataplane, sesiones activas, throughput, Jumbo Frames: ahí no hay tabla
que omitir — el comando ya devuelve un solo valor o un par de valores, y ese valor completo es
lo que se reporta inline en Device/Observación. La whitelist es para comandos que sí devuelven
una lista y aun así se resumen; esto es distinto — no hay nada que resumir porque nunca hubo una
lista.

## Formato de la tabla

Para un check de tabla completa, esta va inmediatamente después de **Device / Observación**,
como tabla Markdown (o `data_table` en el JSON del Paso 5) — **no** como bloque de texto plano
pegado del TSF (una tabla limpia es más legible que el output crudo del PDF de referencia, y
sigue siendo igual de completa). Columnas por check — ver `system-health-checklist.md` (Software
process status, Disk space, Files Core Dump, Environmental system, Dataplane pool statistics,
Disk Log Usage, NAT Mapping) y `best-practices-checklist.md`/`heuristics.md` para el resto
(certificados, administradores, licencias, interfaces, reglas, etc. — varios de estos ya se
generaban como tabla completa antes de esta regla, sin problema).
