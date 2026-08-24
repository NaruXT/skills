# Runs

Un run es la migaja de pan más barata de registrar: cada vez que una skill se ejecuta sobre trabajo real, una entrada corta acá — sin necesidad de que ya haya una lección transferible armada.

Distinto de un caso (`foundry/cases/`): un caso es una lección completa, con qué se hizo, qué resultó, y evidencia recuperable — cuesta más escribirlo, y se justifica cuando el uso dejó algo que vale la pena que otra sesión lea antes de repetir el trabajo. Un run es más chico: solo dice "esto pasó, en esta fecha, con este resultado en una línea" — la mayoría de los usos reales no van a merecer un caso completo, pero igual son evidencia de uso que una ronda de promoción puede citar.

## Cuándo registrar uno

Cada vez que una skill de este catálogo se use sobre trabajo real (no una prueba armada para probar la skill). Si el uso además deja una lección transferible, escribí también un caso completo en `foundry/cases/` y enlazalo desde el run.

## Formato

Un archivo por skill por corrida: `foundry/runs/<skill>/<fecha>-<slug-corto>.md`

```markdown
# <Skill> — <slug corto>

- Fecha: AAAA-MM-DD
- Contexto: <repo/proyecto donde se usó>
- Resultado: <una o dos líneas — qué pasó>
- Caso relacionado: <link a foundry/cases/... si existe, si no "ninguno todavía">
```

## Cómo se usa esto en una ronda

Cuando `scripts/validate-skills.mjs` u otra fuente (por ejemplo `skillkit stats`, ver
[../skillkit-integration.md](../skillkit-integration.md)) sugiere que una skill se usó, buscá acá
antes de citar eso como evidencia — un run real, con fecha y contexto, es evidencia; un conteo de
invocaciones sin un run o caso que lo respalde es solo una pista, no una promoción por sí sola
(ver `governance.md`, sección "Cómo se usa SkillKit").
