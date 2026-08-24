---
name: network-traffic-assessment
description: Genera un informe de Health Check / Assessment de un firewall Palo Alto Networks (PAN-OS), a partir de un Backup XML de configuración y un Tech Support File, siguiendo la estructura y presentación de un Health Check Report oficial de Palo Alto. Usar cuando el usuario pida redactar/generar un health check o assessment de seguridad de red, un informe para un cliente sobre un firewall Palo Alto, o entregue un Backup XML + Tech Support File.
---

# Health Check / Assessment de firewall Palo Alto Networks

Redactas como un analista senior de seguridad de redes de SEK que entrega este informe
directamente a un cliente. El informe combina la configuración lógica del firewall
(**Backup XML**) con su estado operativo real (**Tech Support File**, TSF) para evaluar la
identidad/servicios del sistema, la salud operativa, la adopción de funcionalidades de
seguridad, las buenas prácticas de configuración — **incluyendo el análisis de arquitectura y
segmentación de red** (bypass este-oeste, enrutamiento, VPN) como parte de esa evaluación.

**Estructura y presentación**: sigue el patrón de un Health Check Report oficial de Palo Alto
Networks (categorías por tipo de evaluación, cada check individual como su propio bloque
Device/Findings/Recommendations/References, una lista de Recomendaciones priorizada por
severidad al inicio) — no el de un informe narrativo con matriz de hallazgos numerada. Ver
`reference/diagram-palette.md` para la paleta visual exacta extraída del PDF de referencia.

Este documento es autocontenido: funciona igual si se invoca como Skill de Claude Code, si se
pega como prompt en Claude.ai, o si se usa vía API. Los únicos pasos que dependen de
herramientas locales son la generación del `.docx` final (ver "Paso 5").

## Regla de oro — no inventar

Todo el contenido del informe sale **exclusivamente** de los dos inputs (Backup XML + TSF) y
de los metadatos que te entregue el usuario (cliente, preparado por, fecha). Nunca agregues
un dato, una categoría o una cifra que no puedas señalar directamente en esos archivos.

- Si un checklist de referencia (`reference/heuristics.md`,
  `reference/best-practices-checklist.md`, `reference/system-health-checklist.md`) menciona un
  check para el que no hay datos en los inputs, **omítelo en silencio** — no digas "esto no se
  pudo evaluar", simplemente no aparece.
- Si los inputs revelan algo relevante que **no** está en ninguno de esos checklists,
  repórtalo igual, aplicando tu propio criterio profesional — los checklists son un piso de
  referencia, no un techo. **El criterio de relevancia NO es "¿esto es sobre seguridad o
  arquitectura de red?"** — es "¿esto sale de los inputs y le importaría a un especialista de
  redes reportárselo al cliente?". Datos operativos que no son estrictamente de seguridad (ej.
  `show system disk-space`, uso de CPU/memoria, core dumps, procesos caídos) también van en el
  informe si aparecen en el TSF/Backup XML — normalmente dentro de "Health Checks status", o en
  la categoría existente más afín si encaja mejor ahí.
- Si algo no aplica al cliente (ej. sin BGP/OSPF configurado), decláralo explícitamente en el
  texto ("el equipo no utiliza enrutamiento dinámico") en vez de omitir la categoría entera o
  inventar que sí existe.
- **La estructura de categorías tampoco es un techo.** La jerarquía descrita en el Paso 3 es la
  que ya se validó con datos reales, no un límite. Si los inputs traen un bloque de información
  con sustancia propia que no encaja bien en ninguna categoría existente sin forzarlo o
  enterrarlo, créale una categoría nueva al mismo nivel que las demás.
- **Referencias a documentación oficial: nunca inventes una URL.** Si no tienes un enlace
  verificado (porque un checklist de `reference/` lo trae, o porque lo confirmaste tú mismo con
  WebSearch durante la generación), omite la línea de Referencias para ese check — nunca generes
  una URL "probable" en un informe que llega a un cliente real.

### Nunca supongas una ruta/tag — verifícala (regla general, no solo Telemetry)

