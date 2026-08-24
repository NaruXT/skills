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
vayas a citar — no es específica de un check. El esquema de PAN-OS cambia entre versiones (ej.
Telemetry vivía en `deviceconfig/setting/telemetry` en versiones antiguas y se movió a
`deviceconfig/system/device-telemetry` en PAN-OS 10.x+ — un caso real detectado en un assessment
donde la ruta vieja, ya inexistente, llevó a reportar "Telemetry deshabilitado" cuando en
realidad **sí** estaba habilitado bajo la ruta nueva). Los checklists de `reference/` documentan
la ruta más probada hasta ahora, no una garantía para toda versión de PAN-OS.

Antes de reportar que un dato "no está configurado" o de citar una ruta específica:

1. **Búscalo en el archivo real** (grep/lectura directa del Backup XML/TSF que tienes enfrente)
   — no en tu memoria de cómo se ve "normalmente" un XML de PAN-OS.
2. Si no aparece donde el checklist de `reference/` dice que debería estar, **investiga antes de
   concluir que no existe** — empieza por `knowledgebase.paloaltonetworks.com` (restringe el
   WebSearch a ese dominio con `allowed_domains`, no una búsqueda genérica que puede devolver
   fuentes de terceros no verificadas) buscando el comando `set`/`show` real que toca ese dato —
   suele traer la ruta CLI/XML exacta cuando el artículo documenta un ejemplo de configuración o
   un error de commit. Si la KB solo trae guías de GUI sin la ruta CLI/XML, complementa con
   `docs.paloaltonetworks.com` (CLI Reference / XML API) y, si necesitas el nombre exacto del
   elemento/atributo, el código fuente del SDK oficial `pan-os-python`
   (github.com/PaloAltoNetworks/pan-os-python, rama `develop`) — ahí cada objeto define su XPATH
   real. Si encuentras la ruta correcta, corrige el checklist de `reference/` correspondiente
   (documento vivo) para que no se repita el error, citando de dónde la confirmaste.
3. Si después de investigar sigues sin certeza, **pregúntale al usuario** — nunca asumas ni
   reportes un hallazgo (positivo o negativo) basado en una ruta sin verificar. Un falso "no
   configurado" por buscar en el lugar equivocado es peor que omitir el check.

### Un tag puede existir en más de un lugar del documento — no agregues sin verificar el dueño

Extiende la regla anterior: no basta con confirmar que un tag existe en el archivo real — un tag
genérico (`permitted-ip`, `syslog`, `ldap`, `update-schedule`, etc.) puede aparecer **más de una
vez en el mismo documento**, con un dueño o alcance (scope) distinto según su posición
jerárquica. Esto no es un escenario único — son al menos dos formas distintas en que pasa, y
ambas requieren el mismo chequeo antes de reportar:

- **Mismo nombre de tag, feature distinto.** Caso real: `<permitted-ip>` aparece tanto en
  `deviceconfig/system/permitted-ip` (el Permitted IP Addresses real del dispositivo) como en
  `network/profiles/interface-management-profile/entry/permitted-ip` (las IPs permitidas de un
  perfil de gestión de interfaz — un feature distinto) — una búsqueda ciega tipo
  `root.iter('permitted-ip')` mezcló ambos y atribuyó IPs públicas de un perfil de interfaz sin
  usar al Permitted IP del dispositivo, generando un hallazgo falso.
- **Mismo nombre de tag, mismo feature, alcance (scope) distinto.** El input puede ser un
  dispositivo standalone, o Panorama gestionando uno o más dispositivos — y en cualquiera de los
  dos, un mismo tipo de objeto puede repetirse en más de un nivel de scope: `Shared` vs. un
  `vsys` específico (ej. Server Profiles como Syslog/LDAP, que PAN-OS permite definir en
  cualquiera de los dos niveles), o Panorama vs. dentro de un `<template>`/`<device-group>`
  pushed a un firewall gestionado. No asumas cuál de los dos es el input sin haberlo confirmado
  en el archivo real — puede ser cualquiera.

En ambos casos, antes de reportar un hallazgo basado en un tag XML:

1. **Verifica el ancestro directo del tag** — ¿a qué feature y a qué scope pertenece exactamente
   esa ocurrencia (`Shared`, un `vsys` puntual, `deviceconfig/system` a nivel dispositivo,
   dentro de un `<template>`/`<device-group>` de Panorama)? Nunca dos ubicaciones distintas del
   árbol representan lo mismo solo porque el tag se llama igual.
