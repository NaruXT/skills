# Type router y guía de construcción por tipo

Los 8 tipos canónicos, con el tema que dispara cada uno y la construcción
Mermaid correspondiente. Consultá esto en el Paso 2 (inferir tipo) y en el
Paso 3 (construir el diagrama), después de leer las reglas de sintaxis
compartidas en
`~/.claude/skills/_shared/mermaid-validate/references/mermaid-syntax-rules.md`.

No uses sinónimos de estos 8 nombres en prosa ni en nombres de archivo/sección
(`lifecycle`, `flujo de proceso`, `diagrama de casos de uso`, etc.) — usá
siempre el nombre canónico de la tabla.

| Tipo canónico | Tema que lo dispara | Construcción Mermaid |
| --- | --- | --- |
| `sequence` | Cadena de llamadas/mensajes entre componentes o servicios para un flujo puntual (ej. login, checkout, un webhook) | `sequenceDiagram` |
| `class` | Entidades del dominio y sus relaciones (herencia, composición, agregación) — estructura, no proceso | `classDiagram` |
| `state` | Transiciones de estado de una entidad a lo largo de su ciclo de vida (ej. una orden: creada → pagada → enviada) | `stateDiagram-v2` |
| `use-case` | Qué puede hacer un actor (usuario, sistema externo) sobre lo que se está diseñando | `flowchart` (aproximado — Mermaid no tiene tipo nativo de use-case) |
| `component` | Composición interna e interfaces de un componente específico — más granular que `architecture` | `flowchart` (aproximado — Mermaid no tiene tipo nativo de component) |
| `architecture` | Límites de todo el sistema: componentes/infra de alto nivel y cómo se conectan | `architecture-beta` si el caso es simple (componentes + conexiones), o `flowchart` si necesita agrupar por `subgraph` |
| `workflow` | Procesos, pasos operativos, CI/CD — secuencia de pasos sin ser una cadena de llamadas entre servicios | `flowchart` |
| `dataflow` | Pipelines o lineage de datos — de dónde viene un dato y a dónde va | `flowchart` |

Un mismo pedido puede necesitar más de un tipo (ej. "diagramame esta feature"
puede pedir `sequence` + `state` a la vez) — generá cada uno en su propio
archivo, nunca mezclados en un solo diagrama.

## Fidelidad de contenido — a la conversación, no al código

A diferencia de `architecture-map` (que exige que cada nombre coincida con
el código real), acá la fuente de verdad es lo que surgió en la ideación,
la planeación, o esta misma conversación:

- Nombres de actores/componentes/estados tal como se acordaron en la
  conversación — si todavía no tienen nombre, proponé uno y confirmalo con
  el usuario antes de usarlo en el diagrama final, no lo dejes implícito.
- No agregues pasos, estados, o relaciones que no se discutieron. Si al
  construir el diagrama notás un hueco lógico (un estado sin transición de
  salida, un paso sin quien lo dispare), preguntalo — no lo rellenes
  inventando la respuesta más probable.
- Si el diseño cambia entre invocaciones para el mismo proyecto, actualizá
  el archivo existente (mismo slug) en vez de crear uno nuevo con contenido
  duplicado — revisá primero el índice `docs/design.md` del proyecto.
