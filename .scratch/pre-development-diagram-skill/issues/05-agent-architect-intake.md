# Intake formal de agent-architect

Type: grilling
Status: resolved
Blocked by: 01, 02, 03, 04

## Question

Corriendo la skill `agent-architect` de este catálogo, especificar paso a paso la skill nueva - rol, dolor que resuelve, cómo se mide el éxito, y una `description` que incluya el límite de disparo decidido en el ticket 02 - usando como insumos fijos, sin reabrirlas, las decisiones ya tomadas en los tickets 01 (filosofía de salida), 02 (límite de disparo), 03 (alcance de tipos de diagrama) y 04 (mecanismo compartido con `architecture-map`, si aplica).

Este ticket entrega el destino del mapa: una spec sin ambigüedades lista para pasar a `CREATING_SKILLS.md`. No incluye escribir el `SKILL.md` ni construir la skill - eso es la sesión siguiente, fuera de este mapa.

## Answer

La skill se llama **`design-diagrams`**. Intake completo vía `agent-architect` (6 fases, gate de ambigüedad pasado sin campos pendientes). Spec completa en [design-diagrams-spec.md](../design-diagrams-spec.md).

Resumen:
- **Usuario/caso de uso**: Josue, arquitecto de software, diagramando flujos de una o varias features antes de codearlas.
- **Dolores que resuelve**: casos borde que se escapan sin diagrama, alucinaciones de la IA implementadora, falta de documentación referenciable en la planeación.
- **Comportamiento**: pregunta si falta información; si alcanza, infiere el tipo de diagrama y genera; si sigue faltando tras preguntar, declara explícitamente qué diagramas no generará.
- **Reglas duras**: valida siempre contra el parser oficial de Mermaid; nunca inventa elementos no surgidos de la conversación; nunca diagrama código real existente (eso es `architecture-map`).
- **Herramientas**: Bash (script de validación compartido), Write/Read locales al repo - sin MCP ni API externa.
- **Memoria**: `docs/design/<slug>.md` por diagrama + índice `docs/design.md` por proyecto (qué tipos ya se generaron).
- **Modelo**: hereda el de la sesión (skill inline, no subagente); sugiere Opus vía `/model` para planeación, sin forzarlo.
- **`description` propuesta** (con el límite de disparo frente a `architecture-map`): ver la spec, sección final.

**Fog graduada**: la duda de "¿alguna skill hermana de planeación necesita un cambio propio para saber cuándo delegar?" queda resuelta - no. `design-diagrams` se invoca por coincidencia de `description`, igual que cualquier otra skill del catálogo; las skills hermanas pueden, opcionalmente, agregar una cross-referencia en su propio `SKILL.md` (mismo patrón de `foundry/skill-writing-patterns.md` §6), pero no es un requisito bloqueante ni un cambio de código.

Con este ticket cerrado, el mapa alcanza su destino: no quedan tickets abiertos ni niebla pendiente.
