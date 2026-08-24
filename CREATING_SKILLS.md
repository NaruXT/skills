# Cómo crear una skill de Claude Code manualmente

Guía de referencia personal — no es una skill en sí (por eso no está en su
propia carpeta con `SKILL.md`, así Claude Code no la lista como una skill
más). Está basada en ejemplos reales de este catálogo y en la skill
`cost-audit` que se armó en la sesión de `fb-question-detector`.

## 1. Qué es

Una skill es un procedimiento empaquetado: instrucciones en Markdown que se
cargan en la conversación cuando aplican, en vez de que el modelo improvise
desde cero cada vez. Se diferencia de un **subagente** en que corre en la
conversación principal (con todo el contexto que ya está ahí), no en un
proceso aparte que solo devuelve un resumen al final — por eso conviene
para procesos donde vas iterando con datos reales, y un subagente para
tareas autocontenidas que se pueden delegar y esperar un reporte.

## 2. Dónde vive (y por qué importa)

| Ubicación | Alcance | Cuándo usarla |
|---|---|---|
| `.claude/skills/<nombre>/SKILL.md` (dentro del repo) | Solo ese proyecto | Procedimientos específicos de ese repo (ej. su forma particular de deploy) |
| `~/.claude/skills/<nombre>/SKILL.md` (home del usuario) | Todos tus proyectos | Lo que quieras reutilizar en cualquier repo |
| Dentro de un plugin instalado (`.claude/plugins/.../skills/<nombre>/SKILL.md`) | Depende del plugin | Skills que vienen empaquetadas con un plugin de marketplace |
| Este repo (`Projects/skills`) | Fuente canónica versionada | Donde se escribe y se promueve cada skill antes de symlinkearla a `~/.claude/skills` |

Si dos skills con el mismo nombre existen en distintos alcances, gana la
más específica al directorio donde estás trabajando.

## 3. Estructura mínima

```
skills/.experimental/mi-skill/
  SKILL.md          ← obligatorio
  scripts/           ← opcional, código que la skill invoca
    algo.mjs
  references/         ← opcional, contexto que la skill puede citar
    referencia.md
```

Alcanza con el `SKILL.md` solo. Los scripts/referencias solo hacen falta si
la skill necesita ejecutar algo determinístico (parsear datos, generar un
archivo) en vez de que todo lo razone el modelo en el momento.

## 4. El frontmatter

Formato YAML entre `---`, arriba del todo del archivo.

**Obligatorios:**
```yaml
---
name: mi-skill
description: "Qué hace, cuándo usarla, y frases que la deberían activar — este texto es lo único que Claude ve para decidir si la skill aplica a un pedido, así que sé específico y menciona sinónimos/frases reales que usarías vos."
---
```

La `description` es lo más importante del archivo: no la escribas como
resumen de marketing, escribila pensando "¿qué palabras usaría yo al pedir
esto sin saber que la skill existe?" — esas palabras van ahí.

**Opcionales** (vistas en skills reales de este catálogo):
```yaml
disable-model-invocation: true   # la skill NO se autoactiva por descripción;
                                  # solo corre si el usuario la invoca directo
                                  # (ej. con /nombre-skill). Útil si es
                                  # invasiva, costosa, o es una persona/rol
                                  # (ver gerente-general-estrategico) y no
                                  # querés que se dispare sola por un
                                  # comentario ambiguo.
allowed-tools:                   # restringe qué herramientas puede usar
  - Read                         # esta skill en particular (whitelist).
  - Bash(git *)                  # Sin esto, la skill puede usar cualquier
                                  # herramienta disponible en la sesión.
```

No agregues `allowed-tools` a menos que quieras específicamente restringir
la skill (ej. una skill de solo-lectura que no debería poder escribir
archivos ni ejecutar comandos arbitrarios).

## 5. El cuerpo (las instrucciones)

Es markdown normal, dirigido al modelo, no al usuario final. Lo que
funciona bien en la práctica:

- **Pasos numerados**, cada uno con su objetivo — no una lista plana de
  reglas sueltas. Si el paso 3 depende de una decisión tomada en el paso 1,
  decilo explícito.
- **Referencias concretas**: nombres de archivo, variables de entorno,
  comandos exactos — no "revisa la configuración", sino "lee
  `app/config.py`, la función `load_companies()`".
- **`$ARGUMENTS`**: si la skill se invoca como `/mi-skill algo`, `algo`
  queda disponible como `$ARGUMENTS` — útil para parsear un modo/periodo/
  argumento (ver `visual-style-reference`, que usa `$ARGUMENTS` para
  recibir la ruta de la imagen).
