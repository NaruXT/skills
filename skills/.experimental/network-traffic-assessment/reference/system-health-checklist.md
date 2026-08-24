# Checklist — Health Checks status (Salud y Capacidad del Sistema)

Checks de **salud operativa del equipo** (CPU, memoria, disco, procesos, sesiones, throughput),
distintos de los checks de arquitectura/segmentación (`heuristics.md`) y de postura de
seguridad (`best-practices-checklist.md`). Van dentro de la categoría "Health Checks status"
(ver `SKILL.md`, Paso 3).

Igual que los demás checklists del skill: es un **piso de referencia, no un techo** — si el
TSF trae un dato de salud/capacidad del sistema que no está en esta tabla, repórtalo igual si
es relevante para el cliente (ej. algo tan simple como `show system disk-space` no necesita
estar listado aquí para merecer un lugar en el informe). Si el dato no está en el TSF, omite
el check en silencio.

## Limitación importante a declarar en Health Checks status

El Tech Support File es una **foto de un único momento**, no una serie histórica. Para CPU,
memoria, sesiones activas y throughput, el informe solo puede reportar el valor puntual
capturado en el TSF — no una tendencia de días/semanas (eso requeriría Panorama/AIOps, fuera
de alcance). Deja esto explícito en la sección en vez de insinuar una tendencia que no puedes
sustentar con los datos disponibles.

## Referencias

Igual que en `best-practices-checklist.md`: la columna de Referencias solo se completa con
enlaces verificados. La mayoría de estos checks son comandos de diagnóstico operativo
(orientados a TAC), no "buenas prácticas" con documentación dedicada — no fuerces una
Referencia donde no la hay. Nunca inventes una URL.

## Checks de "inventario" — tabla de datos completa obligatoria (default, ver `SKILL.md`)

Ver `SKILL.md` › "Datos completos, no solo el comando": el default es tabla completa para todo
check con salida tabular — solo ARP/MAC table usage, Config Size y Routing summary están en la
whitelist cerrada de "solo totales". Los siguientes siete checks de esta categoría van con tabla
completa (el PDF de referencia los reproduce íntegros — págs. 67, 72-73, 95, 99, 100-101, 105-106
— cada proceso, cada filesystem, cada archivo, cada sensor, cada pool, cada categoría de log),
pero en este skill como tabla Markdown limpia (o `data_table` en el JSON del Paso 5 — ver
`render-docx-schema.md`) en vez de texto plano pegado del TSF:

- **Software process status**: una tabla por Slot/Role, columnas `Type | Name | State | Info
  (pid)`, con todas las filas Group + Process presentes en `show system software status` — no
  solo el primer slot.
- **Disk space**: una tabla con columnas `Filesystem | Size | Used | Avail | Use% | Mounted on`,
  una fila por cada línea de `show system disk-space` (una tabla por dispositivo si el TSF trae
  más de uno) — no una lista parcial de filesystems.
- **Files Core Dump**: una tabla con columnas `Directorio | Archivo | Tamaño | Fecha`, una fila
  por archivo encontrado en cada directorio que recorre `show system files`; directorio vacío →
  una fila con "(vacío)" en `Archivo`. No omitas ningún directorio que aparezca en el TSF.
- **Environmental system**: una tabla por bloque (`----Thermal----`/`----Fan Tray----`/
  `----Fans----`/`----Power----`), columnas `Slot | Description | Alarm | Valor | Min | Max`
  (ajusta el nombre de la columna "Valor" a Degrees C / RPMs / Volts según el bloque) — todos los
  sensores, no solo los que tienen `Alarm: True`.
- **Dataplane pool statistics**: una tabla para "Hardware Pools" (columnas `Pool | Used/Total |
  Address | Errors` o las que traiga el TSF) y otra para "Software Pools" — todas las filas de
  `debug dataplane pool statistics`, por más largas que sean ambas listas.
- **Disk Log Usage**: una tabla de `Quotas:` (columnas `Categoría | % | Tamaño | Expiration
  period`) y otra de `Disk usage:` (columnas `Categoría | Logs and Indexes | Current Retention`)
  — todas las categorías de log del TSF (traffic, threat, config, system, etc.), más el resumen
  agregado `Total: Allocated/Unallocated` aparte.
- **NAT Mapping**: además del inventario de reglas NAT (ya cubierto abajo), la tabla de
  utilización de cada IP Pool NAT dinámico (`show running ippool`/`show running global-ippool`)
  va completa — todas las reglas DIP/DIPP por VSYS, no solo un resumen agregado.

## Checklist

