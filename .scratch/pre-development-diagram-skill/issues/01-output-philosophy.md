# Filosofía de salida

Type: grilling
Status: resolved

## Question

¿La skill nueva hereda la disciplina de `architecture-map` ("solo `.md`, Mermaid puro, sin motor de render propio", validado contra el parser oficial de mermaid.js), o se justifica un renderer propio / HTML interactivo porque el caso de uso pre-desarrollo se beneficia de algo más rico (export, motion, interactividad) - al estilo del renderer propio de Archify (JSON IR tipado → HTML autocontenido con SVG inline, motion opcional, export a PNG/JPEG/WebP/SVG/WebM)?

Esta es la pregunta de diseño más importante del mapa y no debería resolverse por default. Ver `foundry/research/archify-vs-architecture-map.md` para la comparación ya hecha contra el código fuente real de Archify.

## Answer

La skill nueva hereda la disciplina de `architecture-map`: solo `.md`, Mermaid puro, sin motor de render propio, validado contra el parser oficial de mermaid.js (y verificado visualmente) antes de darse por terminado.

Grillado con el usuario en dos pasos:

1. **Audiencia y lugar de consumo**: técnica, dentro del propio flujo de planeación (PRs, documentos de `/to-spec`, `/shaping`, `/to-tickets`) - no stakeholders externos que necesiten algo exportable/interactivo. Esto favorece Mermaid, que renderiza nativo en GitHub/GitLab sin pasos extra.
2. **Hueco de cobertura verificado como hecho**: Mermaid no tiene tipo nativo de `use case diagram` ni `component diagram` (soporta nativamente `sequence`, `class`, `state`, `ER`, `flowchart`, y `architecture` en beta). El usuario aceptó aproximar esos dos tipos con `flowchart`, a cambio de cero mantenimiento propio.

Se verificó además que `architecture-map` ya tiene el mecanismo reutilizable (`references/mermaid-syntax-rules.md`, `references/visual-verification.md`, scripts `validate.mjs`/`screenshot.mjs`) - si compartirlo o duplicarlo queda para el ticket "Compartir validación de sintaxis Mermaid con architecture-map", ahora desbloqueado por esta resolución.

No se agregan tickets nuevos ni se gradúa niebla como consecuencia de esta decisión.