- **Scripts acompañantes**: si el paso necesita determinismo (parsear
  miles de líneas, generar un archivo con formato exacto, validar un
  diagrama contra un parser real), escribí un script en `scripts/` dentro
  de la misma carpeta de la skill, y en las instrucciones decí
  explícitamente la ruta absoluta a usar (`<skill-dir>/scripts/algo.mjs`) y
  qué hacer con su salida. Esto evita que el modelo intente "razonar" algo
  que en realidad es una cuenta mecánica (ver `architecture-map` y
  `network-traffic-assessment`).
- **Cuándo delegar a un subagente vs hacerlo en el hilo principal**: si la
  skill sabe que cierto paso es pesado/aislable (ej. escanear un repo
  entero buscando un patrón), puede decir explícitamente "lanza un agente
  Explore para esto" — pero si el valor de la skill es justamente la
  iteración con datos reales (como `cost-audit`), decilo también explícito
  para que no delegue de más.
- **Blast radius**: si la skill puede tocar producción, hacer un deploy, o
  llamar APIs externas reales, escribí explícitamente que hay que confirmar
  con el usuario antes — no asumas que se va a inferir del contexto general
  de "cuidado con acciones riesgosas".

## 6. Cómo se invoca

- **Slash command**: si se escribe `/mi-skill` (con o sin argumentos), se
  invoca directo, sin importar la `description`.
- **Auto-trigger por descripción**: si el pedido calza con la `description`
  (y no tiene `disable-model-invocation: true`), Claude debería llamarla
  sola — por eso la calidad de la `description` importa tanto.
- Al empezar una sesión nueva, llega la lista de skills disponibles
  (nombre + description) — si acabás de crear una, no aparece hasta la
  próxima sesión.

## 7. Ejemplo mínimo completo

```markdown
---
name: revisar-changelog
description: Genera un resumen en español de los commits desde el último tag, agrupados por tipo (feat/fix/chore) — usar cuando el usuario pida "preparar el changelog", "qué cambió desde la última versión", o antes de crear un release.
---

# Revisar changelog

1. Corré `git describe --tags --abbrev=0` para encontrar el último tag.
   Si no hay ningún tag, usá el primer commit del repo como punto de partida.
2. Corré `git log <tag>..HEAD --oneline` para listar los commits desde ahí.
3. Agrupá los commits por prefijo convencional (feat/fix/chore/docs/refactor)
   — si un commit no sigue esa convención, ponelo en un grupo "otros".
4. Redactá un resumen en español, con una sección por grupo, en viñetas
   cortas — no copies los mensajes de commit tal cual si son crípticos,
   reescribilos para alguien que no vio el diff.
5. Preguntá al usuario si quiere que lo guarde en CHANGELOG.md antes de
   escribir el archivo.
```

## 8. Cómo probarla

Después de crear el archivo, iniciá una sesión nueva (o pedí explícito
`/nombre-skill` en la sesión actual si el runtime lo permite sin reiniciar)
y fijate que aparezca en la lista de skills disponibles con la
`description` que esperabas. Si no se activa sola con un pedido que debería
calzar, la `description` es probablemente el problema — hacela más
específica y con más sinónimos.

## 9. Canal y madurez

Toda skill nueva entra en `skills/.experimental/<nombre>/` y se registra en
[`foundry/maturity.json`](foundry/maturity.json) con `channel: "experimental"`
y `maturity: "experimental"`. No se asume `stable` ni `dogfooded` de
entrada, sin importar cuán completo se vea el `SKILL.md`.

El criterio completo de cuándo y cómo sube una skill de madurez o de canal
—qué evidencia hace falta, por qué son dos ejes independientes, quién
aprueba el cambio— está en [`foundry/governance.md`](foundry/governance.md).
No lo repitas de memoria acá: leelo antes de proponer una promoción.

En resumen, el ciclo es:

1. Se usa la skill sobre trabajo real y, si produce un resultado
   verificable, se registra un caso en `foundry/cases/` (ver su
   [README](foundry/cases/README.md) para el formato).
2. Cuando hay evidencia suficiente, se abre una ronda en
   `foundry/rounds/<NNN-nombre>/README.md` que la revisa y propone (o
   rechaza) el cambio de madurez o canal.
3. Vos aprobás explícitamente la promoción — recién ahí se corre
   `bun scripts/promote.mjs <nombre> --channel ... --maturity ...`
   (con `--dry-run` primero para ver el plan). El script edita
   `maturity.json`, mueve la carpeta si el canal cruza a/desde `stable`, y
   realinea el symlink instalado — no se hace ninguno de esos pasos a mano.

Si una skill deja de usarse o un método mejor la reemplaza, no se borra: se
promueve con `--maturity deprecated --reason "..."`, que la mueve a
`foundry/deprecated/<nombre>/` (con un `DEPRECATION.md` al lado con la razón
y la fecha), la saca del registro activo de `maturity.json`, y quita el
symlink instalado. La ronda que tomó esa decisión queda registrada igual
que una promoción.