| Check | Criterio de salud esperado | Comando TSF | Recomendación si falla | Referencias |
|---|---|---|---|---|
| Software process status | Todos los procesos (por cada Slot/Role: mp, cp, dp0, dp1...) en estado `running`; iterar sobre todos los slots/roles presentes, no solo el primero. **Reportar la tabla completa de procesos** (ver sección de arriba), no solo el nombre del comando. | `show system software status` | Investigar el proceso caído (crash/config); reiniciar con `debug software restart process <name>`; si persiste, TAC | |
| Utilización CPU management plane | Sin umbral numérico universal; valor puntual del TSF. Sostenido alto (referencia informal, no oficial) sugiere revisar logging/reporting excesivo | `show system resources` | Identificar proceso culpable; reducir carga de syslog/reporting; considerar AIOps; TAC si persiste | |
| Utilización memoria management plane | Regla práctica: **investigar si ≥80%** (ej. procesos `logrcvr`, `reportd`, `configd`, `devsrvr` con consumo alto) | `show system resources` (`show system resources follow` para seguimiento) | Reiniciar proceso afectado o el management-server; limpiar versiones viejas de software en `/pan/repo`; TAC si ≥80% | |
| Utilización CPU dataplane | **>60% sostenido** sugiere problema de sizing de la plataforma (valor puntual del TSF, sin confirmar "sostenido" sin serie histórica — repórtalo como valor puntual, no como tendencia) | `show running resource-monitor` (inferido) | Evaluar sizing del appliance; revisar picos de inspección de contenido; considerar upgrade | |
| Sesiones activas | Comparar contra el máximo soportado por la plataforma (ver `pan-platform-limits.md` — `cfg.general.max-session` si el TSF lo trae, o el dato de `show session info`) | `show session info` | Si se acerca al máximo: revisar timeouts, anomalías de tráfico, o evaluar upgrade | |
| Firewall Throughput | Comparar contra el máximo del modelo (dato de datasheet, ver `pan-platform-limits.md` sección 2) | Sin comando único confiable en TSF — usar como referencia contadores de interfaz o `show running resource-monitor` si están presentes; si no hay dato claro, omitir el check en vez de estimar | Si se acerca al máximo del modelo: planificar upgrade o segmentar tráfico | |
| Dataplane pool statistics | Pools de hardware/software (packet buffers, SSH state, TCP host connections, etc.) sin agotamiento sostenido (Remaining cercano a 0). **Reportar la tabla completa de pools** (ver sección de arriba) — Hardware y Software, todas las filas, no solo las que están cerca del límite. | `debug dataplane pool statistics` | Correlacionar con el tipo de tráfico/feature que agota el pool; evaluar sizing o TAC | |
| Disk space | Uso de filesystems (`/`, `/opt/pancfg`, `/opt/panrepo`, `/opt/panlogs`, `/opt/panraid/ld1`, etc.). Sin umbral oficial en la fuente — usar como referencia de sentido común: preocupante >75-80%, crítico >90%. **Reportar la tabla completa de filesystems** (ver sección de arriba), no una lista parcial. | `show system disk-space` | Eliminar versiones de software/logs antiguos innecesarios; TAC si persiste alto | |
| Files Core Dump | Ausencia (o muy pocos/antiguos) de archivos core/crash recientes. **Reportar la tabla completa de directorios/archivos** (ver sección de arriba), incluyendo los directorios vacíos revisados — no solo el nombre del comando. | `show system files` | Si hay dumps recientes/recurrentes: abrir TAC aportando los archivos | |
| Disk Log Usage | Cuotas configuradas (`Quotas:`) vs. uso real (`Disk usage:`, con "Current Retention" en días) por categoría de log, **más el resumen agregado** (`Total: Allocated/Unallocated`, recomendado Unallocated > 9%). **Reportar la tabla completa de categorías** (ver sección de arriba), no solo traffic/threat — principalmente informativo, relevante si hay requisitos de retención/compliance. Es el mismo comando que "Logging and Reporting Settings" de `best-practices-checklist.md` (dentro de System Evaluation) — repórtalos juntos, no dupliques el check. | `show system logdb-quota` | Si la retención de logs críticos (traffic/threat) es insuficiente para auditoría: ajustar cuotas o usar almacenamiento externo (Panorama/Log Collector). Si Unallocated < 9%: revisar distribución de cuotas. | [How to Display Log Database Disk Space](https://knowledgebase.paloaltonetworks.com/KCSArticleDetail?id=kA10g000000Cld2CAC) |
| Jumbo Frames | Estado Enabled/Disabled — informativo, sin criterio de pass/fail fijo; depende del diseño de red | `show system setting jumbo-frame` (inferido) | Validar contra el requisito de MTU del diseño de red; sin recomendación estándar | |
| Environmental system (thermal/fan/power) | Sin alarmas (`Alarm: False`) en todos los sensores. **Reportar la tabla completa de sensores** (ver sección de arriba) — Thermal/Fan Tray/Fans/Power, todos los sensores, no solo un resumen de "sin alarmas". | `show system environmentals` | Si `Alarm: True` en algún sensor: contactar TAC | |
| MAC table usage | Entradas MAC actuales vs. máximo soportado por la plataforma (típico 128,000) | `show mac all` (mismos campos que ARP: total de entradas + máximo soportado) | Si se acerca al máximo: revisar segmentación L2, cantidad de VLANs/interfaces en el mismo dominio de broadcast | |
| ARP table usage — vs. máximo | Entradas ARP actuales vs. máximo soportado (además del detalle por interfaz ya cubierto en Network Evaluation) | `show arp all` — línea `maximum of entries supported` / `total ARP entries in table`; cruzar con `cfg.general.max-arp` si el TSF trae `show system state filter cfg.general.max*` (ver `pan-platform-limits.md`) | Si se acerca al máximo: mismo diagnóstico que MAC table usage | |
| Config Size | Tamaño del config fusionado vs. máximo soportado por plataforma | Tamaño de archivo del propio Backup XML/TSF entregado, o mensaje de log del mgmt-server sobre tamaño de config si aparece en el TSF | Limpieza de configuración no usada/duplicada (frecuente cuando hay push de Panorama + config local) | |

### Nat Mapping (subsección)

NAT no tiene sección propia en el informe — vive aquí porque, igual que ARP/MAC/Config Size,
es fundamentalmente un check de **capacidad/salud de recursos runtime**, no de diseño
arquitectónico (ver razonamiento completo: el check nativo de Palo Alto solo mide utilización
de pools NAT dinámicos contra el máximo de la plataforma, no la calidad del diseño NAT).
Combina dos fuentes:

| Check | Qué mide | Fuente | Recomendación si falla |
|---|---|---|---|
| Utilización de IP Pools NAT dinámicos | Used/Available de cada pool DIPP (Dynamic IP/Port) y Dynamic IP, por VSYS y a nivel global; "Mem Size Ratio" (oversubscription). **Reportar la tabla completa** — todas las reglas/pools de cada VSYS, no un resumen agregado. | **TSF** — `show running ippool` (por vsys), `show running global-ippool` (shared) | Si Used se acerca a Available: ampliar el pool o revisar el oversubscription ratio |
| Inventario de reglas NAT | Conteo de reglas por tipo (`static-ip`, `dynamic-ip`, `dynamic-ip-and-port`) y dirección (source NAT / destination NAT) | **XML** — `rulebase/nat/rules/entry`, tipo en `source-translation`/`destination-translation` | Informativo — usar como contexto de cuánta traducción de direcciones depende del equipo |
| Reglas NAT sin nombre descriptivo o aparentemente sin uso | Reglas con nombre genérico tipo "Rule 18/22/27..." — señal de higiene de configuración, mismo criterio que Security Rules Unused | **XML** (nombre) — el "sin uso" real (0 traducciones) requeriría TSF con contador de hits, que normalmente no está disponible; si no lo tienes, repórtalo solo por nombre genérico, no afirmes que está sin uso | Renombrar con convención descriptiva; revisar si sigue vigente |

Esta subsección queda enriquecida respecto a la fuente original (que solo reporta utilización
de pool) porque el inventario de reglas NAT sí es 100% derivable del Backup XML y aporta
contexto real — pero no inventes un contador de "hits" si el TSF no lo trae.

## Notas de implementación

- `show system software status` y `show system files` se reportan **por Slot/Role** — en
  equipos con múltiples dataplanes hay una sección por cada uno; recórrelas todas.
- Para estos siete checks de inventario, "Device / Observación" no lleva el resumen — la tabla de
  datos completa (ver "Checks de inventario" arriba) va inmediatamente después, como su propio
  bloque. Un check que solo nombra el comando (`show system software status` — Slot 1, Role mp)
  sin la tabla de procesos detrás no cumple el patrón.
- `show system logdb-quota` trae dos bloques (`Quotas:` config, `Disk usage:` uso real) —
  muéstralos juntos si reportas esta fila.
- Cruza hallazgos de esta sección con otras cuando el dato lo justifique (ej. memoria alta +
  3 servidores syslog configurados con uno apuntando a un resolver público) — pero el número
  en sí (uso de memoria) pertenece a Health Checks status, no a la lista de Recommendations
  priorizada, salvo que represente un riesgo real de disponibilidad.
