# Ejemplo de referencia (FICTICIO) — Health Check / Assessment de firewall Palo Alto

> Datos completamente ficticios (cliente, IPs, nombres) — no está basado en un cliente real.
> Muestra el **patrón de presentación** (portada, Recommendations priorizadas, checks en
> formato Device/Findings/Recommendations/References) y cómo el análisis de arquitectura de
> `heuristics.md` se incorpora dentro de "Network Evaluation". No copies estos datos a un
> informe real — cada informe sale exclusivamente del Backup XML/TSF del cliente evaluado.
> Extracto representativo, no exhaustivo: en un informe real hay más checks por categoría,
> solo los que tengan datos que respalden un hallazgo.

---

## Portada

**Health Check / Assessment — Firewall Palo Alto Networks**
Prepared for: CLIENTE-DEMO
Date: 2026-08-10
Prepared by: [Nombre del analista], SEK
Version number: 1.0

## Notices / Disclaimer

Este documento contiene información confidencial preparada por SEK para CLIENTE-DEMO. Su
distribución está sujeta a los términos del acuerdo de servicios vigente entre ambas partes.

## Índice

*(Se construye al final, con un enlace de ancla por cada encabezado `##`/`###` que quedó en el
informe — ver SKILL.md Paso 3. Extracto ilustrativo, con sangría por nivel:)*

