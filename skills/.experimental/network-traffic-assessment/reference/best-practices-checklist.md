# Checklist — Best Practices Evaluation y Security Evaluation

Extraído de un "Health Check of Next Generation Firewall Report" real de Palo Alto Networks
(Best Practices Evaluation). Es un **piso de referencia**: reporta solo lo que se desvía de la
buena práctica (mismo patrón que `heuristics.md`), no enumeres todo lo que ya está bien.
Si el dato no está en el Backup XML/TSF, omite el check en silencio — no lo menciones como
"no evaluado".

Notación de fuente:
- **XML** = disponible en el Backup XML (running-config / merged-running-config)
- **TSF** = solo en la salida de un comando operacional `show ...` del Tech Support File
- **XML+TSF** = se necesitan ambas fuentes
- **NO derivable** = fuera de alcance con solo estas dos fuentes (no lo intentes evaluar; no lo menciones en el informe)

**Columna Referencias**: enlace oficial de Palo Alto que respalda la buena práctica. Poblada
solo donde se verificó el enlace (vía WebSearch en la construcción de este archivo) — el resto
queda vacía a propósito. **Nunca completes una celda vacía con una URL sin verificar** al
generar un informe real; si necesitas una referencia para un check sin enlace aquí, búscala en
el momento (WebSearch contra `docs.paloaltonetworks.com` / `knowledgebase.paloaltonetworks.com`)
y si no encuentras una confiable, omite la línea de Referencias para ese hallazgo (ver
`SKILL.md`, patrón Device/Findings/Recommendations/References). Si encuentras y verificas un
enlace nuevo durante un assessment real, agrégalo aquí para la próxima vez (documento vivo).

## Security Policies Evaluation — Políticas de Seguridad (checks sobre el rulebase)

Todos sobre `rulebase/security/rules/entry` y `rulebase/default-security-rules/entry` del XML.

