# Papercuts

Fricción chica encontrada trabajando en este repo: un script que se murió, un doc desactualizado, un paso confuso. Una línea cada vez, anotada en el momento en que pasa.

```bash
echo "- [$(date -u '+%Y-%m-%dT%H:%MZ')] <qué estabas haciendo> -> <qué se interpuso> (fix probable: <tu mejor guess>)" >> PAPERCUTS.md
```

Distinto de un caso (`foundry/cases/`, una lección transferible de trabajo real) y de una ronda (`foundry/rounds/`, una decisión de promoción). Este archivo registra fricción del workflow en sí, no del contenido de las skills.

## Abierto

- [2026-08-24T13:43:00Z] symlinkeando `~/.claude/skills/<nombre>` hacia este repo para las 7 skills -> no hay ninguna detección automática de que un symlink se rompió (una ronda futura mueve una carpeta y se olvida rehacerlo) ni de que una copia instalada divergió del canónico si en algún momento se vuelve a copiar en vez de symlinkear. Railly tiene el mismo hueco sin resolver — su propio `PAPERCUTS.md` lo deja abierto y su "fix probable" (`kai-doctor`) es una herramienta personal no pública, sin evidencia de que esté implementada. Ver `foundry/open-problems/symlink-drift-detection.md` para el planteo completo (fix probable: un comando `doctor` local, corrido a mano o como pre-commit, que recorra `~/.claude/skills/*`, confirme que cada entrada instalada de una skill de este catálogo es un symlink, y que resuelva a una ruta que sigue existiendo dentro de `~/Projects/skills`)

## Resuelto

- [2026-08-24T00:00Z] escribiendo el checklist de promoción de governance.md -> solo cubría el caso de subir a `stable`, pero cualquier `mv` de carpeta (una deprecación, por ejemplo) rompe un symlink igual (fix probable: generalizar la regla a "cualquier ronda que mueva físicamente una carpeta", no solo la promoción a stable — aplicado)
