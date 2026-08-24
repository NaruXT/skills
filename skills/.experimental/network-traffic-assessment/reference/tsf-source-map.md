# Mapa de fuentes: Tech Support File / Backup XML → Secciones del Informe

> **Documento vivo**: copiado desde el `TSF_SOURCE_MAP.md` original de Josué. Sigue
> alimentándose con nuevos marcadores/tags a medida que aparezcan en assessments reales.
> Úsalo para saber exactamente dónde buscar cada dato dentro de un TSF o Backup XML de
> miles de líneas, en vez de explorar el archivo a ciegas — reduce el riesgo de ubicar mal
> un dato o pasar por alto una sección, consistente con la regla de "no inventar" del skill.

Referencia para saber, dado un punto del informe generado por el portal
(`apps/scm-backend/PAN_Traffic_Assessment_Portal.html`), en qué parte del
Tech Support File (TSF) o del backup de configuración hay que buscar para
verificar o depurar el dato. Incluye Palo Alto Networks (PAN-OS) y
FortiGate, que usan convenciones de marcador distintas.

## 1. Cómo llega el material al frontend

1. El usuario sube el `.tgz`/`.tar.gz` del TSF. El backend lo procesa en
   `POST /api/extract-ts` (`apps/scm-backend/app.py:477-536`) y separa dos
   bloques de texto:
   - **`xml`** — el archivo de configuración: prioriza
     `*merged-running-config.xml`, si no existe usa `*running-config.xml`,
     si no existe cualquier `*.xml` con "config" en el nombre
     (`app.py:496-506`). En FortiGate esto normalmente queda vacío (Forti no
     entrega XML) y el análisis usa el bloque de texto en su lugar.
   - **`txt`** — concatenación de todos los archivos de texto (no XML) del
     `.tgz` cuyo nombre matchee `NAME_RE` (`rout|arp|ospf|bgp|vpn|ipsec|
     interface|fib|neighbor|summary|global.protect`, `app.py:508`) o cuyo
     contenido contenga alguna de las strings de `STRONG`
     (`a:active`, `neighbor address:`, `vpn ipsec-sa`, `vpn tunnel`,
     `routing summary`, `gwid`, `peer group`, `show routing route`,
     `arp all`, `flags: a` — `app.py:509-510`). Cada archivo incluido queda
     delimitado por un marcador `===== <nombre_de_archivo> =====`
     (`app.py:525`).
2. El frontend recibe `xml` + `txt` y corre uno de tres analizadores según
   detecte el tipo de config:
   - `analyzePano(xmlText, txt)` — HTML:467 — Panorama/SCM (`<device-group>`
     + `<template>` en el XML). **No usa Tech Support**, ver §4.
   - `analyze(xmlText, txt)` — HTML:864 — firewall PAN-OS individual.
   - `analyzeForti(conf, log)` — HTML:630 — FortiGate individual (`conf` es
     el `.conf`/`show full-configuration`, `log` es la salida de comandos
     de diagnóstico).
3. El informe de un firewall individual (secciones 1–12 abajo) lo arma
   `renderMain()` (HTML:1524). El informe de Panorama (secciones 1–8) lo
   arma `renderPano()` (HTML:1450).

### Convención de marcador por fabricante (dentro del bloque `txt`/`log`)

| Fabricante | Convención | Función que la lee |
|---|---|---|
| PAN-OS | Prompt de CLI operacional: la línea empieza con `>` seguida del comando (`> show arp all`, `> show routing route`, etc.). Cada bloque termina en el siguiente prompt `>`. | `cmdText()` HTML:1002, búsquedas directas `T.search(/>\s*.../ )` |
| FortiGate | Encabezado `### <comando>` (una línea que empieza literalmente con `### `). Cada bloque termina en el siguiente `### `. | `_logBlock()` HTML:628 |
| FortiGate (config) | Bloques `config <sección> ... end` del `.conf`/backup de CLI (no XML). | `_fBlock()`/`_fEdits()`/`_fSet()` HTML:623-627 |

