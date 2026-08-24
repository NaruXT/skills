# Casos

Un caso es el registro mínimo de una vez que una skill (o un método que todavía no es skill) se usó sobre trabajo real y produjo un resultado verificable.
Es la evidencia que las rondas de `foundry/rounds/` citan para justificar una promoción — sin caso, no hay promoción, sin importar qué tan seguro esté de que "funcionó bien".

## Cuándo registrar uno

Cada vez que una skill se aplique sobre trabajo real (no un caso de prueba armado para probar la skill) y produzca un resultado concreto: un bug encontrado, un entregable a un cliente, una decisión tomada con datos reales.

## Formato

Un archivo Markdown por caso, nombrado `<skill>-<slug-corto>.md`:

```markdown
# <Skill> — <título corto del caso>

- Skill: `<nombre-de-la-skill>`
- Fecha: AAAA-MM-DD
- Proyecto/contexto: <dónde pasó>

## Qué se hizo

<Los pasos reales que se siguieron, no el procedimiento genérico de la skill.>

## Resultado

<Qué se encontró, encontró o entregó — con números o artefactos concretos si los hay.>

## Evidencia recuperable

<Dónde vive la prueba: un commit, un archivo, un log, un entregable — algo que se pueda volver a mirar, no solo el recuerdo de la sesión.>
```

Un caso sin "evidencia recuperable" es una anécdota, no evidencia — se puede registrar igual, pero una ronda de promoción no debería apoyarse solo en él (ver `foundry/governance.md`, sección "Dimensiones de estado independientes").