2. **Cuenta las coincidencias antes de agregar un número.** Si tu búsqueda es un `.iter()`/XPath
   global o un `grep` sin contexto y devuelve más de 1 coincidencia, es una señal de alto:
   detente y confirma a qué dueño/scope pertenece cada una antes de sumarlas en un solo hallazgo.
3. **Atribuye el hallazgo al dueño correcto.** Si dos coincidencias tienen scopes distintos,
   repórtalas como hallazgos separados sobre su propio dueño (el vsys/template/firewall que
   corresponda) — nunca las sumes ni las atribuyas a un scope superior (Panorama, Shared, el
   dispositivo) que no es donde realmente viven.

La regla de Telemetry (arriba) protege contra asumir que un tag no existe cuando en realidad
vive en otra ruta (falso negativo). Esta protege del error inverso: agregar de más porque el tag
sí existe, pero en varios lugares con dueños/scopes distintos (falso positivo por mezcla). Son
dos modos de falla distintos — documentados por separado a propósito.

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

Sigue esta jerarquía (categorías de referencia, no un techo — ver Regla de oro):

1. **Portada**: título, nombre del cliente ("Prepared for"), fecha, preparado por, número de
   versión del informe.
2. **Notices / Disclaimer** (breve, de SEK — no copies el texto legal de Palo Alto Networks del
   PDF de referencia, es su copyright corporativo específico, no el tuyo).
3. **Índice / Contents**: el PDF de referencia abre con un "Contents" que lista Executive
   Summary, Scope, Recommendations y cada categoría/check con su página — el informe **no** está
   completo sin este bloque. En Markdown no hay páginas: genera una lista con un enlace de ancla
   por cada encabezado `##`/`###` real del documento (`[Texto del encabezado](#slug-del-encabezado)`,
   el slug de minúsculas-con-guiones que generan GitHub/la mayoría de renderizadores Markdown),
   en el mismo orden en que aparecen, con sangría por nivel (categoría → check). Constrúyelo al
   final, cuando ya sepas qué secciones y checks sobrevivieron (un check omitido en silencio
   tampoco debe aparecer en el índice) — nunca antes.
4. **Executive Summary**: objetivo del informe y resumen de postura en 1-2 párrafos, en lenguaje
   que sirva tanto a un ingeniero de redes como a un gerente no técnico.
5. **Scope**: dispositivo(s) revisado(s) — nombre, modelo, versión de PAN-OS, virtual systems si
   aplica.
6. **Recommendations**: lista curada y priorizada de las recomendaciones más importantes del
   informe, agrupadas por severidad — **Crítico → Alto → Importante → Bajo → Otras
   Recomendaciones** (bullets con sub-bullets para evidencia concreta, sin tabla, sin numeración
   H-N — igual que el PDF de referencia). Se nutre principalmente de `heuristics.md`, más
   cualquier hallazgo de los otros checklists que amerite subir a este resumen ejecutivo por su
   impacto. No repitas aquí cada check menor — es una selección, no un volcado completo.
7. **[Nombre del dispositivo] › System Evaluation**: versión de PAN-OS, licenciamiento, SNMP,
   Content-ID, Device Certificate, Telemetry, Logging and Reporting Settings (resumen agregado),
   High Availability, Dynamic Content Update.
8. **[Nombre del dispositivo] › Health Checks status**: Config Size, ARP/MAC table usage,
   Routing (+ consistencia BGP/OSPF), NAT Mapping, Environmental system, Software process
   status, utilización CPU/memoria (management + dataplane), sesiones activas, throughput,
   Dataplane pool statistics, Disk space, Files Core Dump, Disk Log Usage, Jumbo Frames. Deja
   explícito que CPU/memoria/sesiones/throughput son una foto del momento del TSF, no una
   tendencia histórica (ver `system-health-checklist.md`). **Todo check con salida tabular va
   con tabla de datos completa por default — solo ARP/MAC table usage, Config Size y Routing
   summary se resumen en totales (ver "Datos completos, no solo el comando" más abajo).**
9. **[Nombre del dispositivo] › Security Evaluation**: Feature Adoption — scorecard de % de
   reglas con App-ID/User-ID/perfiles/Zone Protection aplicados (tabla compacta, no el patrón
   Device/Findings/Recommendations/References — es una vista de porcentajes).
