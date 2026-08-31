# Wayfinder Map: Skill de diagramas pre-desarrollo

## Destination

Una spec completa y sin ambigüedades para una skill nueva del catálogo: diagramado en etapa de planeación, sin requerir repo real, invocable tanto standalone como desde dentro de skills hermanas de planificación (`/shaping`, `/breadboarding`, `/to-spec`, `/to-tickets`, `/create-plan`).

El mapa termina cuando las preguntas de diseño abiertas - filosofía de salida, límite de disparo frente a `architecture-map`, alcance de tipos de diagrama - están resueltas y documentadas, lista para entrar al intake de `agent-architect` y de ahí a `CREATING_SKILLS.md`.

Construir, registrar en `foundry/maturity.json` y validar la skill queda **fuera** de este mapa - es la sesión siguiente, no parte de la ruta.

## Notes

- Dominio: catálogo personal de skills de Claude Code (`~/Projects/skills`), gobernado por `foundry/governance.md` / `foundry/maturity.json`. Ninguna skill nace en `stable`.
- Documento origen de este esfuerzo: `foundry/open-problems/pre-development-diagram-skill.md`.
- Research ya hecho, citar en vez de repetir: `foundry/research/archify-vs-architecture-map.md` (compara contra el código fuente real de Archify).
- Skill hermana a diferenciar en cada ticket relevante: `skills/.experimental/architecture-map/SKILL.md` - documenta un repo que **ya existe**, grounded en código real, se niega a diagramar sin evidencia. La skill nueva es el caso inverso: sin repo, fase de ideación/planeación, antes de construcción/validación.
- Para el ticket de intake final, usar la skill `agent-architect` de este catálogo (no escribir el `SKILL.md` a mano sin pasar por ese intake).
- Cuando una decisión toque límites entre skills hermanas, consultar `foundry/skill-writing-patterns.md` (criterio de límites compartidos) y actualizar la cross-referencia en ambas skills en el mismo cambio.
- Tipo de ticket por defecto: `grilling`, vía `/grilling` y `/domain-modeling`.
- **Construcción completada** (fuera del alcance formal del mapa, hecha en la misma sesión a pedido del usuario): `design-diagrams` está creada en `skills/.experimental/design-diagrams/`, registrada en `foundry/maturity.json` como `experimental`, symlinkeada en `~/.claude/skills/design-diagrams`. El mecanismo de validación se extrajo a `skills/_shared/mermaid-validate/` (symlink `~/.claude/skills/_shared/mermaid-validate`) y `architecture-map` quedó actualizado para apuntar ahí, con la referencia rota "mermaid-skill" corregida a `design-diagrams` y la cross-referencia en ambas direcciones. `bun scripts/validate-skills.mjs` corre limpio (11 skills válidas) - no hizo falta tocar el script, `discoverSkills()` ya ignora naturalmente cualquier subdirectorio de `skills/` sin `SKILL.md`. Hallazgo adicional durante la construcción: `repo-to-spec` también dependía de las rutas viejas de `architecture-map/scripts/` y `references/mermaid-syntax-rules.md` - corregido en el mismo cambio para apuntar a la ubicación compartida.

## Decisions so far

- [Filosofía de salida](issues/01-output-philosophy.md) - hereda la disciplina de `architecture-map`: solo `.md`, Mermaid puro, sin renderer propio; casos de uso/componentes se aproximan con `flowchart`.
- [Límite de disparo frente a architecture-map](issues/02-trigger-boundary.md) - eje: repo real + grounded en código → `architecture-map`; sin repo, o diseño target no reflejado en código, → la skill nueva (incluso con repo existente).
- [Alcance de tipos de diagrama](issues/03-diagram-scope.md) - v1 cubre 8 tipos (sequence, class, state, use-case, component, architecture, workflow, dataflow), fusionando los overlaps de UML/Archify; sin subconjunto artificial porque el costo marginal por tipo es bajo tras decidir Mermaid puro.
- [Compartir validación de sintaxis Mermaid con architecture-map](issues/04-shared-mermaid-validation.md) - se comparte (no se duplica): extraer el mecanismo de validación a `skills/_shared/mermaid-validate/`, motivado por evidencia concreta (181 MB de node_modules + doble instalación manual).
- [Intake formal de agent-architect](issues/05-agent-architect-intake.md) - la skill se llama **`design-diagrams`**; spec completa en [design-diagrams-spec.md](design-diagrams-spec.md), lista para `CREATING_SKILLS.md`.

## Not yet specified

_(vacío - toda la niebla se graduó; ver la respuesta de [Intake formal de agent-architect](issues/05-agent-architect-intake.md) sobre la mecánica de invocación desde skills hermanas)_

## Out of scope

- Adoptar/vendorizar Archify directamente en vez de construir una skill nativa - descartado: este catálogo no tiene canal de gobernanza para herramientas externas (`foundry/governance.md` no contempla skills vendorizadas), y la integración con skills hermanas de planificación de este catálogo no es transferible desde una herramienta externa.