---

## 2. Palo Alto Networks — Informe de firewall individual (`analyze`, HTML:864)

| # Sección | Dato (`d.xxx`) | Fuente | Bloque/tag exacto |
|---|---|---|---|
| 1. Resumen Ejecutivo | agregado | — | Sin fuente propia; combina campos ya resueltos en las demás secciones. |
| 2. Diagrama de Red | `d.zones`, `d.ifaces`, `d.core`, `d.tunnels` | derivado | Reusa lo ya parseado en zonas/interfaces/rutas (no hay tag nuevo), función `diagram()` HTML:1152. |
| 3. Interfaces / Zonas | `d.zones` | XML | tag `<zone>` → `<network><member>` (HTML:870-878) |
| | `d.ifaces` | XML | tags `<ethernet>` y `<tunnel>` → `<layer3><ip>`/`<units>` (HTML:881-901) |
| 4. Protocolos de Enrutamiento | `d.vrs`, `d.rprot` (bgp/ospf/rip on+n) | XML | tag `<virtual-router><entry><protocol><bgp|ospf|ospfv3|rip><enable>` (HTML:906-912); conteos también cruzan con resumen operacional `rs` (ver 5) |
| 4.x Vecinos OSPF | `d.ospfNbr` | TSF (texto) | `> show routing protocol ospf neighbor` — parseo clave:valor (`neighbor address`, `status`, `neighbor router id`, `area id`, `virtual router`) — HTML:1005-1010 |
| 4.x Peers BGP | `d.bgpPeers` | TSF (texto) | `> show routing protocol bgp peer` (excluye `peer-group`) — claves `peer`, `remote as`, `peer status`, `remote address`, `virtual router` — HTML:1011-1017 |
| 4.x Next-hop interno (núcleo) | `d.core`/`d.coreN` | derivado | Next-hop con más rutas dentro de `d.routeTable` (ver 5.4), no es un tag propio. |
| 4.x Peers VPN IPSec | `d.gws` | XML | tag `<gateway><entry><peer-address><ip\|dynamic>`, `<local-address><interface\|ip>` (HTML:926-930) |
| | `d.ipsec` | XML | tag `<ipsec><entry><tunnel-interface>`, `<ike-gateway><entry name>`, `<proxy-id><entry><local\|remote>` (HTML:935-944) |
| 5.1 Rutas por defecto | `d.defaults` | derivado | Filtra `d.routeTable` por `dest === "0.0.0.0/0"` |
| 5.4 Rutas por Next-Hop | `d.routeTable` | TSF (texto), preferente | `> show routing route` — termina en `total routes shown` — cada línea con formato `<destino> <next-hop> <métrica> ... <interfaz>` (HTML:966-972) |
| | resumen `d.rs` (total/static/connected/bgp/ospf/rip) | TSF (texto) | líneas de resumen `All Routes (total): N`, `Static Routes (total): N`, `Connect Routes (total): N`, `BGP Routes (total): N`, `OSPF Routes (total): N`, `RIP Routes (total): N` — típicamente encabezan la salida de `> show routing route` (HTML:963) |
| | fallback si no hay `> show routing route` en el TSF | XML | tag `<virtual-router><routing-table><static-route><entry>` (HTML:913-919), usado vía `d.vrs[0].routes` |
| 5.5 Tabla ARP | `d.arp` | TSF (texto) | `> show arp all` — termina antes de `> show neighbor|mac|vlan` — resumen `total ARP entries in table: N`; cada fila `<interfaz> <ip> <mac> ... <estado> <ttl>` (HTML:976-983) |
| 6. Túneles S2S | `d.vpnS2S`, `d.vpnTotals` | XML + TSF | Definición desde `<gateway>`/`<ipsec>` (igual que 4.x); estado activo/inactivo desde `> show vpn ipsec-sa` — resumen `total X tunnels found. Y ipsec sa found` (HTML:1023, `tblAfter()` HTML:1018) |
| 6.2 Higiene VPN (objetos sin uso) | `d.vpnHygiene` | XML | Compara `<gateway>` y `<ipsec>` en uso contra catálogos `<ike-crypto-profiles>` y `<ipsec-crypto-profiles>` (HTML:1103-1110). **Solo PAN**, no existe en FortiGate. |
| 7. GlobalProtect | `d.gp.portals/gateways` | XML | tags `<global-protect-portal>` y `<global-protect-gateway>` → `<local-address>`, `<ip-pool>`, `<access-route>` (HTML:1042-1057) |
| | `d.gp.users` (usuarios conectados) | TSF (texto) | `Total Current Users:` o `Current Users:` — típicamente salida de `> show global-protect-gateway current-user` (HTML:1058) |
| 8. Políticas de Seguridad | `d.secpol` | XML | tag `<security><rules><entry>` → `<action>`, `<disabled>`, `<application>`, `<source>`, `<destination>`, `<service>`, `<profile-setting>`, `<log-end>` (HTML:1062-1080) |
| 9.1 Cuentas de administrador | `d.hard.admins` | XML | tag `<mgt-config><users><entry>` → rol por `<permissions><superuser\|superreader\|device-admin\|role-based>` (HTML:1092-1096) |
| 9. Hardening — IPs de gestión permitidas | `d.hard.trusted` | XML | tag `<system><permitted-ip><entry>` (HTML:1084) — **el mismo nombre de tag `<permitted-ip>` también existe bajo `network/profiles/interface-management-profile/entry/permitted-ip`** (feature distinto: IPs permitidas de un perfil de gestión de interfaz, no el Permitted IP Addresses del dispositivo). El portal (`d.hard.trusted`) resuelve esto navegando el ancestro exacto `deviceconfig/system`, no con una búsqueda global de tag — replica ese mismo criterio al leer el XML a mano (ver "Un tag puede existir en más de un lugar del documento" en `SKILL.md`), nunca sumes ambas ubicaciones en un solo hallazgo |
| 9. Hardening — política de contraseña | `d.hard.pwd` | XML | tag `<password-complexity><enabled>`/`<minimum-length>` (HTML:1086-1087) |
| 9. Hardening — NTP/DNS | `d.hard.ntp`/`d.hard.dns` | XML | tags `<ntp-servers><primary-ntp-server\|secondary-ntp-server>`, `<dns-setting><primary\|secondary>` (HTML:1088-1091) |
| 9. Hardening — sincronización NTP | `d.hard.ntpSync` | TSF (texto) | strings `synchronized` / `not synchronized` en el texto completo — típicamente de `> show ntp` (HTML:1100) |
| 9. Hardening — HA | `d.hard.ha` | XML | tag `<high-availability>` → `<active-passive>`/`<active-active>`/`<group><enabled>`/`<peer-ip>` (HTML:1098-1099) |
| 9.2 CVE | versión usada en la consulta | TSF (texto) | línea `sw-version: X.Y.Z` — típicamente cabecera de `> show system info` (junto con `hostname:` y `model:`, HTML:960-962). La consulta en sí pega a `security.paloaltonetworks.com` (`app.py:1013-1050`), no lee el TSF de nuevo. |
| 10. Hallazgos y Recomendaciones | `buildFindings(d)` | derivado | Reglas heurísticas sobre los campos ya resueltos arriba (HTML:1115 en adelante); no lee el TSF directamente. |
| 11. Postura BPA (Strata Cloud) | `r.bpaSummary` | Externo (SCM API) | Se sube el **XML completo** (el mismo `running-config.xml` extraído del TSF) al Best Practice Assessment de Strata Cloud Manager — `POST /api/bpa`, `app.py:339-437`. No es una búsqueda de tag puntual: SCM evalúa todo el archivo. |
| 12. Objetos en Desuso e Higiene | `d.hygiene` | XML | Análisis de alcanzabilidad sobre `<address>`, `<address-group>`, `<service>`, `<service-group>`, `<application-group>`, `<application-filter>` vs. lo referenciado en `<security><rules>` (HTML:783-862, `hygieneScan()`). |