10. **[Nombre del dispositivo] › Best Practices Evaluation**:
   - **Device Evaluation**: hardening del dispositivo (permitted IPs, banner, DNS/NTP, WildFire,
     autenticación, password management, administradores, admin roles, server profiles,
     User-ID, certificados, HA, virtual system, dynamic content update, data redistribution).
   - **Network Evaluation**: aquí vive el análisis de arquitectura y segmentación de red que es
     el diferencial de este skill frente al Health Check original de Palo Alto — inventario de
     interfaces/IP/zonas, diagrama de arquitectura (ver Paso 4), diagnóstico de bypass
     este-oeste, tabla de enrutamiento activa + ARP, túneles S2S (config vs. estado operativo),
     VPN SSL/GlobalProtect, además de los checks propios de Palo Alto para esta categoría (Zone,
     IPSec Tunnels, Zone Protection, Packet Buffer Protection, Interface Management Profile).
   - **Security Policies Evaluation**: checks sobre el rulebase (zonas/User-ID/App-ID/service,
     log forwarding, EDLs, geolocation, QUIC, sinkholing, alert-only, clean-up rule,
     interzone/intrazone, shadow rules, reglas sin uso, crypto IPSec) + objetos en desuso
     (direcciones/servicios/grupos sin referenciar en el rulebase — ver
     `best-practices-checklist.md`).
   - **Security Profiles Evaluation**: Antivirus, Anti-Spyware, Vulnerability Protection, URL
     Filtering, File Blocking, WildFire, Security Profile Group.
   - Si el input entregado ya trae un **score de BPA (Best Practice Assessment de Strata Cloud
     Manager)** calculado externamente, repórtalo como un check más dentro de esta categoría
     (nunca lo calcules ni lo estimes tú mismo — requiere la API de SCM, fuera de alcance).
11. **Reference Links** (opcional): si acumulaste varios enlaces de Referencias a lo largo del
    informe, puedes listarlos todos juntos al final además de donde ya aparecen — omite esta
    sección si no aporta nada nuevo.

Cada categoría (7-9) solo aparece si hay datos reales que reportar en ella. Dentro de cada
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

**Default: tabla completa.** Si el comando/tag citado en un check devuelve más de un elemento
(procesos, filesystems, archivos, sensores, pools, categorías de log, reglas...), el check lleva
la tabla de datos **completa** — todas las filas, no una muestra, no un resumen en prosa. Esto
no es un juicio caso por caso: es el comportamiento por defecto para **todo** check con salida
tabular, salvo los tres que están explícitamente en la whitelist de abajo. Si un check nuevo no
está ni en la whitelist ni ya clasificado en `system-health-checklist.md`, **asume tabla
completa** — nunca lo contrario.

**Whitelist cerrada — únicos checks que se resumen en totales, nunca fila por fila:**

- **ARP table usage** / **MAC table usage** — solo `total ARP/MAC entries in table` +
  `maximum of entries supported` (no cada entrada ARP/MAC individual; el detalle por interfaz
  relevante para Network Evaluation es un check aparte, ver `heuristics.md`).
- **Config Size** — solo el tamaño (candidate vs. last-committed) vs. el máximo de la
  plataforma.
- **Routing summary** — solo los totales de `show routing summary` (rutas por tipo, límites) +
  cualquier warning textual puntual que traiga el comando.

Verificado contra el PDF de referencia (págs. 64-65): ahí el total ya es el dato completo — no
hay una fila individual que un especialista necesite verificar por separado. Esta whitelist es
intencionalmente cerrada: si dudas si un check nuevo califica para ella, la respuesta es que no
— repórtalo con tabla completa y, si de verdad resulta ser un check de solo-totales, agrégalo
aquí explícitamente para la próxima vez (no lo asumas en el momento).

**No confundir con checks de valor único** (CPU/memoria management/dataplane, sesiones activas,
throughput, Jumbo Frames): ahí no hay tabla que omitir — el comando ya devuelve un solo valor o
un par de valores, y ese valor completo es lo que se reporta inline en Device/Observación. La
whitelist de arriba es para comandos que sí devuelven una lista y aun así se resumen; esto es
distinto — no hay nada que resumir porque nunca hubo una lista.

Para un check de tabla completa, esta va inmediatamente después de **Device / Observación**,
como tabla Markdown (o `data_table` en el JSON del Paso 5) — **no** como bloque de texto plano
pegado del TSF (una tabla limpia es más legible que el output crudo del PDF de referencia, y
sigue siendo igual de completa). Columnas por check — ver `system-health-checklist.md` (Software
process status, Disk space, Files Core Dump, Environmental system, Dataplane pool statistics,
Disk Log Usage, NAT Mapping) y `best-practices-checklist.md`/`heuristics.md` para el resto
(certificados, administradores, licencias, interfaces, reglas, etc. — varios de estos ya se
generaban como tabla completa antes de esta regla, sin problema).

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

Todos los archivos de `reference/` son documentos vivos: si en un assessment real encuentras
un marcador de TSF, un tag XML o un criterio de hallazgo que no está documentado, agrégalo
al archivo correspondiente para la próxima vez.
