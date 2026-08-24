# Heurísticas — Network Evaluation y lista de Recommendations priorizada

Umbrales extraídos literalmente de la función `buildFindings()` del motor determinístico
existente (portal "Network Traffic Assessment" de SEK) — el análisis de arquitectura y
segmentación de red que es el diferencial de este skill frente al Health Check original de
Palo Alto (ver `SKILL.md`, categoría "Network Evaluation" dentro de "Best Practices
Evaluation"). Son el punto de partida validado para decidir cuándo algo es un hallazgo
reportable — **no reglas absolutas**: si los datos muestran algo relevante que no encaja en
ninguno de estos patrones, repórtalo igual con tu propio criterio profesional, siempre anclado
a datos reales del Backup XML/TSF. Si el dato para evaluar un criterio no está presente, omite
ese hallazgo en silencio.

**Sin numeración H-N**: cada hallazgo se presenta como su propio check (patrón Device/
Findings/Recommendations/References, ver `SKILL.md`) dentro de "Network Evaluation", e
identificado por evidencia concreta (nombre de interfaz/zona/regla/túnel), no por un código.
Los más importantes se resumen además en la lista de **Recommendations** priorizada al inicio
del informe.

**Escala de severidad** (adaptada del PDF de Palo Alto: Critical/High/Important/Low/Other
Recommendations → Crítico/Alto/Importante/Bajo/Otras Recomendaciones):

| # | Condición | Severidad | Texto base del hallazgo | Recomendación base |
|---|---|---|---|---|
| 1 | Existe un next-hop interno (`core`) con **≥8 segmentos/redes** enrutados hacia él desde una sola interfaz de tránsito | **Crítico** | "Bypass este-oeste: N segmentos internos se enrutan a un único siguiente salto (IP) por <interfaz>. [Si la interfaz de tránsito tiene 1 sola entrada ARP: 'La tabla ARP lo confirma: esa interfaz tiene una sola entrada.'] El tráfico lateral entre subredes internas no es inspeccionado por el firewall." | Rediseñar la segmentación: llevar las VLAN internas al firewall con zonas por función y aplicar políticas inter-VLAN de mínimo privilegio. |
| 2 | Una o más interfaces tienen **más de una IP** (`ips.length > 1`) | Importante | "Múltiples redes en una misma interfaz/zona: <interfaz> (<IPs>); ..." | Documentar el propósito de cada red; si cumplen roles distintos, separarlas por interfaz/zona para políticas más granulares. |
| 3 | Algún túnel IPsec tiene un proxy-ID local o remoto = `0.0.0.0/0` | Alto | "Túnel VPN con proxy-ID 0.0.0.0/0 (selector universal): <nombres>." | Restringir el proxy-ID a las redes estrictamente necesarias en ambos extremos y complementar con rutas específicas. |
| 4 | Conteo de reglas de seguridad con `application: any` en modo allow > 0 | Alto | "N regla(s) de seguridad con aplicación 'any' en modo allow." | Reemplazar 'application: any' por App-ID explícitas con 'application-default' (mínimo privilegio). |
| 5 | Existen zonas sin ninguna interfaz asociada (`zone.members.length === 0`) | Importante | "Zonas huérfanas sin interfaz asociada: <nombres>." | Depurar zonas y reglas no utilizadas para facilitar la auditoría. |
| 6 | No hay enrutamiento dinámico (BGP/OSPF deshabilitados) **y** rutas estáticas > 20 | Importante | "Sin enrutamiento dinámico: N rutas estáticas manuales. Alto esfuerzo operativo y riesgo de errores ante cambios." | Evaluar OSPF/BGP con el núcleo interno o al menos documentar la tabla estática y usar path-monitoring en rutas críticas. |
| 7 | Interfaces físicas (no subinterfaces) sin IP y sin zona asignada | Bajo | "Interfaces físicas sin uso ni zona: <nombres>." | Mantener administrativamente deshabilitadas las interfaces no utilizadas. |
| 8 | Entradas ARP con hardware `incomplete` o estado `i` | Bajo | "Entradas ARP incompletas: <IPs> (sin resolución activa)." | Validar que las publicaciones/NAT asociadas sigan en uso; retirar objetos obsoletos. |
| 9 | Peers BGP con estado ≠ `Established` | Importante | "N peer(s) BGP no establecidos (<peers>): sesiones en estado <estados>." | Revisar conectividad hacia el peer, configuración de vecino (AS, holdtime, autenticación) y rutas/ACLs; confirmar si son sesiones esperadas o remanentes. |
| 10 | Vecinos OSPF con estado ≠ `Full` | Importante | "N vecino(s) OSPF fuera de estado Full: <vecino> (<estado>)." | Revisar MTU, tipo de red OSPF, autenticación y timers hello/dead entre los vecinos. |
| 11 | Reglas allow sin Security Profile Group ni perfiles individuales asignados | Alto | "N regla(s) de seguridad (allow) sin perfil de seguridad asignado." | Asignar perfiles (AV, Anti-Spyware, Vulnerability, URL, WildFire) o un Security Profile Group a las reglas de permitido. |
| 12 | Reglas sin `log-end` (sin registro de log al final de sesión) | Importante | "N regla(s) sin registro de log al final de sesión." | Habilitar 'Log at Session End' y un Log Forwarding Profile para visibilidad y correlación. |
| 13 | Reglas allow con origen y destino ambos `any` | Importante | "N regla(s) permisivas con origen y destino ANY." | Acotar origen/destino al mínimo necesario (mínimo privilegio). |
| 14 | Reglas de seguridad deshabilitadas | Bajo | "N regla(s) de seguridad deshabilitadas." | Revisar y eliminar reglas deshabilitadas que ya no apliquen. |
| 15 | No hay Trusted Hosts / Permitted IP definidos para gestión | Alto | "No hay Trusted Hosts (permitted-ip) definidos para el acceso de gestión." | Restringir el acceso administrativo a las IPs/redes autorizadas del equipo de operaciones. |
| 16 | Complejidad de contraseñas no habilitada | Alto | "La complejidad de contraseñas no está habilitada." | Habilitar la política de complejidad de contraseñas (longitud mínima, mayúsculas/números/símbolos, expiración). |
| 17 | NTP no sincronizado (`ntpSync` matchea "No"/"not synchronized") | Bajo | "El servicio NTP no está sincronizado." | Verificar la disponibilidad de los servidores NTP y la conectividad; el desfase horario afecta logs y certificados. |
| 18 | Túneles S2S configurados pero sin SA activa (`show vpn ipsec-sa` no los lista) | Importante | "Consistencia (configuración vs. estado operativo) — N túnel(es) S2S están configurados pero SIN SA activa (posible configuración remanente): <nombres>." | Depurar: confirmar cuáles son respaldos legítimos y deshabilitar/eliminar los remanentes que ya no correspondan; revisar los que deban estar activos y no lo están. |
| 19 | Una política de import/export de BGP referencia un peer-group que está `disable=yes` | Importante | "Política BGP <nombre> referencia el peer-group <peer-group> que está deshabilitado — configuración huérfana." | Eliminar la referencia si el peer-group ya no aplica, o rehabilitarlo si sigue en uso. |
| 20 | El `router-id` de BGP y el de OSPF no coinciden dentro del mismo virtual-router | Bajo | "El virtual-router <VR> tiene router-id distinto entre BGP (<id-bgp>) y OSPF (<id-ospf>)." | Homologar el router-id entre protocolos en el mismo VR para evitar ambigüedad en troubleshooting y en escenarios de redistribución. |
| — | (siempre, al final) | Otras Recomendaciones | "Revisión general de la postura: verificar vigencia de firmas (Threat/AV/WildFire), perfiles de seguridad en reglas de permitido y respaldos de configuración." | Mantener el ciclo de mantenimiento preventivo y monitoreo continuo. |

> Los hallazgos #19 y #20 son **100% derivables del Backup XML** (cruce de tags dentro de
> `<network><virtual-router>`), sin necesitar TSF — no dependas de que el TSF traiga
> `show routing protocol bgp ...` para poder evaluarlos.

