# Ronda 001: Bootstrap del catálogo

Status: propuesto, a la espera de tu decisión
Fecha: 2026-08-24
Alcance: las 7 skills migradas desde `~/.claude/skills` al crear este repo

## Pregunta de decisión

Ninguna de las 7 skills pasó nunca por un proceso de promoción — se escribieron y se usaron directo desde `~/.claude/skills`, sin canal ni madurez explícitos. Este catálogo es anterior al sistema de gobernanza (`foundry/governance.md`). ¿Cuáles de las 7 tienen evidencia real registrable hoy, y cuáles deberían subir de madurez ya mismo en vez de esperar un próximo uso?

## Por qué existe esta ronda

`governance.md` dice: "el catálogo inicial es anterior a este sistema y debe ganar su madurez retroactivamente. Una lección no es una skill solo porque funcionó una vez." Esta ronda aplica esa misma disciplina a las 7 skills fundacionales, en vez de asumir que "ya se usaban antes" alcanza como evidencia.

## Método

Para cada skill, se revisó su propio `SKILL.md` buscando evidencia narrada de uso real (no un caso de prueba armado para la skill), y se verificó si esa evidencia era recuperable (un artefacto real, no solo la afirmación).

## Evidencia revisada

| Skill | Evidencia encontrada en el `SKILL.md` | Recuperable | Veredicto |
|---|---|---|---|
| `cost-audit` | Origina en una auditoría real sobre `fb-question-detector` (2026-07-23): bug de 49% de reprocesamiento encontrado y corregido, validado con datos reales | Sí — caso formalizado en [`foundry/cases/cost-audit-fb-question-detector.md`](../../cases/cost-audit-fb-question-detector.md) | Evidencia real, aplicado |
| `network-traffic-assessment` | Reporte de Health Check de firewall Palo Alto entregado a un cliente vía SEK, con ejemplo anonimizado en `reference/example-report-anonymized.md` | Parcial — el ejemplo anonimizado existe, pero no hay fecha ni los inputs originales (confidenciales del cliente); caso formalizado en [`foundry/cases/network-traffic-assessment-sek-health-check.md`](../../cases/network-traffic-assessment-sek-health-check.md) con esta limitación anotada | Evidencia real pero incompleta |
| `agent-architect` | Ninguna — el `SKILL.md` describe el método, no un uso real documentado | No | Sin evidencia todavía |
| `architecture-map` | Ninguna — tiene scripts propios (`validate.mjs`, `screenshot.mjs`) que indican trabajo de construcción real, pero no un caso de uso documentado con resultado | No | Sin evidencia todavía |
| `dando-seguimiento-a-proyectos` | Ninguna | No | Sin evidencia todavía |
| `gerente-general-estrategico` | No aplica de la misma forma — es una persona/rol (`disable-model-invocation: true`), no un método con un resultado verificable como los demás | No aplica | Requiere una decisión humana aparte, no esta ronda (ver Seguimiento) |
| `visual-style-reference` | Ninguna | No | Sin evidencia todavía |

## Decisión propuesta

Subir madurez (canal sin cambios, sigue `experimental`) para las dos skills con evidencia recuperable:

- `cost-audit`: experimental → **dogfooded**
- `network-traffic-assessment`: experimental → **dogfooded**, con la limitación del caso anotada explícitamente

Sin cambio de madurez para `agent-architect`, `architecture-map`, `dando-seguimiento-a-proyectos`, `visual-style-reference`: quedan en `experimental` hasta que exista un caso real registrado.

`gerente-general-estrategico` queda fuera de esta evaluación: el marco de "caso con resultado verificable" no encaja con una skill de persona/rol de la misma manera. No se le asigna madurez por ahora — la próxima ronda debería decidir explícitamente si este tipo de skill necesita su propio criterio de promoción o si simplemente no aplica.

**Esta ronda no toca `maturity.json` todavía** — según `governance.md`, "una persona (vos) aprueba la promoción explícitamente." Si confirmás, se aplican los dos cambios de arriba.

## Seguimiento

- `agent-architect`, `architecture-map`, `dando-seguimiento-a-proyectos`, `visual-style-reference`: la próxima vez que se usen sobre trabajo real, registrar el caso en `foundry/cases/` en el momento — no reconstruirlo de memoria después.
- `gerente-general-estrategico`: decidir en una próxima ronda qué evidencia tendría sentido para una skill de persona (¿"se usó y la decisión resultante se sostuvo"? ¿algo distinto?).
- Ninguna skill pasa a canal `stable` en esta ronda — eso requiere, además de madurez, una decisión explícita de "esta es la superficie recomendada por defecto" (ver `governance.md`, Canales de distribución), y ninguna tiene todavía el uso repetido que justificaría esa recomendación.