---

## 3. FortiGate — Informe de firewall individual (`analyzeForti`, HTML:630)

FortiGate no trae XML: todo sale del **texto de configuración** (`conf`,
formato `config <bloque> ... end` / `edit "<nombre>" ... next`) y del
**log de diagnóstico** (`log`, con marcadores `### <comando>`).

| # Sección | Dato (`d.xxx`) | Fuente | Bloque/comando exacto |
|---|---|---|---|
| Device / modelo / versión | `device`, `model`, `sw` | conf (texto) | primera línea `#config-version=<modelo>-<versión>-...` del backup de config (HTML:633-637); `device` también puede salir de `set hostname`/`set alias` dentro de `config system global` |
| 3. Interfaces / Zonas | `zones` | conf | bloque `config system zone` → `edit "<zona>"` → `set interface <miembros>` (HTML:641) |
| | `ifaces` | conf | bloque `config system interface` → `set ip`, `set description`, `config secondaryip` (HTML:645-650) |
| 4. Enrutamiento — config estática | `staticRoutes` | conf | bloque `config router static` → `set dst`, `set gateway`, `set device` (HTML:654) |
| 4/5. Enrutamiento — tabla activa | `routeTable` | log | `get router info routing-table all` (marcador `### get router info routing-table all`) — líneas `<flags> <destino> ... via <next-hop>, <interfaz>` o `directly connected, <interfaz>` (HTML:658-668). Si el log no trae esta salida, cae a `staticRoutes` de la config. |
| | resumen `rs` | derivado | Se calcula contando flags (`S`/`C`/`O`/`B`/`R`) de `routeTable`, no hay resumen de texto como en PAN (HTML:671-672) |
| 4. Enrutamiento dinámico (on/off) | `rprot.ospf/bgp.on` | conf | presencia y contenido de `config router ospf` (`set router-id`, `config area`, `config network`) y `config router bgp` (`set as`, `config neighbor`) (HTML:686-689) |
| 4.x Vecinos OSPF/BGP | `ospfNbr`, `bgpPeers` | — | **No implementado para FortiGate** (arrays vacíos, HTML:692) — no hay parseo de `get router info ospf neighbor` / `get router info bgp summary`. |
| 5.5 ARP | `arp` | log | `diagnose ip arp list` (marcador `### diagnose ip arp list`) — líneas `ifname=<iface> <ip> <mac>` (HTML:676-677) |
| 6. Túneles S2S — config | `gws`, `ipsec` (vía `ph1`/`ph2`) | conf | bloques `config vpn ipsec phase1-interface` (gateway/peer) y `config vpn ipsec phase2-interface` (proxy-ID / `src-subnet`, `dst-subnet`) (HTML:695-698) |
| 6. Túneles S2S — estado activo | `vpnS2S[].active` | log | `get vpn ipsec tunnel details` (marcador `### get vpn ipsec tunnel details`) — por túnel, `rx packets:`/`tx packets:` > 0 (HTML:700-703) |
| 6.2 Higiene VPN | — | — | **No implementado para FortiGate** (`d.vpnHygiene` no existe en el retorno de `analyzeForti`, HTML:781); la sección 6.2 del informe no se renderiza para Forti. |
| 7. SSL-VPN (equivalente GlobalProtect) | `gp` | conf | bloques `config vpn ssl settings` (puerto, interfaz origen, grupos) y `config vpn ssl web portal` (pools, rutas de split-tunnel) (HTML:727-745) |
| 8. Políticas de Seguridad | `secpol` | conf | bloque `config firewall policy` → `set action`, `set status`, `set srcaddr/dstaddr/service`, `set utm-status`, `set logtraffic` (HTML:709-723) |
| 9.1 Cuentas de administrador | `hard.admins` | conf | bloque `config system admin` → `set accprofile`; IPs de confianza vía `set trusthost1..10` (HTML:749-751, 757) |
| 9. Hardening — política de contraseña | `hard.pwd` | conf | bloque `config system password-policy` → `set status`, `set minimum-length` (HTML:752-753) |
| 9. Hardening — NTP/DNS | `hard.ntp`/`hard.dns` | conf | bloques `config system ntp` (`set type fortiguard`, `set server`) y `config system dns` (`set primary`/`set secondary`) (HTML:754, 756) |
| 9. Hardening — HA | `hard.ha` | conf | bloque `config system ha` → `set mode` (HTML:759) |
| 9. Hardening — certificados | `hard.certs` | conf | conteo de `edit` dentro de `config vpn certificate local` (HTML:758) |
| 9.2 CVE | versión usada en la consulta | conf (texto) | se extrae del mismo `#config-version=...-<versión>-...` de la cabecera (HTML:635); la consulta pega a NVD (FortiOS), no relee el backup. |
| 11. Postura de hardening (Fortinet) | `bs`/`r.bpaSummary` | — | Heurística local sobre `hard`/`secpol` ya parseados (no hay servicio externo tipo SCM para Forti); ver `renderMain()` HTML:1688-1701, rama `_bt` (bt = "is FortiGate"). |
| 12. Objetos en Desuso | `hygiene` | conf | Igual que PAN pero desde texto: `config firewall address`, `config firewall addrgrp`, `config firewall service custom`, `config firewall service group`, comparados contra lo referenciado en `config firewall policy` (HTML:762-779). Nota: no cubre `application-group`/`application-filter` (Forti no los tiene). |

