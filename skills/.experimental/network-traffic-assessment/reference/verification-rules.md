# Por qué las reglas de verificación de rutas/tags son como son

El `SKILL.md` (sección "Regla de oro") tiene el procedimiento operativo corto de
las dos reglas de abajo. Esto es la evidencia y el razonamiento completo detrás
de cada una — leelo si necesitás entender por qué existen, no para seguirlas
paso a paso (eso ya está en el `SKILL.md`).

## Nunca supongas una ruta/tag — verificala

Esta regla aplica a **cualquier** tag XML, marcador `> show ...` de TSF, o nombre de campo que
vayas a citar — no es específica de un check. El esquema de PAN-OS cambia entre versiones (ej.
Telemetry vivía en `deviceconfig/setting/telemetry` en versiones antiguas y se movió a
`deviceconfig/system/device-telemetry` en PAN-OS 10.x+ — un caso real detectado en un assessment
donde la ruta vieja, ya inexistente, llevó a reportar "Telemetry deshabilitado" cuando en
realidad **sí** estaba habilitado bajo la ruta nueva). Los checklists de `reference/` documentan
la ruta más probada hasta ahora, no una garantía para toda versión de PAN-OS.

Procedimiento completo, con el detalle de cada paso:

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

## Un tag puede existir en más de un lugar del documento — no agregues sin verificar el dueño

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

Procedimiento completo, con el detalle de cada paso:

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

## Por qué son dos reglas separadas

La regla de Telemetry protege contra asumir que un tag no existe cuando en realidad
vive en otra ruta (falso negativo). La segunda protege del error inverso: agregar de más porque
el tag sí existe, pero en varios lugares con dueños/scopes distintos (falso positivo por
mezcla). Son dos modos de falla distintos, documentados por separado a propósito — no es
redundancia.
