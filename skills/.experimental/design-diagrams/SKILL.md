---
name: design-diagrams
description: Diagrama, en etapa de planeación, el diseño de una feature o sistema que todavía no existe en código (o que existe pero se está rediseñando) — sin necesitar un repo real. Cubre 8 tipos (sequence, class, state, use-case, component, architecture, workflow, dataflow), inferidos por el tema de lo que se está diseñando, con Mermaid puro validado contra el parser oficial de mermaid.js antes de darse por terminado. Invocable standalone o desde /shaping, /breadboarding, /to-spec, /to-tickets, /create-plan. Usar cuando el usuario pida "diagramame cómo debería quedar X", "antes de escribir código, diagramá el flujo/las clases/los estados propuestos", "diseñame un diagrama de secuencia/clases/estados/casos de uso para esto que estamos planeando" — incluso con repo existente, mientras el diagrama describa un diseño target, no el código actual. No usar cuando ya existe el código y se quiere documentar/diagramar lo que YA hace (para eso, architecture-map).
---

# Design Diagrams

Traduce una descripción de diseño (de ideación, planeación, o la conversación
en curso) en uno o más diagramas Mermaid, sin exigir que exista un repo real
detrás. Nunca inventa detalles que no surgieron de la conversación ni del
contexto disponible — si falta información, pregunta antes de generar.

Salida: **solo `.md`**, nada más — mismo principio que `architecture-map`. No
hay SVG, no hay HTML, no hay render paralelo: GitHub/GitLab/el editor de quien
lo lea van a renderizar exactamente el texto Mermaid con su propio motor.

## Límite con architecture-map

Esta skill diagrama un **diseño target** — algo que todavía no existe en
código, o que existe pero se está rediseñando. Si el pedido es documentar lo
que el código **ya hace**, con evidencia real del repo, eso es trabajo de
`architecture-map`, no de esta skill — incluso si hay un repo real presente:
el eje no es "¿hay repo?" sino "¿el diagrama describe el código actual, o un
diseño que el código todavía no refleja?".

## Sugerencia de modelo

Esta skill corre inline, con el modelo que ya tenga la sesión activa — no
puede forzar uno propio. Al arrancar, si la sesión no está en Opus, sugerí
explícitamente cambiar con `/model` para el trabajo de planeación (más
razonamiento) — es una sugerencia, nunca un bloqueo: seguí con el modelo
actual si el usuario no cambia.

## Paso 0: Reunir contexto

Tomá la información de tres fuentes, en este orden de preferencia:

1. La conversación en curso (si esta skill fue invocada desde dentro de
   `/shaping`, `/breadboarding`, `/to-spec`, `/to-tickets`, `/create-plan`,
   usá el contexto que esa conversación ya construyó).
2. Documentos de ideación/planeación ya existentes en el repo, si el usuario
   los señala.
3. Lo que el usuario te describe directamente en este mismo pedido.

No explores el repo en busca de código real para fundamentar el diagrama —
eso es `architecture-map`. Si hay repo, tratalo solo como referencia de
nombres/convenciones existentes si el usuario lo pide, nunca como fuente de
verdad del diseño.

## Paso 1: Detectar información insuficiente

Antes de generar nada, evaluá si lo reunido en el Paso 0 alcanza para
construir el diagrama sin rellenar huecos con suposiciones propias.

- Si alcanza, seguí al Paso 2 sin pedir permiso previo.
- Si no alcanza, preguntá puntualmente lo que falta — una pregunta a la vez,
  no una lista larga de golpe.
- Si, incluso después de preguntar, sigue faltando información suficiente
  para algún tipo de diagrama en particular, **decilo explícito**: qué
  diagrama no vas a generar y qué información puntual falta. Nunca lo omitas
  en silencio ni lo generes incompleto rellenando con suposiciones.

## Paso 2: Inferir el tipo de diagrama

Con la información reunida, decidí cuál(es) de los 8 tipos canónicos aplican
— ver la tabla completa en
[references/diagram-type-guide.md](references/diagram-type-guide.md). Un
mismo pedido puede necesitar más de un tipo; generá cada uno en su propio
archivo.

## Paso 3: Reglas por tipo de diagrama

Antes de dar cualquier diagrama por terminado, seguí dos juegos de reglas:

1. Sintaxis (compartida con `architecture-map`):
   `~/.claude/skills/_shared/mermaid-validate/references/mermaid-syntax-rules.md`
   — son las reglas que hacen que el diagrama pase el Paso 5.
2. Fidelidad de contenido a la conversación, no al código (propia de esta
   skill): sección final de
   [references/diagram-type-guide.md](references/diagram-type-guide.md).

