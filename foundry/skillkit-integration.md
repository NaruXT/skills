# SkillKit — de dónde sale la señal de uso

`skillkit` (`crafter-station/skill-kit`, MIT, `npx @crafter/skillkit`) está instalado como skill
global (`~/.agents/skills/skillkit`, symlinkeado a `~/.claude/skills/skillkit`). Lee las sesiones
locales de Claude Code (`~/.claude/projects/**/*.jsonl`) y ninguna otra fuente — todo se queda en
tu máquina, en `~/.skillkit/analytics.db`.

Da esto, que antes no existía en este catálogo: un conteo real de cuántas veces se invocó cada
skill en los últimos N días.

```bash
npx @crafter/skillkit stats --all --days 90
```

## Lo que SÍ resuelve

Antes de tener esto, la única señal de uso era lo que alguien se acordara de anotar a mano en
`foundry/cases/`. Ahora hay una pista objetiva de qué skills se están tocando, incluso si nadie
registró nada — útil para saber **dónde mirar primero** cuando se abre una ronda de auditoría de
uso (como la Ronda 001, pero con una guía en vez de revisar las 7 skills a ciegas).

## Lo que NO resuelve — y por qué el conteo nunca alcanza solo

Un conteo de invocaciones dice que la skill se cargó en una sesión. No dice si esa sesión era
trabajo real o una prueba, si la skill se aplicó completa o se abandonó a mitad, ni qué resultado
produjo. Railly aplicó esta misma distinción en su Ronda 006 (`crafter-station`/`Railly/skills`):
`handoff` tenía 7 invocaciones en 90 días —la segunda cifra más alta del catálogo— y **no fue
promovida** en esa ronda, porque al buscar el caso real detrás de esas invocaciones solo aparecían
coincidencias de nombre de archivo sin relación. Mientras tanto, `signature-repro` tenía 1 sola
invocación y sí fue promovida, porque esa única invocación sí tenía un caso real y verificable
detrás. El conteo alto no ganó; el conteo bajo con evidencia real sí.

**Regla operativa**: un conteo de `skillkit` es motivo para ir a buscar evidencia (un run en
`foundry/runs/<skill>/`, o un caso en `foundry/cases/`), nunca motivo para promover directamente.
Si buscás y no encontrás nada, el conteo queda anotado como "señal de adopción, no evidencia" —
igual que hizo Railly — y no mueve ni madurez ni canal.

## Primera lectura real sobre este catálogo (2026-08-24, ventana de 90 días)

| Skill | Invocaciones (skillkit) | Run/caso real encontrado | Estado |
|---|---:|---|---|
| `architecture-map` | 5 | Ninguno en `foundry/runs/` ni `foundry/cases/` todavía | Señal de adopción, no evidencia — no promueve nada por sí sola |
| `gerente-general-estrategico` | 5 | Ninguno — y no aplica el mismo marco de evidencia (ver Ronda 001, Seguimiento) | Señal de adopción, no evidencia |
| `agent-architect` | 1 | Ninguno | Señal de adopción, no evidencia |
| `cost-audit` | 1 | Ya tiene caso real (`foundry/cases/cost-audit-fb-question-detector.md`) — la promoción a `dogfooded` en la Ronda 001 no dependió de este conteo | El conteo coincide con la evidencia ya existente, no la reemplaza |
| `visual-style-reference` | 1 | Ninguno | Señal de adopción, no evidencia |
| `dando-seguimiento-a-proyectos` | 0 | Ninguno | Sin señal |
| `network-traffic-assessment` | 0 | Ya tiene caso real, pero con fecha sin registrar (anterior a este sistema) — coherente con 0 invocaciones detectadas en la ventana de 90 días | El caso ya documentado sigue siendo la evidencia; el conteo en 0 no lo contradice, solo confirma que no hay uso reciente adicional |

**Esto no promueve nada por sí solo.** Es una lectura, no una ronda — si en algún momento se
quiere abrir una ronda de re-clasificación por uso (como la 006 de Railly) tomando estos números
como punto de partida, hay que ir a confirmar cada uno con un run o caso real antes de proponer
ningún cambio de canal o madurez.