## Cómo alimentan la lista de Recommendations priorizada

La sección "Recommendations" al inicio del informe (ver `SKILL.md`, Paso 3) es una **selección
curada**, no un volcado de todos los checks — igual que en el PDF de referencia, donde
"Critical"/"High" traen 3-5 bullets concretos, no cada hallazgo posible. Prioriza para esa
lista:

- Todo lo que salga **Crítico** o **Alto** de esta tabla.
- De **Importante**, solo lo que tenga impacto operativo o de auditoría claro (ej. peers
  BGP/OSPF caídos, túneles S2S inconsistentes) — no necesariamente cada fila.
- **Bajo** normalmente no sube a la lista priorizada; queda documentado en el check individual
  dentro de "Network Evaluation" y ya.
- Los hallazgos de `best-practices-checklist.md` y `system-health-checklist.md` no traen
  severidad preasignada — usa el mismo criterio cualitativo de esta tabla para decidir si un
  hallazgo de esos checklists amerita subir a la lista priorizada (ej. Password Complexity
  deshabilitada o Trusted Hosts sin definir son típicamente **Alto** por exposición directa del
  plano de gestión; un perfil WildFire con límites de tamaño subóptimos es más bien
  **Importante**; interfaces sin uso o certificados duplicados son **Bajo**).

## Notas de implementación heredadas del motor original

- El "Bypass este-oeste" sigue siendo el hallazgo insignia del skill — es el diferencial real
  frente a un Health Check genérico de Palo Alto, que no hace este tipo de diagnóstico de
  segmentación.
- Ver también `best-practices-checklist.md` para los criterios de Device/Network/Security
  Policies/Security Profiles Evaluation, que siguen la misma lógica de "solo reportar lo que se
  desvía de la buena práctica".