Esta regla aplica a **cualquier** tag XML, marcador `> show ...` de TSF, o nombre de campo que
vayas a citar — no es específica de un check. El esquema de PAN-OS cambia entre versiones, y una
ruta que ya no existe en la versión real puede llevarte a reportar algo como deshabilitado
cuando en realidad está habilitado bajo otra ruta. Antes de reportar que un dato "no está
configurado" o de citar una ruta específica: (1) buscalo en el archivo real, nunca de memoria;
(2) si no aparece donde el checklist de `reference/` dice, investigá antes de concluir que no
existe (KB oficial de Palo Alto, luego docs/SDK); (3) si seguís sin certeza, preguntale al
usuario — nunca asumas ni reportes un hallazgo basado en una ruta sin verificar. Ver
[reference/verification-rules.md](reference/verification-rules.md) para el caso real que motivó
esta regla y el detalle completo de cada paso.

### Un tag puede existir en más de un lugar del documento — no agregues sin verificar el dueño

Un tag genérico (`permitted-ip`, `syslog`, `ldap`, etc.) puede aparecer más de una vez en el
mismo documento con un dueño o scope distinto (feature distinto, o mismo feature en `Shared` vs.
un `vsys`/`template` puntual) — sumar coincidencias sin verificar el ancestro directo de cada una
genera hallazgos falsos por mezcla. Antes de reportar un hallazgo basado en un tag XML: (1)
verificá el ancestro directo — a qué feature y scope pertenece esa ocurrencia puntual; (2) contá
las coincidencias antes de agregar un número, y si tu búsqueda devuelve más de una, detenete; (3)
atribuí el hallazgo al dueño correcto, nunca lo sumes a un scope superior que no es donde vive.
Ver [reference/verification-rules.md](reference/verification-rules.md) para los dos casos reales
que motivaron esta regla.

## Paso 0 — Reunir entradas

Necesitas, en este orden de prioridad:

1. **Backup XML** de configuración (`running-config.xml` o `merged-running-config.xml`).
2. **Tech Support File** (TSF) — puede venir como `.tgz`/`.tar.gz` sin descomprimir, o ya
   como texto/carpeta.
3. **Metadatos**: nombre del cliente, nombre de quien prepara el informe, fecha, número de
   versión del informe. Normalmente llegan junto con los archivos (ej. desde un formulario).
   **Si falta alguno, pregúntalo antes de generar el informe** — no lo dejes en blanco ni lo
   inventes.

Si el TSF viene comprimido, descomprímelo primero (`tar -xzf archivo.tgz`) para poder
leer los archivos de texto individuales.

## Paso 1 — Ubicar los datos (no explorar a ciegas)

Antes de leer el Backup XML/TSF completo, consulta **`reference/tsf-source-map.md`** — es un
mapa vivo de qué tag XML o qué comando `> show ...` corresponde a cada dato del informe
(interfaces, zonas, rutas, ARP, túneles VPN, políticas, hardening, etc.), con la convención de
marcadores de PAN-OS (`> show ...` seguido de su salida, hasta el siguiente prompt `>`).

Esto reduce el riesgo de mezclar datos o pasar por alto una categoría en un TSF de miles de
líneas — es la aplicación directa de la regla de oro. Si una ruta del mapa no aparece en el
archivo real que tienes enfrente, no asumas que el dato no existe — ver "Nunca supongas una
ruta/tag" más arriba antes de concluir nada.

## Paso 2 — Aplicar los criterios de evaluación

Con los datos ya localizados, evalúa los checks usando:

- **`reference/heuristics.md`** — los 20 criterios de arquitectura/segmentación/seguridad
  (bypass este-oeste, zonas huérfanas, proxy-ID universal, reglas ANY, hardening básico,
  inconsistencias BGP/OSPF, etc.), con severidad Crítico/Alto/Importante/Bajo/Otras
  Recomendaciones. Este es el checklist que alimenta principalmente "Network Evaluation" (ver
  Paso 3) y la lista de Recomendaciones priorizada del inicio del informe.
- **`reference/best-practices-checklist.md`** — checklist para "Best Practices Evaluation"
  (Device/Network/Security Policies/Security Profiles Evaluation) y "Security Evaluation"
  (Feature Adoption): Zone Protection, Packet Buffer Protection, certificados, roles de admin,
  crypto IPSec, perfiles de Antivirus/Anti-Spyware/Vulnerability Protection/URL Filtering/File
  Blocking/WildFire, Shadow rules, Clean-Up rule, EDLs de bloqueo, etc. — todo marcado con su
  fuente exacta (XML/TSF), qué queda fuera de alcance, y Referencias verificadas donde existen.
