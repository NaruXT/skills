# Estructura del informe — detalle por sección

El `SKILL.md` (Paso 3) tiene la lista de las 11 secciones en orden. Esto es el
detalle de qué va dentro de cada una — consultalo al redactar esa sección
específica, no todo de una vez.

Categorías de referencia, no un techo — ver "Regla de oro" en el `SKILL.md`.

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
   summary se resumen en totales (ver "Datos completos, no solo el comando" en el `SKILL.md`).**
9. **[Nombre del dispositivo] › Security Evaluation**: Feature Adoption — scorecard de % de
   reglas con App-ID/User-ID/perfiles/Zone Protection aplicados (tabla compacta, no el patrón
   Device/Findings/Recommendations/References — es una vista de porcentajes).
10. **[Nombre del dispositivo] › Best Practices Evaluation**:
    - **Device Evaluation**: hardening del dispositivo (permitted IPs, banner, DNS/NTP, WildFire,
      autenticación, password management, administradores, admin roles, server profiles,
      User-ID, certificados, HA, virtual system, dynamic content update, data redistribution).
    - **Network Evaluation**: aquí vive el análisis de arquitectura y segmentación de red que es
      el diferencial de este skill frente al Health Check original de Palo Alto — inventario de
      interfaces/IP/zonas, diagrama de arquitectura (ver Paso 4 del `SKILL.md`), diagnóstico de
      bypass este-oeste, tabla de enrutamiento activa + ARP, túneles S2S (config vs. estado
      operativo), VPN SSL/GlobalProtect, además de los checks propios de Palo Alto para esta
      categoría (Zone, IPSec Tunnels, Zone Protection, Packet Buffer Protection, Interface
      Management Profile).
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
categoría, cada check individual sigue el patrón Device/Findings/Recommendations/References
descrito en el `SKILL.md` — y también se omite en silencio si no hay hallazgo que comunicar.
