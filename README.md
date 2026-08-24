# Skills

Catálogo personal de skills de Claude Code.

Cada skill empaqueta un procedimiento pensado para reutilizarse, no una idea suelta — pero eso no significa que ya esté probada: ver [`foundry/governance.md`](foundry/governance.md) para qué evidencia hace falta antes de confiar en una.
La `description` de cada `SKILL.md` está escrita para el disparo automático: no resume qué hace la skill, dice qué palabras y situaciones deberían activarla.

## Cómo funciona el sistema

Este catálogo no es solo una estructura de carpetas — tiene reglas explícitas de cuándo una skill sube de madurez o de canal, qué evidencia hace falta, y quién aprueba el cambio. Esas reglas están en [`foundry/governance.md`](foundry/governance.md); léelo antes de mover una skill de canal. Cada decisión de promoción queda registrada en [`foundry/rounds/`](foundry/rounds/README.md), la evidencia liviana (un uso real, sin lección armada) en [`foundry/runs/`](foundry/runs/README.md), y los casos completos en [`foundry/cases/`](foundry/cases/README.md). [`skillkit`](https://github.com/crafter-station/skill-kit) (instalado como skill global) da un conteo real de invocaciones — es una pista de dónde mirar, nunca evidencia por sí sola; ver [`foundry/skillkit-integration.md`](foundry/skillkit-integration.md).

**Canal** (`stable` / `candidate` / `experimental`) responde "¿qué tan recomendada está su instalación?".
**Madurez** (`experimental` → `dogfooded` → `evaluated` → `validated` / `deprecated`) responde "¿qué evidencia real la respalda?".
Son dos ejes independientes: subir de madurez no mueve el canal solo, ni viceversa — ver `governance.md`.

Solo el canal `stable` tiene su propia carpeta (`skills/<nombre>/`). `candidate` y `experimental` comparten la misma carpeta (`skills/.experimental/<nombre>/`); la diferencia entre ellos vive únicamente en `foundry/maturity.json`, que es la fuente de verdad de ambos ejes. Cuando una skill llega a `stable`, su carpeta se mueve físicamente de `skills/.experimental/<nombre>/` a `skills/<nombre>/`.

Ninguna skill nace en `stable` ni en `validated`. Ninguna sube sola: cada promoción pasa por una ronda documentada y requiere tu aprobación explícita.

## Skills

Las 7 skills migradas desde `~/.claude/skills` están todas en canal `experimental`. La [Ronda 001](foundry/rounds/001-bootstrap-catalog/README.md) evaluó su evidencia retroactiva y promovió `cost-audit` y `network-traffic-assessment` a madurez `dogfooded`; las otras cinco quedan en `experimental` hasta que exista un caso real registrado en `foundry/cases/`.

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

Cuando una skill suba a `stable`, la carpeta se mueve de `skills/.experimental/<nombre>` a `skills/<nombre>` (ver `foundry/governance.md`) y hay que rehacer el symlink. Subir a `candidate` no mueve la carpeta — solo cambia el campo `channel` en `foundry/maturity.json`.
