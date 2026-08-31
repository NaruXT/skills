# Límite de disparo frente a architecture-map

Type: grilling
Status: resolved

## Question

`architecture-map` y la skill nueva van a vivir en el mismo catálogo, compitiendo por vocabulario parecido ("diagramá la arquitectura de..."). ¿Cuál es el criterio exacto y las frases gatillo que distinguen cuándo aplica cada una en su `description`?

Punto de partida ya discutido: el eje no es "tipo de diagrama" sino "¿existe repo real y el usuario lo quiere grounded en ese código?". El caso ambiguo real a resolver explícitamente: hay repo, pero el usuario quiere diagramar un diseño target que el código todavía no refleja - eso debería disparar la skill nueva, no `architecture-map` (que se niega a diagramar sin evidencia real).

Ver el criterio de `foundry/skill-writing-patterns.md` sobre límites compartidos entre skills hermanas, y agregar la cross-referencia en las dos skills en el mismo cambio si corresponde.

## Answer

**Eje del límite:** ¿existe un repo real y el usuario quiere el diagrama *grounded* en ese código? → `architecture-map`. ¿No hay repo, o hay repo pero el usuario quiere diagramar un diseño target que el código todavía no refleja? → la skill nueva.

- `architecture-map` dispara con: "documentar la arquitectura de este repo", "diagrama de esta clase/flujo/tabla que ya existe en el código", "mapear lo que este proyecto ya hace".
- La skill nueva dispara con: "diagramame cómo debería quedar X", "antes de escribir código, diagramá el flujo/las clases/los estados propuestos", "diseñame un diagrama de secuencia/clases/estados/casos de uso para esto que estamos planeando" - incluso con repo existente, mientras el diagrama describa un diseño target, no el código actual.
- Caso ambiguo resuelto explícitamente: repo existe + se pide diagramar algo que el código no refleja todavía → la skill nueva, nunca `architecture-map`.

**Hallazgo importante durante el grilling:** `architecture-map/SKILL.md` ya tiene, en su `description`, una referencia hacia adelante a un nombre inventado/adivinado - *"para eso usar mermaid-skill"* - que no existe en ningún otro lugar del repo. Esto viola el propio criterio de `foundry/skill-writing-patterns.md` §6 (no referenciar una skill que todavía no existe adivinando su nombre), pero confirma que el límite ya estaba anticipado. Queda pendiente para la sesión de construcción (fuera de este mapa): reemplazar "mermaid-skill" por el nombre real de la skill nueva en la `description` de `architecture-map`, en el mismo cambio que crea la skill nueva, agregando también la cross-referencia inversa (la skill nueva cita a `architecture-map`) - ver nota agregada al mapa.

No se agregan tickets nuevos ni se gradúa niebla como consecuencia de esta decisión.
