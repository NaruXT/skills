# Skills

Catálogo personal de skills de Claude Code.

Cada skill empaqueta un procedimiento real que ya se usó al menos una vez en trabajo concreto, en vez de ser una idea de método sin probar.
La `description` de cada `SKILL.md` está escrita para el disparo automático: no resume qué hace la skill, dice qué palabras y situaciones deberían activarla.

## Canales

Las skills viven en un canal según cuánta evidencia real respalda su uso.
Ninguna skill nace en `stable`.
Una skill sube de canal solo cuando hay uso repetido sobre trabajo real, no por antigüedad ni por que "se ve completa".

| Canal | Carpeta | Significado |
|---|---|---|
| Stable | `skills/<nombre>/` | Validada en múltiples usos reales, con evidencia consistente |
| Candidate | `skills/.candidate/<nombre>/` | Un caso de uso real documentado, lista para más dogfooding enfocado |
| Experimental | `skills/.experimental/<nombre>/` | Contrato de disparo y método coherentes, pero sin uso real repetido o sin comparación contra línea base |

La fuente de verdad de canal y madurez es [`foundry/maturity.json`](foundry/maturity.json).

| Estado de madurez | Significado |
|---|---|
| `experimental` | Contrato de disparo y método coherentes, sin uso real |
| `dogfooded` | Usada en trabajo real, sin comparación contra línea base |
| `evaluated` | Comparada contra una línea base, pero la evidencia sigue incompleta |
| `validated` | Efecto positivo repetible entre casos distintos, con revisión humana |
| `deprecated` | Se conserva por trazabilidad, pero ya no se recomienda |

## Skills

Todas las skills actuales están en `experimental` — recién migradas desde `~/.claude/skills`, sin ronda de promoción formal todavía.

### `agent-architect`
[agent-architect](skills/.experimental/agent-architect) entrevista en 6 fases secuenciales para especificar un agente de IA (subagente, skill, workflow de automatización) antes de escribir cualquier código o configuración. Nunca avanza a la siguiente pregunta con una respuesta ambigua, y nunca genera la especificación final con campos pendientes.

### `architecture-map`
[architecture-map](skills/.experimental/architecture-map) explora un repo y genera documentación de arquitectura grounded en el código real: un `docs/architecture.md` como índice más un diagrama Mermaid por cada área que lo amerite. Cada diagrama se valida contra el parser oficial de Mermaid antes de darse por terminado.

### `cost-audit`
[cost-audit](skills/.experimental/cost-audit) audita el consumo y costo real de un sistema que usa un LLM o API de pago: mapea dónde se gasta, agrega logging si falta, detecta llamadas redundantes, mide el costo real por unidad con datos de producción. Nace de una auditoría real sobre `fb-question-detector` que encontró un 49% de llamadas reprocesadas sin necesidad.

### `dando-seguimiento-a-proyectos`
[dando-seguimiento-a-proyectos](skills/.experimental/dando-seguimiento-a-proyectos) compara el estado actual de una iniciativa contra su objetivo declarado y señala el riesgo más urgente para llegar a él — uno solo, no una lista exhaustiva.

### `gerente-general-estrategico`
[gerente-general-estrategico](skills/.experimental/gerente-general-estrategico) adopta la persona de un gerente general para analizar una decisión estratégica combinando visión de largo plazo con microgestión selectiva. No se autoactiva por descripción (`disable-model-invocation: true`) — se invoca a propósito.

### `network-traffic-assessment`
[network-traffic-assessment](skills/.experimental/network-traffic-assessment) genera un informe de Health Check / Assessment de un firewall Palo Alto Networks (PAN-OS) a partir de un Backup XML y un Tech Support File, siguiendo la estructura de un reporte oficial de Palo Alto. Usada en trabajo real de cliente.

### `visual-style-reference`
[visual-style-reference](skills/.experimental/visual-style-reference) analiza una imagen (screenshot, diseño, moodboard) y genera un documento de referencia de estilo visual: paleta de colores con hex codes, sistema tipográfico, elementos distintivos.

## Cómo crear una skill nueva

Ver [CREATING_SKILLS.md](CREATING_SKILLS.md) — la guía de referencia sobre estructura de `SKILL.md`, frontmatter, y cómo escribir una `description` que se autoactive bien.

## Instalar

Este catálogo aún no se publica como paquete instalable. Para usar una skill desde otro repo o desde `~/.claude/skills`, symlinkeala directo:

```bash
ln -s ~/Projects/skills/skills/.experimental/cost-audit ~/.claude/skills/cost-audit
```

Cuando una skill suba a `candidate` o `stable`, el symlink cambia de carpeta (`skills/.candidate/<nombre>` o `skills/<nombre>`) y hay que rehacerlo.
