# Papercuts

Fricción chica encontrada trabajando en este repo: un script que se murió, un doc desactualizado, un paso confuso. Una línea cada vez, anotada en el momento en que pasa.

```bash
echo "- [$(date -u '+%Y-%m-%dT%H:%MZ')] <qué estabas haciendo> -> <qué se interpuso> (fix probable: <tu mejor guess>)" >> PAPERCUTS.md
```

Distinto de un caso (`foundry/cases/`, una lección transferible de trabajo real) y de una ronda (`foundry/rounds/`, una decisión de promoción). Este archivo registra fricción del workflow en sí, no del contenido de las skills.

## Abierto

## Resuelto

- [2026-08-24T00:00Z] escribiendo el checklist de promoción de governance.md -> solo cubría el caso de subir a `stable`, pero cualquier `mv` de carpeta (una deprecación, por ejemplo) rompe un symlink igual (fix probable: generalizar la regla a "cualquier ronda que mueva físicamente una carpeta", no solo la promoción a stable — aplicado)
- [2026-08-24T13:43:00Z] symlinkeando `~/.claude/skills/<nombre>` hacia este repo para las 7 skills -> no había ninguna detección de symlink roto ni de copia divergente. Ver `foundry/open-problems/resolved/symlink-drift-detection.md` (fix aplicado: `scripts/lib/symlinks.mjs` compartido entre `promote.mjs`, que ya no puede mover una carpeta sin realinear el symlink en la misma operación, y `monthly-review.mjs`, que reporta — sin corregir — cualquier drift que no haya pasado por una promoción)
