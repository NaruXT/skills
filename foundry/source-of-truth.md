# Repositorio fuente canónico

Todos los casos, rondas de decisión, y registros de este catálogo se escriben en el checkout local canónico de este repo (`~/Projects/skills`).

Las copias instaladas bajo `~/.claude/skills/<nombre>` (symlink o copia) son artefactos de distribución. Se pueden leer desde ahí, pero **nunca son destino de escritura**. Esto importa incluso si `~/.claude/skills/<nombre>` es un symlink que apunta acá: cuando una skill corre, el directorio de trabajo de la sesión no tiene por qué ser este repo, así que no alcanza con asumir una ruta relativa — hay que resolver la raíz explícitamente.

## Resolver la raíz

Antes de escribir el primer artefacto (un caso nuevo, una ronda nueva), resolvé la raíz:

```bash
bun scripts/resolve-source-root.mjs
```

o, si la skill corre desde otro repo y no tiene este script a mano, resolvé a mano en este orden:

1. Variable de entorno `JOSUE_SKILLS_REPO`, si está definida.
2. `~/Projects/skills`.

El resolver valida que la ruta tenga `foundry/maturity.json` y `foundry/cases/` antes de aceptarla — no cae de vuelta al directorio de trabajo actual ni a la carpeta de la skill instalada.

## Destinos canónicos

| Artefacto | Destino bajo la raíz |
|---|---|
| Caso de uso real | `foundry/cases/<skill>-<slug>.md` |
| Ronda de decisión/promoción | `foundry/rounds/<NNN-nombre>/README.md` |
| Fricción de workflow (papercut) | `PAPERCUTS.md` |
| Registro de madurez/canal | `foundry/maturity.json` |

El repo o proyecto donde estabas trabajando cuando se disparó la skill recibe el código, los tests, o el entregable que pediste. No recibe casos, rondas, ni registros de este catálogo — esos siempre vuelven acá.

## Si no se puede resolver la raíz

Si `JOSUE_SKILLS_REPO` no está definida y `~/Projects/skills` no existe o no tiene la estructura esperada, no escribas el artefacto en ningún otro lado (ni en la copia instalada, ni en el repo del proyecto actual) — avisá que la raíz no se pudo resolver y segui sin registrar el caso.