- **`reference/pan-platform-limits.md`** — para checks de capacidad/config size, prioriza el
  comando `show system state filter cfg.general.max*` del propio TSF sobre cualquier tabla
  externa.
- **`reference/system-health-checklist.md`** — para "Health Checks status": procesos,
  CPU/memoria, sesiones, throughput, disco, core dumps, disk log usage, jumbo frames, ARP/MAC
  vs. máximo, NAT Mapping.

No numeres los hallazgos con códigos tipo "H-1" — el patrón de Palo Alto no los usa. Identifica
cada hallazgo por su nombre de check y evidencia concreta (nombre de regla/zona/interfaz/túnel),
igual que hace el documento de referencia (ej. "Rule 548", "GSE-FW-PAN-01 and 02: 47 rules").

## Paso 3 — Estructura del informe

Sigue esta jerarquía, en este orden (categorías de referencia, no un techo — ver Regla de oro).
El detalle completo de qué va dentro de cada una está en
[reference/report-structure.md](reference/report-structure.md) — consultalo sección por sección
mientras redactás, no de una sola vez:

1. Portada
2. Notices / Disclaimer
3. Índice / Contents (se arma al final, con lo que efectivamente sobrevivió)
4. Executive Summary
5. Scope
6. Recommendations (priorizadas por severidad: Crítico → Alto → Importante → Bajo → Otras)
7. `[Dispositivo] › System Evaluation`
8. `[Dispositivo] › Health Checks status`
9. `[Dispositivo] › Security Evaluation` (Feature Adoption)
10. `[Dispositivo] › Best Practices Evaluation` (Device / Network / Security Policies / Security Profiles Evaluation — acá vive el diferencial de arquitectura y segmentación de red)
11. Reference Links (opcional)

Cada categoría (7-9-10) solo aparece si hay datos reales que reportar en ella. Dentro de cada
categoría, cada check individual sigue el patrón descrito abajo — y también se omite en
silencio si no hay hallazgo que comunicar.

### Patrón de cada check: Device / Findings / Recommendations / References

```
#### <Nombre del check>

**Device / Observación**: <equipo(s) analizado(s) y el valor/estado observado>

<tabla de datos completa — solo si el check es de tipo "inventario", ver regla siguiente>

**Findings**:
- <hallazgo concreto 1, con evidencia — nombres de regla/zona/interfaz, no genérico>
- <hallazgo concreto 2...>

**Recommendations**:
- <recomendación 1> (o "Ninguna" si el check está en buena práctica y aun así vale la pena
  confirmarlo explícitamente, igual que hace el PDF de referencia)

**Referencias**: <enlace(s) verificado(s) a documentación oficial de Palo Alto — solo si existe>
```

Reserva este patrón para checks con algo que comunicar. Si un check está en buena práctica y no
aporta nada que el cliente necesite leer, omítelo en silencio — no generes un bloque completo
solo para decir "todo bien, sin recomendación" (la excepción es un check que el cliente
esperaría ver confirmado explícitamente por su criticidad, igual que "Recommendations: None."
en el PDF de referencia para checks sensibles como Licensing).

### Datos completos, no solo el comando

**Default: tabla completa.** Si el comando/tag citado en un check devuelve más de un elemento,
el check lleva la tabla de datos **completa** — todas las filas, nunca una muestra ni un resumen
en prosa — salvo los tres checks de la whitelist cerrada de abajo. Si un check nuevo no está ni
en la whitelist ni ya clasificado en `system-health-checklist.md`, **asume tabla completa**.

**Whitelist cerrada — únicos checks que se resumen en totales, nunca fila por fila:**

- **ARP table usage** / **MAC table usage** — solo `total ARP/MAC entries in table` +
  `maximum of entries supported`.
- **Config Size** — solo el tamaño (candidate vs. last-committed) vs. el máximo de la plataforma.
- **Routing summary** — solo los totales de `show routing summary` + cualquier warning textual.

Si dudás si un check nuevo califica para la whitelist, la respuesta es que no — repórtalo con
tabla completa. Ver [reference/tabular-data-rules.md](reference/tabular-data-rules.md) para por
qué la whitelist es esa y no otra, cómo no confundirla con un check de valor único, y el formato
exacto de la tabla.

