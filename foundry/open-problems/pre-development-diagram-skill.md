# Skill de diagramas pre-desarrollo (estilo Archify, sin depender de un repo)

Este archivo es un prompt autocontenido.
Pegalo entero al empezar una sesión nueva de Claude Code para retomar esta idea sin depender de que la sesión tenga memoria de la conversación donde se planteó.

---

## Contexto del repo

`~/Projects/skills` es un catálogo personal de skills de Claude Code con un sistema de gobernanza explícito:

- `foundry/governance.md` - reglas de cuándo una skill sube de canal (`experimental` / `candidate` / `stable`) o de madurez (`experimental` → `dogfooded` → `evaluated` → `validated` / `deprecated`). `foundry/maturity.json` es la fuente de verdad de ambos ejes. Ninguna skill nace en `stable` ni en `validated`.
- `foundry/cases/` - evidencia de uso real que las rondas de `foundry/rounds/` citan para justificar una promoción.
- `foundry/research/` - notas de investigación que informan una decisión, sin ser evidencia de uso real (distinto de un caso).
- `CREATING_SKILLS.md` - guía de referencia de cómo escribir un `SKILL.md` nuevo: estructura, frontmatter, cómo redactar una `description` que se autoactive bien, y el criterio de "grados de libertad" (cuándo prescribir con prosa vs. con un script exacto).
- `skills/.experimental/agent-architect/` - una skill de este mismo catálogo pensada exactamente para el intake de una skill nueva: "Interroga paso a paso para diseñar un agente de IA (subagente, skill de Claude Code, agente en un harness) antes de escribir cualquier código o configuración... nunca avanza a la siguiente pregunta con una respuesta ambigua, y nunca genera la especificación final mientras quede algún campo indefinido."
- `scripts/validate-skills.mjs` (Bun) - valida que `maturity.json` sea consistente con dónde vive físicamente cada skill, que el frontmatter esté completo, que los links de markdown resuelvan.

Instalación: `~/.claude/skills/<nombre>` es un symlink que apunta a `~/Projects/skills/skills/.experimental/<nombre>` (o a `skills/<nombre>` si algún día sube a `stable`). Toda escritura de artefactos del catálogo (casos, rondas, research, `maturity.json`) va siempre al checkout canónico (`~/Projects/skills`), nunca a la copia instalada - ver `foundry/source-of-truth.md` si hace falta resolver la raíz desde otra sesión.

## La idea

Ya existe en este catálogo la skill `architecture-map` (`skills/.experimental/architecture-map/SKILL.md`), que documenta la arquitectura de un repo **que ya existe**: explora código real, y se niega explícitamente a generar un diagrama sin evidencia real que lo respalde ("si no encontrás en el repo el material que justifique un tipo de diagrama, no lo generás").

La idea nueva es una skill **complementaria, no un reemplazo**: pensada para la fase **previa al desarrollo** (o durante la construcción, antes de que el código refleje todavía el diseño) - diagramar un sistema a partir de una descripción en lenguaje natural, sin exigir que exista un repo real detrás. Sirve como contexto de la fase de construcción (comunicar un diseño propuesto, alinear antes de escribir código), no como documentación de lo que el código ya hace.

## Lo que ya se investigó

Ya se comparó `architecture-map` contra un proyecto externo real, Archify (`github.com/tt-a1i/archify`), en `foundry/research/archify-vs-architecture-map.md` (leer completo antes de avanzar). Esa comparación ya estableció, con cita contra el código fuente real de Archify:

- El modo por defecto de Archify **no requiere repo**: "No repository is required: describe the system in any agent chat" (`README.md` línea 36 del repo de Archify).
- Archify enruta el tipo de diagrama (`architecture`, `workflow`, `sequence`, `dataflow`, `lifecycle`) por **tema de la pregunta**, con una tabla "Type router" en `archify/SKILL.md` (`architecture` → componentes/infra; `workflow` → procesos/CI-CD; `sequence` → cadenas de llamadas API; `dataflow` → pipelines/lineage; `lifecycle` → transiciones de estado), y un comando `guide "<scenario>"` como fallback cuando el tipo no es obvio.
- Grounding en código real (`--repo-root`, con verificación contra Git de que el commit/archivo/líneas citadas existen) es **opt-in y exclusivo del tipo `architecture`** - `workflow`, `sequence`, `dataflow` y `lifecycle` **rechazan esa bandera a nivel de CLI/schema** (`archify/references/authoring-contract.md` línea 184: *"workflow, sequence, dataflow, and lifecycle reject it"*). No es una omisión: es una decisión de diseño explícita de que esos cuatro tipos son para describir un diseño, no para auditar uno existente.
- Archify posee su propio renderer (JSON IR tipado → HTML autocontenido con SVG inline, motion opcional, export a PNG/JPEG/WebP/SVG/WebM), a diferencia de `architecture-map`, que es deliberadamente "solo `.md`" con Mermaid puro, sin motor propio.

Esto confirma que Archify y `architecture-map` no compiten por el mismo problema - uno diseña, el otro documenta lo que ya existe. La skill nueva que se plantea acá se parecería más al modo por defecto de Archify (sin repo) que a `architecture-map`.

## Restricciones y decisiones todavía abiertas

No asumas ninguna de estas de antemano - son parte de lo que `agent-architect` debería resolver con el usuario:

1. **Filosofía de salida**: ¿la skill nueva hereda la disciplina de `architecture-map` ("solo `.md`, Mermaid puro, sin motor de render propio", para mantener consistencia con el resto del catálogo), o se justifica un renderer propio / HTML interactivo porque el caso de uso pre-desarrollo se beneficia de algo más rico (export, motion, interactividad)? Esto no está decidido - es la pregunta de diseño más importante y no debería resolverse por default.
2. **Límite de disparo respecto a `architecture-map`**: las dos skills van a vivir en el mismo catálogo, compitiendo por vocabulario parecido ("diagramá la arquitectura de..."). La `description` de la skill nueva tiene que trazar una línea explícita y sin ambigüedad de cuándo aplica cada una (ej. "hay código real que explorar" → `architecture-map`; "estoy diseñando/planificando, todavía sin código o sin querer basarme en el código existente" → la nueva) - ver el criterio de `foundry/skill-writing-patterns.md` sobre límites compartidos entre skills hermanas, y agregar la cross-referencia en las dos skills en el mismo cambio si corresponde.
3. **Nombre y alcance**: no está decidido si cubre los 5 tipos de Archify (`architecture`/`workflow`/`sequence`/`dataflow`/`lifecycle`) o un subconjunto más chico para empezar.
4. Como toda skill nueva de este catálogo: entra en `skills/.experimental/<nombre>/`, se registra en `foundry/maturity.json` con `channel: "experimental"` y `maturity: "experimental"` (nunca un atajo), y se valida con `bun scripts/validate-skills.mjs` antes de darla por terminada.

## Lo que se pide

1. Invocar la skill `agent-architect` de este catálogo para especificar la skill nueva paso a paso (rol, dolor que resuelve, cómo se mide el éxito, `description` con el límite de disparo del punto 2 de arriba) - no escribir un `SKILL.md` a mano sin pasar por ese intake.
2. Una vez especificada sin campos ambiguos, seguir el flujo de `CREATING_SKILLS.md` para crearla.
3. Si en el intake se decide que la skill hereda la filosofía "solo `.md`" de `architecture-map`, evaluar si conviene compartir algún mecanismo entre ambas (ej. reglas de sintaxis Mermaid) en vez de duplicarlas - mismo criterio de cross-referencia del punto 2.