| Check | Buena práctica esperada | Fuente | Recomendación si falla | Referencias |
|---|---|---|---|---|
| Zonas / User-ID / APP-ID / Service en reglas | Minimizar `from`/`to`/`source-user`/`application`/`service` = any; usar `application-default` | XML — atributos de cada `rule/*` | Migrar a valores explícitos con Policy Optimizer | [Security Policy Best Practices](https://docs.paloaltonetworks.com/best-practices/security-policy-best-practices) |
| Log Forwarding en reglas | Toda regla con `log-setting` asignado; log-end habilitado | XML — `rule/log-setting`, `rule/log-end` | Asignar Log Forwarding profile | |
| Block EDLs predefinidos | Reglas deny usando Bulletproof IP / High-Risk IP / Known Malicious IP / Tor Exit (PAN predefined EDLs) como src y dst | XML — referencia a los EDL predefinidos en el rulebase | Crear 2 reglas deny (src y dst) con estos EDLs | |
| Block Unwanted Regions (Geolocation) | Regla deny con `region` en source/destination | XML — `rule/source/region`, `rule/destination/region` | Agregar regla Geolocation en el borde | |
| Block Quic | Regla deny explícita para `quic-base`/`quic` (+ UDP/443, UDP/80 como refuerzo) | XML — existencia de la política (no el tráfico observado, que requiere logs) | Crear regla de bloqueo | |
| Sinkholing Rule | Regla dedicada para redirigir DNS sinkhole | XML — existencia de la regla | Agregar Sinkholing Rule dedicada | |
| Reglas con perfiles en modo Alert únicamente | Perfiles referenciados con acción "alert" en sus firmas, sin escalar a prevención | XML — cruce `rule/profile-setting/group` → definición del grupo → perfiles | Migrar de alert a prevention | |
| Clean-Up Rule | Regla deny-all explícita al final del rulebase (o confiar en interzone-default con acción deny) | XML — última entry del rulebase, o `rulebase/default-security-rules/entry[name=interzone-default]` | Agregar clean-up rule si falta | |
| Interzone/Intrazone default | intrazone-default con log-setting y profile-group; interzone-default con acción deny | XML — override de `rulebase/default-security-rules/entry` | Asignar perfil al intrazone-default | |
| Security Rules Shadow | Reglas cuyo criterio de match está subsumido por una regla anterior más amplia | XML — 100% algorítmico comparando criterios de match en orden | Revisar y eliminar/reordenar reglas shadow | |
| Security Rules Unused (90 días) | Reglas con Hit Count = 0 o Last Hit > 90 días | TSF condicional — solo si incluye `show rule-hit-count vsys <name> rule-base security rule-list all` | Eliminar reglas sin uso (salvo excepciones programadas) | |
| Crypto IPSec (IKE/IPSec Crypto Profiles) | Solo SHA256+ para auth; AES-128-GCM/AES-256-GCM para cifrado; remover 3DES/SHA1/MD5/AES-CBC | XML — `network/ike/crypto-profiles/*`, `ipsec-crypto-profiles/*` | Migrar perfiles legacy | [IPSec Crypto Profiles](https://docs.paloaltonetworks.com/network-security/ipsec-vpn/administration/set-up-site-to-site-vpn/define-cryptographic-profiles/define-ipsec-crypto-profiles) · [IKE Crypto Profiles](https://docs.paloaltonetworks.com/network-security/ipsec-vpn/administration/set-up-site-to-site-vpn/define-cryptographic-profiles/define-ike-crypto-profiles) |

### Objetos en Desuso e Higiene de Configuración (dentro de Security Policies Evaluation)

Complementa el análisis del rulebase: objetos definidos pero no referenciados en ninguna regla
de seguridad. Antes era una categoría propia del informe; ahora vive aquí porque su fuente y
mecánica son las mismas que el resto de esta tabla (análisis algorítmico del XML, sin logs).

| Check | Qué mide | Fuente | Recomendación |
|---|---|---|---|
| Direcciones/grupos de dirección sin uso | Objetos `address`/`address-group` no referenciados en `rulebase/security/rules` (ni en NAT) | XML — comparación algorítmica `address`/`address-group` vs. rulebase | Depurar objetos sin uso para reducir ruido en la gestión |
| Servicios/grupos de servicio sin uso | Objetos `service`/`service-group` no referenciados en el rulebase | XML — igual mecánica | Depurar objetos sin uso |
| Grupos de aplicación / application-filters sin uso | `application-group`/`application-filter` no referenciados en el rulebase | XML — igual mecánica | Depurar objetos sin uso |

No prometas un archivo Excel/CSV adjunto con el detalle línea por línea — el skill entrega
Markdown/Word, no un export aparte; reporta los conteos por categoría directamente en el check.

## Network Evaluation — checks propios de Palo Alto (complementan el análisis de arquitectura de `heuristics.md`)

| Check | Buena práctica esperada | Fuente | Recomendación si falla | Referencias |
|---|---|---|---|---|
| Zone Protection Profile | Toda zona con perfil asignado: Flood Protection, Reconnaissance Protection, Packet-Based Attack Protection habilitados | XML — `zone/entry/zone-protection-profile` y su definición | Aplicar Zone Protection a todas las zonas, empezando por norte-sur | [DoS and Zone Protection Best Practices](https://docs.paloaltonetworks.com/best-practices/dos-and-zone-protection-best-practices/dos-and-zone-protection-best-practices) |
| Packet Buffer Protection | Habilitado por zona; Alert 50%/Activate 80%/Block Hold Time ≤30s configurado a nivel dispositivo | XML — `zone/entry/packet-buffer-protection`, `deviceconfig/setting/session/*` | Habilitar y ajustar thresholds | |
| Interface Management Profile | Perfiles de mgmt-profile con servicios mínimos (ping/ssh/https solo donde necesario) | XML — `network/profiles/interface-management-profile/entry` | Restringir servicios habilitados por interfaz | |

## System Evaluation — Identidad y Servicios del Sistema

Checks de identidad/versión del equipo y servicios de gestión — complementan (no repiten) los
de Hardening/Perfiles de abajo.

| Check | Buena práctica esperada | Fuente | Recomendación si falla | Referencias |
|---|---|---|---|---|
| Versión de PAN-OS | Estar en la "preferred release" del release train correspondiente (dato externo, no en XML/TSF — si no puedes verificarlo, omite el juicio de "preferida" y limítate a reportar la versión instalada) | XML — atributo `version` en `<config version="X.Y.Z">`; TSF — `show system info` (`sw-version`) | Actualizar a la versión preferida más reciente del release train; revisar CVEs conocidos de esa versión (dentro del mismo check de System Evaluation) | |
| Licenciamiento — fechas de expiración | Ninguna licencia/suscripción expirada o próxima a expirar (Threat Prevention, Advanced URL Filtering, Advanced WildFire, Logging Service, DNS Security, ATP) | **Solo TSF** (salida de `request license info` o el resumen de licencias capturado en el TSF) — **no está en el Backup XML** | Renovar licencias antes de expiración; evaluar suscripciones de seguridad faltantes | |
| SNMP Setup | Versión v3 (con autenticación/cifrado) en vez de v2c (community string en texto plano) | XML — `deviceconfig/system/snmp-setting/version/{v2c,v3}` (verificado contra `knowledgebase.paloaltonetworks.com` — **no** `deviceconfig/snmp-setting`, sin `/system/`, que es una ruta incompleta) | Migrar a SNMPv3 | |
| Content-ID — Inline Cloud Analysis | "Log Traffic Not Scanned" habilitado para URL/WildFire/Threat Prevention Inline Cloud Analysis | XML — `deviceconfig/setting/content-id` (o el sub-objeto de inline-cloud-analysis dentro de los perfiles) | Habilitar "Log Traffic Not Scanned" en los tres módulos | |
| Device Certificate (para servicios cloud: AIOps/Telemetry/SCM) | Instalado y válido | Requiere validación en vivo contra el Customer Support Portal/Hub — **no es confiablemente derivable offline** de Backup XML/TSF estático | Instalar/renovar el device certificate si el TSF no muestra evidencia de uno vigente (tratar con cautela; no afirmar "inválido" sin poder verificarlo) | |
| Telemetry | Habilitado (Device Health & Performance, Product Usage, Threat Prevention) | XML — `deviceconfig/system/device-telemetry` (elemento `<device-telemetry>` con hijos `threat-prevention`/`device-health-performance`/`product-usage`/`region` — confirmado en `knowledgebase.paloaltonetworks.com` vía el comando CLI real `set deviceconfig system device-telemetry region <region> product-usage yes device-health-performance yes threat-prevention yes`), **no** `deviceconfig/setting/telemetry` (ruta de un esquema de PAN-OS anterior a 10.x, deprecada — un artículo de la misma KB documenta el error `"device-telemetry unexpected here"` al importar una config 10.x hacia 9.1.x, confirmando que `<device-telemetry>` no existe antes de 10.x; confirmar siempre la ruta real leyendo el XML, ver nota de "no asumir rutas" en `SKILL.md`). El estado de "último envío exitoso" es runtime contra el Hub — **no derivable** | Habilitar Telemetry y AIOps free tier | [Device Telemetry Overview](https://docs.paloaltonetworks.com/pan-os/11-0/pan-os-admin/device-telemetry/device-telemetry-overview) |
| Logging and Reporting Settings (resumen agregado) | Espacio de log DB `Unallocated` > 9% del total | TSF — `show system logdb-quota` (línea `Total: Allocated/Unallocated`) — **mismo comando** que "Disk Log Usage" de `system-health-checklist.md`; repórtalos juntos, no por separado | Ajustar cuotas de retención por tipo de log | |

## Device Evaluation — Hardening del dispositivo

| Check | Buena práctica esperada | Fuente | Recomendación si falla | Referencias |
|---|---|---|---|---|
| Permitted IP Addresses (gestión) | Solo IPs privadas (RFC1918) en la lista | XML — `deviceconfig/system/permitted-ip/entry` **exclusivamente** — no confundir con `network/profiles/interface-management-profile/entry/permitted-ip` (IPs permitidas de un perfil de gestión de interfaz, feature distinto, mismo nombre de tag). Verifica el ancestro directo antes de reportar (ver "Un tag puede existir en más de un lugar del documento" en `SKILL.md`); en Panorama, además, puede repetirse dentro de cada `<template>` — atribuye el hallazgo al template/firewall correcto, no a Panorama | Usar solo IPs privadas; validar cada IP pública contra RFC1918 | [Administrative Access Best Practices](https://docs.paloaltonetworks.com/pan-os/9-0/pan-os-admin/getting-started/best-practices-for-securing-administrative-access) |
| Login Banner | Banner de advertencia legal configurado, con "Force Admins to Acknowledge" habilitado | XML — `deviceconfig/system/login-banner` | Configurar banner de advertencia con acknowledgment | |
| DNS & NTP | Primario y secundario configurados para ambos | XML — `deviceconfig/system/dns-setting`, `ntp-servers` | Configurar servidor secundario si falta | |
| WildFire — Report Grayware / File Size Limits | Report Grayware habilitado; límites de tamaño por tipo de archivo en valores recomendados (no default demasiado bajo) | XML — settings de WildFire | Ajustar límites recomendados por PAN; considerar nube WildFire regional | |
| Log on High DP Load / Log Admin Activity | Ambas opciones habilitadas | XML — Device > Setup > Management settings | Habilitar ambas opciones | |
| Authentication Profiles/Sequences | Failed Attempts + Lockout Time configurados; Allow List restringido (no "all") | XML — `authentication-profile/entry`, `authentication-sequence/entry` | Configurar lockout; restringir allow-list; MFA para admins | [Administrative Access Best Practices](https://docs.paloaltonetworks.com/pan-os/9-0/pan-os-admin/getting-started/best-practices-for-securing-administrative-access) |
| Password Management | Complejidad habilitada: longitud mínima, mayúsculas/minúsculas/números/especiales, bloqueo de reutilización, expiración | XML — `mgt-config/password-complexity` | Configurar Password Profile | [Administrative Access Best Practices](https://docs.paloaltonetworks.com/pan-os/9-0/pan-os-admin/getting-started/best-practices-for-securing-administrative-access) |
| Administradores | Cada admin local con Password/Authentication Profile asignado; sin usar el usuario "admin" default; idle timeout 1-10 min | XML — `mgt-config/users/entry` | Eliminar admin default; asignar profile; configurar idle timeout | [Administrative Access Best Practices](https://docs.paloaltonetworks.com/pan-os/9-0/pan-os-admin/getting-started/best-practices-for-securing-administrative-access) |
| Admin Role Profiles | Roles de mínimo privilegio (no solo los 3 roles predefinidos) asignados a cada admin/grupo | XML — `shared/admin-role/entry` referenciado en `mgt-config/users/entry/permissions` | Crear Admin Role Profiles de mínimo privilegio | |
| Server Profiles — Syslog | Transport = SSL en todos los perfiles Syslog | XML — `shared/server-profile/syslog/entry/server/entry/transport`, **pero también puede existir un perfil homónimo por vsys** (`vsys/entry[@name=...]/server-profile/syslog`) — PAN-OS permite definir Server Profiles tanto en Shared como por vsys; verifica el scope de cada coincidencia antes de sumarlas en un solo hallazgo (ver "Un tag puede existir en más de un lugar del documento" en `SKILL.md`) | Forzar SSL | |
| Server Profiles — LDAP | "Require SSL/TLS" y "Verify Server Certificate" habilitados | XML — `shared/server-profile/ldap/entry`, mismo caveat de scope Shared vs. vsys que Syslog arriba | Habilitar ambas opciones | |
| User Identification — Group Mapping | Configurado con perfil LDAP e Included List definida | XML — `group-mapping`, `ldap-profile`, `user-group-include-list` | Consolidar fuentes User-ID | |
| Certificados | Sin certificados expirados; sin subjects duplicados; cadena bien formada | XML — `shared/certificate/entry` (expiry, subject, issuer — comparación algorítmica) | Eliminar expirados/duplicados; corregir cadena | |
| Alta Disponibilidad | Path Monitoring con destino configurado (si HA habilitado); HA1 Backup configurado; Timer Settings = "Recommended" | XML — `deviceconfig/high-availability/group/*` | Configurar Path Monitoring, HA1 Backup, Timer recomendado | |
| Virtual System — Inter-Vsys User-ID Hub | Un vsys designado como hub si hay múltiples vsys con User-ID | XML — flag del vsys | Consolidar User-ID en un vsys hub | |
| Dynamic Content Update — schedule | Antivirus/App&Threats/WildFire con recurrencia y acción (download-and-install) según buena práctica | XML — `deviceconfig/system/update-schedule/*` (schedule); TSF `show system info` (versión instalada) | Ajustar recurrencia/acción; revisar Release Notes antes de instalar | |
| Data Redistribution Agents | Todos los agentes definidos en estado "connected" | XML (definición) + TSF condicional (`show user user-id-agent state all`, si el TSF lo capturó) | Revisar agentes desconectados | |

## Security Profiles Evaluation — Perfiles de Seguridad

Todos viven en `shared/profiles/*` (o dentro del Device Group si es config de Panorama) —
100% derivables del Backup XML, sin necesitar TSF salvo licencias.

| Perfil | Buena práctica esperada | Fuente | Recomendación si falla | Referencias |
|---|---|---|---|---|
| Antivirus — Decoders | Acción `reset-both` en Signature/WildFire Signature/WildFire Inline ML Action para todos los decoders | XML — `profiles/virus/entry/decoder/entry/{action,wildfire-action,mlav-action}` | Set reset-both en todos los decoders (validar impacto en smtp/pop3 antes) | |
| Antivirus — WildFire Inline ML | Habilitado si hay licencia Advanced WildFire | XML (config) + TSF/licencia (`request license info`, si está en el TSF) | Habilitar si hay licencia | |
| Anti-Spyware — Signature Policies | Critical/High = reset-both + packet-capture; Medium/Low/Info = alert | XML — `profiles/spyware/entry/rules/entry/{severity,action,packet-capture}` | Ajustar acciones por severidad | |
| Anti-Spyware — DNS Policies (sinkhole) | Acción sinkhole en categorías de botnet-domains | XML — `profiles/spyware/entry/botnet-domains/{dns-security-categories,sinkhole}` | Configurar sinkhole | |
| Vulnerability Protection — Rules | Critical/High/Medium = reset-both + packet-capture; Low/Info = alert | XML — `profiles/vulnerability/entry/rules/entry` | Ajustar acciones; agregar regla TSID (app-id-change, alert) | |
| URL Filtering — categorías maliciosas | command-and-control, grayware, malware, phishing, ransomware, scanning-activity = block (Site Access + Credential Submission) | XML — `profiles/url-filtering/entry/{category}/action` | Bloquear ambas acciones en categorías de alto riesgo | |
| URL Filtering — settings | Cloud Inline Categorization habilitado; Domain Credential Filter activo | XML — `url-filtering-settings`, `credential-enforcement` | Habilitar ambos | |
| File Blocking — Rules | Bloqueo de extensiones de riesgo (7z, bat, chm, cpl, dll, hta, jar, ocx, pif, scr, torrent, vbe, wsf, cab, exe, PE, rar, encrypted-zip/rar) inbound/outbound; alert en el resto | XML — `profiles/file-blocking/entry/rules/entry` | Definir reglas por dirección con tipos de alto riesgo bloqueados | |
| WildFire Analysis — Rules | Cobertura de application/file-type con análisis configurado | XML — `profiles/wildfire-analysis/entry/rules/entry` | Consolidar perfiles redundantes | |
| Security Profile Group | Cada grupo con los 6 perfiles asignados (AV, AS, VP, URL, FB, WF), ninguno en "None" | XML — `profile-group/entry` | Completar grupos incompletos; reducir cantidad de grupos al mínimo necesario | |
| Perfiles duplicados Shared vs. Device Group | Mismo nombre de perfil con config distinta entre Shared y un Device Group | XML — comparación algorítmica `shared/profiles/*` vs `device-group/entry/profiles/*` | Homogenizar o consolidar en Shared | |

## Security Evaluation — Adopción de Funcionalidades de Seguridad (Feature Adoption)

Categoría propia (no subapartado de Security Policies Evaluation): es un scorecard de
porcentajes, no una lista de hallazgos, y mezclarla ahí le hacía perder visibilidad. Métrica
ejecutiva complementaria a la lista de Recommendations: en vez de contar violaciones ("N
reglas con ANY"), mide el **% de reglas de seguridad que SÍ tienen cada control aplicado**.
Replica el widget nativo "Feature Adoption" de PAN-OS (Dashboards, PAN-OS 10.1+) — **100%
derivable del Backup XML** (conteo estructural sobre `rulebase/security/rules/entry`, sin
logs ni tráfico real). Un valor en 0% en cualquier categoría es una señal fuerte de gap de
seguridad y vale la pena destacarlo en el Executive Summary si aparece. Va en formato de tabla
compacta (no el patrón Device/Findings/Recommendations/References — ver `SKILL.md`).

| Categoría | Qué mide (% de reglas allow que cumplen) | Tag XML relevante |
|---|---|---|
| App-ID | `application` ≠ `any` | `rule/application` |
| User-ID | `source-user` ≠ `any` | `rule/source-user` |
| Service/Port | `service` = `application-default` (no puerto custom ni `any`) | `rule/service` |
| Zone Protection | Zonas con `zone-protection-profile` asignado / total de zonas | `zone/entry/zone-protection-profile` |
| Logging | `log-setting` asignado (+ `log-end`) | `rule/log-setting`, `rule/log-end` |
| Log Forwarding Profiles | Perfil de log forwarding asignado | `rule/log-setting` (referencia al profile) |
| URL Filtering Profiles | Perfil URL Filtering asociado | `rule/profile-setting` |
| File Blocking Profiles | Perfil File Blocking asociado | `rule/profile-setting` |
| WildFire Analysis Profiles | Perfil WildFire Analysis asociado | `rule/profile-setting` |
| Vulnerability / Anti-Spyware / Antivirus Profiles | Cada perfil de Threat Prevention asociado | `rule/profile-setting` |
| Data Filtering | Perfil Data Filtering asociado (DLP básico) | `rule/profile-setting` |
| Credential Theft Prevention | Anti-Spyware profile con detección de robo de credenciales habilitada | `profiles/spyware/entry/botnet-domains` (credential-phishing-prevention) |
| DNS Security | Anti-Spyware profile con DNS Security habilitado, en reglas activas | `profiles/spyware/entry/botnet-domains/dns-security-categories` |

Calcula el "% Promedio Adoptado" como el promedio simple de las categorías con datos
disponibles. Reporta solo esta tabla-resumen (no la repitas como hallazgos individuales en la
lista de Recommendations priorizada, salvo que un valor en 0%/muy bajo amerite destacarse ahí
por su impacto).

## Checks descartados — NO intentar evaluar (fuera de alcance de XML/TSF)

- ACC / Traffic / Threat logs, Correlated Events, Botnet, System logs — requieren logs en vivo.
- BPA (score agregado de Strata Cloud) — requiere API externa; el skill solo lo reporta si el
  dato ya viene incluido en el input, como un check más dentro de "Best Practices Evaluation"
  (ver `SKILL.md`) — nunca lo calcules ni lo estimes tú mismo.
- Unused Applications (Apps Allowed vs. Apps Seen) y App Dependency — requieren estadística de
  uso real de aplicaciones (Policy Optimizer / Content Release), no expuesta en un `show`
  operacional estándar.
- Interzone/Intrazone — "Hits" y "Apps Seen" del rulebase — requieren estadística de tráfico.
- Tráfico real observado sobre QUIC / DNS-over-HTTPS/TLS — la existencia de la política de
  bloqueo sí es derivable del XML; la evidencia de tráfico real no.
- Admin Roles — "Access Domain" — constructo exclusivo de Panorama, no existe en el
  running-config de un firewall standalone.
- Platform Capacity como techo fijo por modelo — ver `pan-platform-limits.md` (usar el comando
  `show system state filter cfg.general.max*` del propio TSF en vez de una tabla externa).
