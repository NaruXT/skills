# Problema abierto: detección de symlinks rotos / copias divergentes

Este archivo es un prompt autocontenido. Pegalo entero al empezar una sesión nueva de Claude Code para retomar este problema sin depender de que la sesión tenga memoria de la conversación donde se planteó.

---

## Contexto del repo

`~/Projects/skills` es un catálogo personal de skills de Claude Code con un sistema de gobernanza explícito:

- `foundry/governance.md` — reglas de cuándo una skill sube de canal (`experimental` / `candidate` / `stable`) o de madurez (`experimental` → `dogfooded` → `evaluated` → `validated` / `deprecated`). `foundry/maturity.json` es la fuente de verdad de ambos ejes.
- `foundry/rounds/` — log de decisiones de promoción, una carpeta por ronda.
- `foundry/cases/` — evidencia de uso real que las rondas citan.
- `PAPERCUTS.md` — log de fricción de workflow, distinto de casos y rondas.
- `scripts/validate-skills.mjs` (Bun), corrido en CI vía `.github/workflows/validate.yml` en cada push/PR — valida que `maturity.json` sea consistente con dónde vive físicamente cada skill (`skills/<nombre>` = canal `stable`; `skills/.experimental/<nombre>` = `candidate` o `experimental`), que el frontmatter esté completo, que los links de markdown resuelvan, y que los casos no filtren rutas locales.

El repo se instala así: `~/.claude/skills/<nombre>` es un **symlink** que apunta a `~/Projects/skills/skills/.experimental/<nombre>` (o, si algún día una skill sube a `stable`, a `~/Projects/skills/skills/<nombre>`). Hoy las 7 skills del catálogo (`agent-architect`, `architecture-map`, `cost-audit`, `dando-seguimiento-a-proyectos`, `gerente-general-estrategico`, `network-traffic-assessment`, `visual-style-reference`) están symlinkeadas así.

## El problema

Un symlink apunta a una ruta fija en el momento en que se crea. Si esa ruta deja de existir —porque una ronda futura mueve la carpeta de la skill (a `skills/<nombre>` al promoverla a `stable`, o a `skills/deprecated/<nombre>` al deprecarla)— el symlink en `~/.claude/skills/<nombre>` queda roto en silencio. Nadie se entera hasta que intenta usar la skill y falla, o hasta que corre `ls -la ~/.claude/skills` a mano y nota la flecha rota.

Hay un segundo modo de falla, más silencioso todavía: si en algún momento alguien reemplaza el symlink por una copia real (por ejemplo, copiando la carpeta en vez de symlinkeando al instalar en otra máquina, o restaurando desde un backup que no preserva symlinks), esa copia queda congelada en el estado del momento de la copia. Los cambios futuros al `SKILL.md` en el repo canónico nunca la alcanzan, y no hay ninguna señal de que eso pasó — la copia se ve idéntica a un symlink resuelto hasta que alguien compara el contenido a mano.

`scripts/validate-skills.mjs` **no cubre ninguno de los dos casos**: valida consistencia dentro del repo (`maturity.json` vs. ubicación física de la carpeta *dentro del repo*), pero no sabe nada de `~/.claude/skills` — ni siquiera corre ahí, corre en CI sobre un checkout limpio del repo.

## Lo que ya se investigó y se descartó

Se revisó cómo resuelve esto el sistema en el que se basó este catálogo (`Railly/skills`, más el ecosistema `crafter-station/skills`), con esta conclusión: **no lo tiene resuelto tampoco.**

- Su propio `PAPERCUTS.md` (público, en `Railly/skills`) tiene la entrada abierta, sin marcar como aplicada: *"la copia instalada... es un directorio físico, no un symlink, así que se congela en silencio... (fix probable: instalar por symlink, y que `kai-doctor` marque copias que diverjan)"*.
- `kai-doctor` no es una herramienta pública — se rastreó una única mención real, en `Railly/vcut/packages/cli/src/cli.ts`, como `kai-doctor.sh`, un script de diagnóstico personal que audita `~/.kai/` (un directorio de configuración de otra herramienta suya, no pública). No hay evidencia de que la parte de "marcar copias que diverjan" esté implementada ahí ni en ningún otro lado.
- Railly sí prefiere symlink sobre copia, pero por una razón más débil que "se autorepara": un symlink roto falla de forma visible (falla al leer el archivo), mientras que una copia divergente falla en silencio. Elegir symlink es preferir el modo de falla ruidoso al silencioso — no es una solución al problema de detección en sí.

No hay, entonces, ningún sistema existente (ni el original de Railly, ni ningún fork/derivado revisado) del que este catálogo pueda simplemente copiar una solución ya hecha.

## Restricciones a respetar

- Catálogo de una sola persona, una sola máquina por ahora (a diferencia de Railly, que distribuye a máquinas de terceros) — no hace falta una solución multi-usuario ni un servicio corriendo en background permanente, pero tampoco hay que descartar esa opción si es claramente la más simple.
- El repo ya usa Bun para scripts (`scripts/validate-skills.mjs`, `scripts/resolve-source-root.mjs`) — cualquier solución nueva debería encajar con esa convención, no introducir un runtime o lenguaje distinto sin una razón de peso.
- Tiene que integrarse con lo que ya existe: si se detecta un problema, el lugar natural para registrarlo es `PAPERCUTS.md` (si es fricción puntual) o convertirse en un chequeo dentro de `scripts/validate-skills.mjs` / uno nuevo (si es algo que debería fallar CI o un chequeo local).
- No sobre-construir: es una sola persona con 7 skills hoy. Una solución de una línea corrida a mano de vez en cuando puede ser más apropiada que un daemon — pero si hay una razón real para algo más (por ejemplo, que CI no puede ver `~/.claude/skills` porque corre en un runner remoto, así que el chequeo *tiene* que ser algo que corra localmente, no en CI), decilo explícito en vez de asumir automáticamente la opción más simple.

## Lo que se pide

Investigar opciones concretas y proponer (o implementar, si la sesión tiene luz verde del usuario) una solución para:

1. Detectar cuándo un `~/.claude/skills/<nombre>` que debería ser symlink hacia este repo está roto (apunta a una ruta que ya no existe).
2. Detectar cuándo un `~/.claude/skills/<nombre>` que debería ser symlink es en cambio una copia real (divergencia silenciosa).

Opciones a considerar, sin asumir de antemano cuál es la correcta: un comando `doctor` local en `scripts/` corrido a mano; un git hook (`pre-commit`/`post-checkout`) en este repo; un `launchd` (macOS) que corra periódicamente y avise; extender `scripts/validate-skills.mjs` con un modo `--local` que sí mire `~/.claude/skills`; algo más simple que ninguna de estas. Justificar la elección contra las restricciones de arriba, no copiar la primera idea de la lista.
