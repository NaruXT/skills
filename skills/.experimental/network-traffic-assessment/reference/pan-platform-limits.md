# Límites de capacidad por plataforma (PAN-OS)

Referencia para el check **Platform Capacity / Config Size** (uso vs. máximo soportado:
reglas de seguridad, objetos de dirección, zonas, sesiones, entradas ARP/MAC, rutas).

> Documento vivo — extender según nuevos modelos/versiones que aparezcan en assessments reales.

## 1. Método preferido: leer el límite directamente del dispositivo (TSF)

PAN-OS expone sus propios límites de configuración vía un comando operacional. Si el
Tech Support File incluye su salida, **este es el dato correcto a usar** — es específico
del modelo, la versión de PAN-OS y el modo (multi-vsys o no) de ESE equipo, y no requiere
ninguna tabla externa.

- Comando: `> show system state filter cfg.general.max*`
- Formato de salida: pares `cfg.general.max-<recurso>: <valor>`, por ejemplo:
  ```
  cfg.general.max-address: 10000
  cfg.general.max-address-group: 1000
  cfg.general.max-address-per-group: 500
  cfg.general.max-arp: 20480
  cfg.general.max-policy-rule: 20000
  cfg.general.max-appid-pkts: 65536
  cfg.general.max-blacklist: 25000
  ```
- Búsqueda en el TSF: el bloque empieza en el prompt `> show system state filter cfg.general.max*`
  y termina en el siguiente prompt `>` (misma convención que el resto de comandos operacionales,
  ver `tsf-source-map.md`).
- Uso: cruzar cada `cfg.general.max-<recurso>` con el conteo real ya resuelto en otra sección
  del informe (ej. `max-policy-rule` vs. total de reglas de seguridad de la sección 8, `max-address`
  vs. total de objetos de dirección de Security Policies Evaluation, `max-arp` vs. entradas ARP
  de Network Evaluation).
  Reportar solo si el uso está en un rango que amerite atención (ej. >80% del máximo) — no listar
  todos los recursos si están holgados.

**Si el TSF no incluye este comando, no inventar el límite.** Omitir el check de "% de capacidad
usada" en silencio (consistente con la regla de oro del skill) — se puede seguir reportando el
conteo absoluto (ej. "1,662 objetos de dirección definidos") sin el porcentaje de saturación.

## 2. Referencia aproximada (fallback, solo para contexto — NO usar como límite exacto)

Cifras de rendimiento/sesiones publicadas en datasheets oficiales, verificadas por búsqueda web
en 2026. Sirven para dar contexto de la categoría del equipo (entry-level / mid-range / high-end),
**no como techo preciso de objetos/reglas** — esos límites dependen de la versión de PAN-OS y
pueden cambiar entre releases (ver ejemplo real: PA-5220 pasó de 80 a 2,500 zonas de seguridad
entre PAN-OS 8.0 y 8.1). Para el dato exacto, usar siempre el método 1.

| Modelo | Sesiones concurrentes (máx.) | Sesiones nuevas/seg | Throughput firewall |
|---|---|---|---|
| PA-440 | ~200,000–340,000 (según fuente) | ~39,000 | 2.6 Gbps |
| PA-460 | ~400,000 | ~74,000 | — |
| PA-3220 | — (no confirmado con precisión) | — | SSL-decrypt sostenido ~1.8 Gbps con threat prevention |
| PA-5220 | ~32,000,000 | ~600,000 | SSL-decrypt sostenido ~10 Gbps |
| PA-5250 | ~65,000,000 | ~600,000 | — |

Fuentes: [PA-5200 Series Datasheet](https://www.paloaltonetworks.com/resources/datasheets/pa-5200-series-specsheet),
[PA-400 Series Datasheet](https://www.paloaltonetworks.com/resources/datasheets/pa-400-series),
[PA-5220 security zones capacity change (KB)](https://knowledgebase.paloaltonetworks.com/KCSArticleDetail?id=kA10g000000PLvuCAG),
[Command to Display System Limits (KB)](https://knowledgebase.paloaltonetworks.com/KCSArticleDetail?id=kA10g000000CldiCAC).

## 3. Cómo extender esta tabla

Cuando trabajes un assessment de un modelo no listado arriba, y el TSF sí incluya
`show system state filter cfg.general.max*`, no hace falta tocar este archivo — el dato
sale directo del equipo. Solo actualiza la sección 2 (fallback) si te interesa dejar
registro del rendimiento nominal del modelo para referencia futura.