- [Executive Summary](#executive-summary)
- [Scope](#scope)
- [Recommendations](#recommendations)
- [FW-DEMO-01 › System Evaluation](#fw-demo-01--system-evaluation)
  - [Licensing](#licensing)
- [FW-DEMO-01 › Health Checks status](#fw-demo-01--health-checks-status)
  - [Disk space](#disk-space)
  - [Disk Log Usage](#disk-log-usage)
- [FW-DEMO-01 › Security Evaluation](#fw-demo-01--security-evaluation)
- [FW-DEMO-01 › Best Practices Evaluation](#fw-demo-01--best-practices-evaluation)

## Executive Summary

Este informe evalúa el firewall Palo Alto Networks PA-440 "FW-DEMO-01" de CLIENTE-DEMO, a
partir del backup de configuración (XML) y el Tech Support File (TSF). El equipo opera en
PAN-OS 11.1.10-h10 con el virtual router VR_DEMO, enrutamiento exclusivamente estático (78
rutas estáticas, 13 conectadas, sin BGP/OSPF).

El hallazgo más relevante es un **bypass este-oeste**: 47 segmentos internos se enrutan hacia
un único siguiente salto (172.19.93.98) sin ser inspeccionados por el firewall, habilitando
movimiento lateral no controlado. Se identifican además brechas de hardening del plano de
gestión (sin Trusted Hosts definidos) y de perfiles de seguridad (Zone Protection no aplicado
en ninguna zona). El detalle y las recomendaciones se desarrollan en las secciones siguientes.

## Scope

| Dispositivo | Modelo | Versión | Virtual Systems |
|---|---|---|---|
| FW-DEMO-01 | PA-440 | PAN-OS 11.1.10-h10 | Single-vsys |

## Recommendations

**Crítico**
- Bypass este-oeste: 47 segmentos internos se enrutan a un único siguiente salto
  (172.19.93.98) por ethernet1/3, sin inspección del firewall. Rediseñar la segmentación
  llevando las VLAN internas al firewall con zonas por función.

**Alto**
- No hay Trusted Hosts (permitted-ip) definidos para el acceso de gestión. Restringir el
  acceso administrativo a las IPs/redes autorizadas del equipo de operaciones.
- Túnel VPN con proxy-ID 0.0.0.0/0 (selector universal): VPN-SITIOB. Restringir el proxy-ID a
  las redes estrictamente necesarias en ambos extremos.
- 2 reglas de seguridad con aplicación 'any' en modo allow. Reemplazar por App-ID explícitas
  con application-default.

**Importante**
- Zonas huérfanas sin interfaz asociada: LAN.HUERFANA-1, WAN.HUERFANA-1. Depurar zonas y
  reglas no utilizadas.
- Ninguna zona tiene Zone Protection Profile aplicado. Aplicar a todas las zonas, empezando
  por las de borde norte-sur.

**Bajo**
- Interfaces físicas sin uso ni zona: ethernet1/6, ethernet1/7, ethernet1/8. Mantener
  administrativamente deshabilitadas.

**Otras Recomendaciones**
- Mantener el ciclo de mantenimiento preventivo: vigencia de firmas (Threat/AV/WildFire),
  perfiles de seguridad en reglas de permitido, respaldos de configuración.

---

## FW-DEMO-01 › System Evaluation

#### Licensing

**Device / Observación**: FW-DEMO-01 — suscripciones activas: Threat Prevention, URL
Filtering. Sin Advanced WildFire ni DNS Security licenciados.

**Findings**:
- No se detectan suscripciones de Advanced WildFire ni DNS Security en el TSF.

**Recommendations**:
- Evaluar la adquisición de Advanced WildFire y DNS Security para ampliar la cobertura de
  Threat Prevention.

---

## FW-DEMO-01 › Health Checks status

#### Disk space

**Device / Observación**: FW-DEMO-01 — `show system disk-space`.

| Filesystem | Size | Used | Avail | Use% | Mounted on |
|---|---|---|---|---|---|
| /dev/md2 | 38G | 7.7G | 29G | 22% | / |
| /dev/md5 | 46G | 7.1G | 36G | 17% | /opt/pancfg |
| /dev/md6 | 23G | 8.2G | 14G | 39% | /opt/panrepo |
| /dev/md8 | 73G | 633M | 68G | 1% | /opt/panlogs |
| /dev/md9 | 1.8T | 309M | 1.7T | 1% | /opt/panraid/ld1 |

*(Tabla completa — todas las filas que trae `show system disk-space` en el TSF, no una
selección. Así se reportan también Software process status y Files Core Dump: son checks de
"inventario", no de resumen — ver SKILL.md › "Datos completos, no solo el comando".)*

**Findings**:
- Ninguno — todos los filesystems están por debajo del umbral de atención (75-80%).

**Recommendations**:
- Ninguna.

#### Disk Log Usage

**Device / Observación**: FW-DEMO-01 — `show system logdb-quota`: Unallocated 12% del total.

**Findings**:
- Ninguno — Unallocated está sobre el 9% recomendado.

**Recommendations**:
- Ninguna.

**Referencias**: [How to Display Log Database Disk Space](https://knowledgebase.paloaltonetworks.com/KCSArticleDetail?id=kA10g000000Cld2CAC)

---

## FW-DEMO-01 › Security Evaluation

### Feature Adoption

| Categoría | % Adoptado |
|---|---|
| App-ID | 22% |
| User-ID | 3% |
| Zone Protection | 0% |
| Logging | 99% |
| URL Filtering Profiles | 96% |

Promedio adoptado: 44%. Zone Protection en 0% es una señal fuerte de gap — coincide con el
hallazgo ya listado en Recommendations.

---

## FW-DEMO-01 › Best Practices Evaluation

### Device Evaluation

#### Password Management

**Device / Observación**: Complejidad de contraseñas habilitada, longitud mínima 8.

**Findings**:
- Ninguno — cumple con la buena práctica de longitud mínima.

**Recommendations**:
- Ninguna.

**Referencias**: [Administrative Access Best Practices](https://docs.paloaltonetworks.com/pan-os/9-0/pan-os-admin/getting-started/best-practices-for-securing-administrative-access)

#### Permitted IP Addresses (gestión)

**Device / Observación**: Lista de Permitted IP Addresses vacía.

**Findings**:
- No hay Trusted Hosts definidos para el acceso de gestión.

**Recommendations**:
- Restringir el acceso administrativo a las IPs/redes autorizadas del equipo de operaciones.

**Referencias**: [Administrative Access Best Practices](https://docs.paloaltonetworks.com/pan-os/9-0/pan-os-admin/getting-started/best-practices-for-securing-administrative-access)

### Network Evaluation

*(Aquí vive el análisis de arquitectura/segmentación — diferencial de este skill.)*

#### Diagrama de Arquitectura de Red

Internet → ethernet1/2 (WAN.SITIO-A) / ethernet1/1 (WAN.SITIO-B) → FIREWALL PA-440 →
ethernet1/4 (RED_CCTV), ethernet1/5 (LAN_SUCURSAL), ethernet1/3 (LAN.TRANSITO-NUCLEO) →
Núcleo 172.19.93.98 (47 subredes internas, este-oeste sin inspección).

*(En el informe real: bloque Mermaid siguiendo `diagram-palette.md`.)*

#### Interfaces de Red, IP y Zonas de Seguridad

| Interfaz | Zona | IP | Comentario |
|---|---|---|---|
| ethernet1/3 | LAN.TRANSITO-NUCLEO | 172.19.93.97/29 | Interfaz de tránsito al núcleo interno |
| ethernet1/5 | LAN_SUCURSAL | 192.168.10.4/24 | |

#### Bypass este-oeste

**Device / Observación**: FW-DEMO-01 — 47 segmentos internos con next-hop 172.19.93.98 por
ethernet1/3; tabla ARP de esa interfaz: 1 sola entrada (172.19.93.98).

**Findings**:
- Bypass este-oeste confirmado: el tráfico lateral entre las 47 subredes internas nunca pasa
  por el firewall — se enruta localmente en el núcleo.

**Recommendations**:
- Rediseñar la segmentación: llevar las VLAN internas al firewall con zonas por función y
  aplicar políticas inter-VLAN de mínimo privilegio.

#### Zone Protection Profile

**Device / Observación**: FW-DEMO-01 — 5 zonas configuradas, 0 con Zone Protection Profile
asignado.

**Findings**:
- Ninguna zona tiene Zone Protection Profile aplicado (Flood/Reconnaissance/Packet-Based
  Attack Protection sin cobertura).

**Recommendations**:
- Aplicar Zone Protection Profile a todas las zonas, empezando por las de borde norte-sur.

**Referencias**: [DoS and Zone Protection Best Practices](https://docs.paloaltonetworks.com/best-practices/dos-and-zone-protection-best-practices/dos-and-zone-protection-best-practices)

### Security Policies Evaluation

#### Reglas con aplicación ANY en modo allow

**Device / Observación**: FW-DEMO-01 — 78 reglas totales (63 allow, 15 deny, 1 deshabilitada);
2 reglas allow con `application: any`.

**Findings**:
- Regla "Rule-12" y "Rule-45" permiten `application: any`.

**Recommendations**:
- Reemplazar `application: any` por App-ID explícitas con `application-default`.

**Referencias**: [Security Policy Best Practices](https://docs.paloaltonetworks.com/best-practices/security-policy-best-practices)

### Security Profiles Evaluation

#### Anti-Spyware — Signature Policies

**Device / Observación**: Perfil "default" — severidad Critical/High en modo alert (no
reset-both).

**Findings**:
- Las firmas Critical/High no están configuradas en modo de prevención activa.

**Recommendations**:
- Ajustar la acción de Critical/High/Medium a `reset-both` en el perfil Anti-Spyware.

---

*(Fin del extracto de referencia — un informe real incluye todos los checks con hallazgo
que las condiciones del Backup XML/TSF del cliente respalden, ni más ni menos.)*