---

## 4. Fuera del alcance del Tech Support (para no buscar tags que no existen)

- **Informe de Panorama/SCM** (`renderPano()`, secciones 1–8, HTML:1450):
  inventario de firewalls, device groups, templates, higiene de reglas y BPA
  vienen de la **API de Strata Cloud Manager** (`app.py:335` en adelante),
  no de un Tech Support File. Se detecta un XML de Panorama por la
  presencia de `<device-group>` y `<template>` (`isPanoramaXml()`, HTML:466).
- **Sección 11 en el informe de PAN (BPA)**: aunque el insumo es el XML
  extraído del TSF, el resultado no sale de parsear tags localmente sino de
  la respuesta del servicio SCM BPA — para depurar un check puntual hay que
  mirar la respuesta de `/api/bpa`, no buscar un tag en el XML.
- **CVE (sección 9.2)**: la versión sale del TSF (ver tablas arriba), pero
  los CVE en sí vienen de Security Advisories de Palo Alto (PAN-OS) o del
  NVD (FortiOS) vía `app.py:1013` y endpoints equivalentes para Forti — no
  están en el Tech Support.
- **Exportaciones a Excel** (ARP §5.5, rutas §5.4, higiene VPN §6.2, objetos
  en desuso §12, BPA §11): no vuelven a leer el TSF; usan los mismos
  arreglos (`d.arp.rows`, `window.__nhGroups`, etc.) ya resueltos en
  memoria por el analizador.

## 5. Cómo verificar un dato puntual contra el TSF crudo

1. Descomprime el `.tgz`/`.tar.gz` (`tar -xzf archivo.tgz`).
2. Si es PAN-OS: abre el archivo de texto que contenga el comando de
   interés (busca por el nombre del comando, ej. `grep -rl "show arp all"`)
   y ubica el bloque entre el prompt `>` del comando y el siguiente `>`.
3. Si es FortiGate: busca la línea literal `### <comando>` (ej.
   `grep -n "^### " archivo.log`) para encontrar dónde empieza y termina
   cada bloque de diagnóstico.
4. Para tags XML (solo PAN-OS): abre `running-config.xml` o
   `merged-running-config.xml` y busca el tag indicado en la tabla (ej.
   `grep -n "<global-protect-portal" running-config.xml`).