Ninguna de las dos es opcional.

## Paso 4: Redactar cada archivo

**`docs/design.md`** (índice por proyecto — crealo si no existe):

1. `# Design diagrams`
2. Tabla con una fila por diagrama generado: tipo canónico, link relativo al
   archivo, una línea de qué muestra. Antes de generar un diagrama nuevo,
   leé esta tabla para saber qué tipos ya existen para este proyecto.

**`docs/design/<slug>.md`** (uno por diagrama):

1. `# <Título del diagrama>`
2. Un párrafo de contexto: qué caso/feature cubre y de qué conversación o
   documento de planeación salió.
3. El bloque ` ```mermaid ` con el tipo correspondiente.
4. `## Notes` — lo que el diagrama no puede mostrar por sí solo (casos borde
   discutidos, decisiones de diseño que lo respaldan, huecos todavía
   abiertos).
5. Link de vuelta a `[Design overview](../design.md)`.

Nombrá el slug en kebab-case describiendo el contenido, no el tipo:
`docs/design/checkout-flow-sequence.md`, no `docs/design/sequence-1.md`.

## Paso 5: Validar contra el parser oficial

Por cada diagrama escrito (antes de darlo por terminado):

1. Escribí el texto Mermaid (sin el fence, solo el código) a un archivo
   temporal.
2. Corré:
   ```bash
   node ~/.claude/skills/_shared/mermaid-validate/scripts/validate.mjs <temp.mmd>
   ```
3. Si imprime `OK` (exit code 0): borrá el temporal, seguí.
4. Si falla (exit code 1): leé el mensaje de error del parser — corregí el
   `.mmd` (revisá primero las reglas de sintaxis del Paso 3) y volvé a
   validar. No copies el error crudo al `.md` ni al usuario sin antes
   intentar arreglarlo vos mismo.
5. **Máximo 2 rondas de corrección por diagrama.** Si el error persiste,
   marcá ese diagrama como no validado, guardá el mensaje de error crudo del
   parser para incluirlo tal cual en el Paso 6, y seguí con el resto — no
   reintentes indefinidamente sobre uno solo.
6. Borrá el archivo temporal.

Necesita `mermaid` + `jsdom` instalados en
`~/.claude/skills/_shared/mermaid-validate/scripts/` (setup manual, de una
sola vez, compartido con `architecture-map`). Antes de validar, corré el
chequeo de
`~/.claude/skills/_shared/mermaid-validate/references/setup.md`. Si falla,
avisale al usuario y detenete ahí sin instalar nada vos mismo — el resto de
la skill funciona igual sin esto, pero sin garantía de que el Mermaid
generado sea sintácticamente válido.

## Verificación visual (opcional, no es parte del flujo automático)

Dos herramientas — abrir el diagrama en `mermaid.live` para que lo vea el
usuario, o sacarle un screenshot headless para verlo vos mismo — descritas en
`~/.claude/skills/_shared/mermaid-validate/references/visual-verification.md`
(compartido con `architecture-map`). **Ninguna corre sola en el Paso 5.**

Invocalas solo cuando algo concreto está en duda (el usuario reporta que se
ve mal, acabás de aplicar un fix y necesitás confirmarlo) — nunca por rutina
ni "para estar seguro" en una generación normal.

## Paso 6: Reportar

- Lista de archivos creados/actualizados.
- Si algún diagrama no pudo generarse por falta de información (Paso 1) o no
  pudo validarse (Paso 5): decilo explícito, con el detalle puntual.
- Si actualizaste un diagrama existente en vez de crear uno nuevo, decilo —
  y por qué (el diseño cambió, el índice ya tenía ese tipo para el proyecto).

## Referencias

| Archivo | Contenido |
| --- | --- |
| [references/diagram-type-guide.md](references/diagram-type-guide.md) | Type router (tema → tipo canónico), construcción Mermaid por tipo, y las reglas de fidelidad de contenido a la conversación (Pasos 2 y 3) |
| `~/.claude/skills/_shared/mermaid-validate/references/setup.md` | Por qué hace falta `jsdom`, cómo instalar, qué decir si falla el prerequisito — compartido con `architecture-map` (Paso 5) |
| `~/.claude/skills/_shared/mermaid-validate/references/mermaid-syntax-rules.md` | Reglas de sintaxis Mermaid generales y por tipo — compartidas con `architecture-map` (Paso 3) |
| `~/.claude/skills/_shared/mermaid-validate/references/visual-verification.md` | Mecánica de `open-live.mjs` y `screenshot.mjs` — compartido con `architecture-map` (Verificación visual) |
