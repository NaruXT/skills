# Ronda 002: Revisión mensual (2026-08-24)

Status: sin cambios
Fecha: 2026-08-24
Alcance: las 7 skills registradas en foundry/maturity.json, período desde siempre (primera revisión)

## Método

Generado por `scripts/monthly-review.mjs`: conteo de invocaciones vía `skillkit stats --all --days 90 --json`, cruzado contra archivos nuevos en `foundry/cases/` y `foundry/runs/<skill>/` desde la última revisión. Ver `foundry/skillkit-integration.md` para la disciplina de por qué un conteo solo no es evidencia.

## Estado por skill

| Skill | Canal | Madurez | SkillKit (90d) | Evidencia nueva |
|---|---|---|---:|---|
| `agent-architect` | experimental | experimental | 1 | ninguna |
| `architecture-map` | experimental | experimental | 5 | ninguna |
| `cost-audit` | experimental | dogfooded | 1 | `foundry/cases/cost-audit-fb-question-detector.md` |
| `dando-seguimiento-a-proyectos` | experimental | experimental | 0 | ninguna |
| `gerente-general-estrategico` | experimental | experimental | 5 | ninguna |
| `network-traffic-assessment` | experimental | dogfooded | 0 | `foundry/cases/network-traffic-assessment-sek-health-check.md` |
| `visual-style-reference` | experimental | experimental | 1 | ninguna |

## Con evidencia nueva — revisar si amerita proponer un cambio

- **`cost-audit`**: 1 caso(s), 0 run(s) nuevos desde la última revisión.
- **`network-traffic-assessment`**: 1 caso(s), 0 run(s) nuevos desde la última revisión.

## Conteo de SkillKit sin evidencia registrada — solo señal de adopción, no promueve nada por sí sola

- `agent-architect`: 1 invocación en 90d, sin caso ni run registrado. Si de verdad se usó sobre trabajo real, registrar el run/caso correspondiente antes de la próxima revisión.
- `architecture-map`: 5 invocaciones en 90d, sin caso ni run registrado. Si de verdad se usó sobre trabajo real, registrar el run/caso correspondiente antes de la próxima revisión.
- `gerente-general-estrategico`: 5 invocaciones en 90d, sin caso ni run registrado. Si de verdad se usó sobre trabajo real, registrar el run/caso correspondiente antes de la próxima revisión.
- `visual-style-reference`: 1 invocación en 90d, sin caso ni run registrado. Si de verdad se usó sobre trabajo real, registrar el run/caso correspondiente antes de la próxima revisión.

## Decisión

Sin cambios. Es la primera corrida del mecanismo de revisión mensual, por eso el "período" es "desde siempre" y los dos casos de `cost-audit`/`network-traffic-assessment` aparecen como "evidencia nueva" — en realidad ya fueron evaluados y promovidos en la [Ronda 001](../001-bootstrap-catalog/README.md); no es evidencia adicional a la de entonces, solo la primera vez que el script los ve porque no había una fecha de revisión previa contra la cual comparar. A partir de acá, `foundry/.last-monthly-review` queda con la fecha de esta corrida, así que la próxima corrida solo va a marcar como "nueva" evidencia que se agregue después de hoy. (Nota agregada después: el formato de ese archivo pasó de fecha simple a timestamp ISO completo — ver el `Resuelto` correspondiente en `PAPERCUTS.md` — porque correr el script dos veces el mismo día con solo la fecha volvía a marcar la misma evidencia como nueva.)

Los conteos de SkillKit sin evidencia (`agent-architect`, `architecture-map`, `gerente-general-estrategico`, `visual-style-reference`) confirman lo mismo que ya se documentó en `foundry/skillkit-integration.md`: son señal de adopción, no evidencia — no ameritan ninguna acción todavía.