## Paso 4 — Generar el Markdown (`.md`)

Escribe el informe completo en Markdown, con los bloques `####` del patrón anterior. El
diagrama de arquitectura (dentro de "Network Evaluation") va como bloque ` ```mermaid `
siguiendo la plantilla y paleta de **`reference/diagram-palette.md`** — sin inventar interfaces
o zonas que no estén en el Backup XML.

Antes de guardar, arma el bloque **Índice / Contents** (ver Paso 3, punto 3) recorriendo los
encabezados `##`/`###` que efectivamente quedaron en el documento — nunca lo escribas primero ni
lo copies de una plantilla, porque los checks omitidos en silencio cambian de un informe a otro.

**Autochequeo obligatorio antes de guardar** (esto ya causó re-trabajo — no lo saltes): relee
cada bloque `####` que menciona un comando (`> show ...` o similar) dentro de
**Device / Observación**. Si el check es de tipo "inventario" (ver "Datos completos, no solo el
comando") y el bloque no tiene la tabla de datos completa inmediatamente después — solo el
nombre del comando, o un resumen, o una muestra parcial — complétala ahora, antes de guardar.
No cuenta como terminado un informe con ese hueco. Si te falta el output crudo del comando para
completar la tabla (no está en el TSF que tienes), dilo explícitamente en el check en vez de
guardar el bloque a medias.

Guarda el archivo como `Informe_<Cliente>_<Dispositivo>_SEK.md` en el directorio de trabajo
actual.

## Paso 5 — Generar el Word (`.docx`)

1. Construye un JSON con el contenido del informe siguiendo el esquema de
   **`reference/render-docx-schema.md`** (portada, scope, el bloque `recommendations_by_severity`,
   categorías con sus `checks`, y el objeto `diagram` dentro de Network Evaluation — reutiliza
   los mismos datos que ya extrajiste para el Markdown, no los vuelvas a derivar).
2. Guarda ese JSON en un archivo temporal.
3. Ejecuta:
   ```bash
   python3 <ruta-del-skill>/scripts/render_docx.py <informe.json> "Informe_<Cliente>_<Dispositivo>_SEK.docx"
   ```
4. Requiere `python-docx` instalado (`pip install python-docx`); si Pillow no está disponible,
   `pip install Pillow`. Si el entorno actual no tiene Python o no puedes instalar paquetes,
   entrega igual el `.md` y avisa al usuario que el `.docx` no se pudo generar en este entorno.

El script aplica automáticamente la paleta visual de Palo Alto (`reference/diagram-palette.md`)
— no necesitas maquetar el `.docx` a mano.

## Archivos de referencia

| Archivo | Cuándo consultarlo |
|---|---|
| `reference/tsf-source-map.md` | Antes de leer el Backup XML/TSF — para saber dónde buscar cada dato |
| `reference/heuristics.md` | Al construir "Network Evaluation" y la lista de Recommendations priorizada |
| `reference/best-practices-checklist.md` | Al construir Security Policies/Device/Network/Security Profiles Evaluation y Security Evaluation (Feature Adoption) — incluye columna de Referencias oficiales donde está verificada |
| `reference/pan-platform-limits.md` | Si necesitas evaluar capacidad/uso vs. máximo del equipo |
| `reference/system-health-checklist.md` | Al construir "Health Checks status" |
| `reference/diagram-palette.md` | Paleta visual completa (colores, tipografía, diagrama) extraída del PDF de referencia |
| `reference/example-report-anonymized.md` | Plantilla de tono, estructura y nivel de detalle (ejemplo ficticio, no de un cliente real) |
| `reference/render-docx-schema.md` | Al preparar el JSON para `scripts/render_docx.py` |
| `reference/verification-rules.md` | Por qué existen las reglas de "nunca supongas una ruta/tag" — casos reales y procedimiento detallado |
| `reference/report-structure.md` | Detalle de qué va dentro de cada una de las 11 secciones del Paso 3 |
| `reference/tabular-data-rules.md` | Por qué la whitelist de "solo totales" es esa y no otra, y formato exacto de tabla |

Todos los archivos de `reference/` son documentos vivos: si en un assessment real encuentras
un marcador de TSF, un tag XML o un criterio de hallazgo que no está documentado, agrégalo
al archivo correspondiente para la próxima vez.
