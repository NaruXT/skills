# Compartir validación de sintaxis Mermaid con architecture-map

Type: grilling
Status: resolved
Blocked by: 01

## Question

Si el ticket "Filosofía de salida" resuelve que la skill nueva hereda la disciplina "solo `.md`, Mermaid puro" de `architecture-map`, ¿conviene compartir algún mecanismo entre ambas skills (por ejemplo, las reglas/script de validación contra el parser oficial de mermaid.js) en vez de duplicarlas?

Si el ticket 01 resuelve a favor de un renderer propio, este ticket queda fuera de alcance (registrar en Out of scope del mapa en vez de resolverlo).

## Answer

**Se comparte, no se duplica.** Se extrae el mecanismo de validación (`validate.mjs`, `screenshot.mjs`, `references/mermaid-syntax-rules.md`, `references/visual-verification.md`, `references/setup.md`) a una ubicación compartida nueva - `~/.claude/skills/_shared/mermaid-validate/` (symlink a `skills/_shared/mermaid-validate/` en el repo canónico, siguiendo el mismo patrón de instalación manual de una sola vez que ya usa `architecture-map`). Ambas skills apuntan ahí.

**Evidencia que motivó la decisión:** el `scripts/node_modules` actual de `architecture-map` (mermaid + jsdom, más lo que usa `screenshot.mjs`) pesa **181 MB**, con instalación manual (`references/setup.md`: "la skill no instala nada sola"). Duplicarlo en la skill nueva significaría 181 MB extra y una segunda instalación manual para exactamente la misma capacidad - evidencia concreta de necesidad repetida, no especulativa.

**Pendiente para la sesión de construcción (fuera de este mapa):**
- Mover los archivos de `architecture-map/scripts/` y las referencias de validación a `skills/_shared/mermaid-validate/`, crear el symlink en `~/.claude/skills/_shared/mermaid-validate`.
- Actualizar `architecture-map/SKILL.md` y sus referencias para apuntar a la ubicación compartida (además de la corrección del nombre "mermaid-skill" ya anotada en el ticket "Límite de disparo frente a architecture-map").
- Revisar `scripts/validate-skills.mjs` para que entienda/ignore correctamente `skills/_shared/` (no es una skill en sí, no debe exigírsele frontmatter de skill ni entrar en `foundry/maturity.json`).

No se agregan tickets nuevos en este mapa ni se gradúa niebla - estos pendientes son de construcción, no decisiones abiertas.
