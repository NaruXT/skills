# Research: detección de symlinks rotos / copias divergentes

Documento de investigación para el problema abierto planteado en `foundry/open-problems/symlink-drift-detection.md`.
Es investigación pura: no implementa nada, no modifica el repo más allá de este archivo.

Ubicación elegida: hermano directo del archivo del problema, `foundry/open-problems/symlink-drift-detection.research.md`.
No existe en este repo ninguna convención previa de `foundry/open-problems/research/` ni una sección de "research" dentro del propio archivo del problema (`foundry/` solo tiene `open-problems/`, `cases/` y `rounds/`, verificado con `find foundry -type d`), así que este es el lugar hermano más razonable sin inventar una carpeta nueva.

---

## 1. El problema, tal cual está planteado

Cito directamente `foundry/open-problems/symlink-drift-detection.md`:

- Instalación: `~/.claude/skills/<nombre>` es un symlink que apunta a `~/Projects/skills/skills/.experimental/<nombre>` (o a `skills/<nombre>` si la skill está en `stable`). Hoy son 7 skills: `agent-architect`, `architecture-map`, `cost-audit`, `dando-seguimiento-a-proyectos`, `gerente-general-estrategico`, `network-traffic-assessment`, `visual-style-reference`.
- Modo de falla 1 (symlink roto): "Si esa ruta deja de existir [...] el symlink en `~/.claude/skills/<nombre>` queda roto en silencio."
- Modo de falla 2 (copia divergente): "si en algún momento alguien reemplaza el symlink por una copia real [...] esa copia queda congelada en el estado del momento de la copia [...] no hay ninguna señal de que eso pasó."
- `scripts/validate-skills.mjs` no cubre ninguno de los dos casos porque corre en CI sobre un checkout limpio del repo, nunca ve `~/.claude/skills`.
- Ya se investigó el ecosistema `Railly/skills` / `crafter-station/skills` y **no tiene esto resuelto**: su propio `PAPERCUTS.md` deja la misma entrada abierta, y `kai-doctor` (su "fix probable") es una herramienta personal no pública sin evidencia de implementación real de la parte de detección de divergencia.
- Restricciones explícitas: una sola persona, una sola máquina; el repo ya usa Bun para scripts (`scripts/validate-skills.mjs`, `scripts/resolve-source-root.mjs`); la solución debe integrarse con lo que ya existe (`PAPERCUTS.md` o un chequeo en `scripts/`); **no sobre-construir** — con 7 skills, un comando de una línea corrido a mano puede ser más apropiado que un daemon, salvo que haya una razón real y explícita para algo más.
- Se pide investigar, sin asumir de antemano la respuesta: un `doctor` local en `scripts/`, un git hook, un `launchd`, extender `validate-skills.mjs` con `--local`, o algo más simple.

## 2. Verificación contra el repo real

Confirmado directamente en la máquina (no es información de segunda mano):

- `scripts/validate-skills.mjs` y `scripts/resolve-source-root.mjs` llevan shebang `#!/usr/bin/env bun` y usan exclusivamente `node:fs` / `node:path` / `node:os` — ninguna dependencia externa, `package.json` no existe en el repo (no hay `node_modules`, no hay bundler). La convención real es "script Bun de un archivo, sin dependencias, con shebang ejecutable".
- `.github/workflows/validate.yml` corre `bun scripts/validate-skills.mjs` en `ubuntu-latest` sobre un checkout limpio — confirma textualmente que CI **no puede ver** `~/.claude/skills`, porque ni siquiera es la misma máquina. Esto es la "razón real" que el propio archivo del problema pide para descartar `--local` como parte de CI: cualquier chequeo de `~/.claude/skills` tiene que ser explícitamente local, nunca parte de este workflow.
- `foundry/maturity.json` confirma el universo exacto de 7 skills que deberían estar symlinkeadas desde este repo (las mismas 7 nombradas en el archivo del problema). Esto importa para el diseño del detector: `~/.claude/skills` también contiene entradas que **no** son de este catálogo (por ejemplo `ai-elements`, `cli-build`, etc., symlinkeadas a `../../.agents/skills/...`, que es otro sistema de skills). Un detector correcto tiene que iterar sobre los nombres registrados en `foundry/maturity.json`, no sobre todo `~/.claude/skills/*`.
- Evidencia en vivo de exactamente el modo de falla 2: `~/.claude/skills/use-railway` es hoy un **directorio real** (`stat -f "%HT"` → `Directory`, no `Symbolic Link`), a diferencia de `agent-architect`, que es `lrwxr-xr-x` apuntando a `/Users/josueroquecastillo/Projects/skills/skills/.experimental/agent-architect`. `use-railway` no es parte del catálogo de 7 skills de este repo (no aparece en `maturity.json`), así que no es un caso real del bug — pero es la prueba de que `~/.claude/skills` ya mezcla symlinks, directorios reales y archivos sueltos (`COMO_CREAR_SKILLS.md`, `.DS_Store`), y de que cualquier heurística de detección tiene que tolerar esa mezcla sin falsos positivos.

## 3. Semántica exacta de symlinks — fuentes primarias

### 3.1 `test(1)` / `[ -L ]` / `[ -e ]` (man page local, Darwin, `macOS 15.3`)

Cita textual de `man test` en esta máquina:

> `-e file` True if file exists (regardless of type).
> `-L file` True if file exists and is a symbolic link.
> [...]
> If file is a symbolic link, test will fully dereference it and then evaluate the expression against the file referenced, **except for the -h and -L primaries**.

Esto da la combinación exacta y sin ambigüedad para clasificar una entrada con herramientas POSIX estándar:

- Symlink roto: `[ -L "$p" ] && [ ! -e "$p" ]` — `-L` no dereferencia (siempre ve el link), `-e` sí dereferencia (así que da falso si el target no existe).
- Copia real donde debería haber symlink: `[ -e "$p" ] && [ ! -L "$p" ]`.
- No existe nada: `[ ! -e "$p" ] && [ ! -L "$p" ]`.

`man test` también documenta `-h` como alias histórico de `-L` ("This operator is retained for compatibility with previous versions of this program. Do not rely on its existence; use -L instead"), así que `-L` es la forma correcta a usar hoy.

### 3.2 `stat(1)` / `readlink(1)` (man page local, Darwin)

Cita textual:

> The information displayed [by `stat`] is obtained by calling **lstat(2)** with the given argument [...]
> `-L` Use stat(2) instead of lstat(2). [...] **If the link is broken or the target does not exist, fall back on lstat(2) and report information about the link.**
> When invoked as `readlink`, only the target of the symbolic link is printed. If the given argument is not a symbolic link and the `-f` option is not specified, readlink will print nothing and exit with an error.

Dos datos operativos de esto:

- `stat -F` marca cada symlink con `@` al final del nombre (formato `ls -F`), útil para inspección visual manual.
- `readlink` (sin `-f`) lee el valor crudo del link sin intentar resolverlo — funciona igual sobre un symlink válido o roto, y solo falla si el argumento no es un symlink en absoluto. Es el análogo POSIX de `fs.readlinkSync` de Node (ver 4.4).

### 3.3 `find(1)` — BSD find en macOS vs GNU find, y el idioma canónico para symlinks rotos

Cita textual del `find(1)` de este Darwin, sección de opciones:

> `-P` Cause the file information and file type [...] returned for each symbolic link to be those of the link itself. **This is the default.**
> `-L` Cause the file information and file type [...] returned for each symbolic link to be those of the file referenced by the link, not the link itself. **If the referenced file does not exist, the file information and type will be for the link itself.**

Y la sección `-type`:

> `-type t` True if the file is of the specified type. Possible file types are: b, c, d, f, **l (symbolic link)**, p, s.

El propio man page de BSD find da como ejemplo textual, en su sección `EXAMPLES`, exactamente el caso de uso de este problema:

> `find -L /usr/ports/packages -type l -exec rm -- {} +`
> **Delete all broken symbolic links in /usr/ports/packages.**

La mecánica: con `-L`, cada symlink válido se resuelve y adopta el tipo de su target (deja de matchear `-type l`); un symlink roto no se puede resolver, así que find cae de nuevo al tipo del link mismo (`l`). El resultado es que `find -L <dir> -type l` aísla exactamente los symlinks rotos — es el idiom estándar, documentado en la fuente primaria del propio sistema, no una convención de blog.

Para el caso 2 (copia real en vez de symlink), el complemento es `find <dir> ! -type l` **sin** `-L` (comportamiento `-P`, el default): reporta el tipo de la entrada tal cual está en el directorio, así que una copia real aparece como `f` o `d`, y un symlink (roto o no) aparece como `l`.

**Diferencia real BSD vs GNU confirmada en esta máquina**: `man find` de este Darwin **no tiene ninguna mención de `-xtype`** (grep sobre el texto completo del man page da cero resultados). `-xtype` sí existe en GNU find — el manual oficial de GNU findutils (`https://www.gnu.org/software/findutils/manual/html_node/find_html/Type.html`, GNU Findutils 4.10) documenta `-xtype` como una variante de `-type` consciente de symlinks: para un symlink válido evalúa el tipo del target final, y **para un symlink roto (o un loop) se comporta igual que `-type`** (es decir, reporta `l`). Si alguien copiara un script hecho para Linux que use `-xtype l` para encontrar symlinks rotos, ese script fallaría en macOS con un error de "unknown primary" — es exactamente el tipo de fricción que el usuario pidió chequear explícitamente. La combinación portable y correcta en ambos sistemas (BSD y GNU) es `find -L <dir> -type l`, no `-xtype`.

## 4. APIs de Node.js / Bun para filesystem

El repo ya corre en Bun (`#!/usr/bin/env bun` en los dos scripts existentes), y Bun documenta su compatibilidad con `node:fs` así (`bun.sh/docs/runtime/nodejs-apis`):

> **`node:fs`** — 🟢 Fully implemented. 98% of Node.js's test suite passes. `Stats` objects lack the `Temporal.Instant` getters (`atimeInstant` and friends).

Es decir: todo lo que sigue, documentado por Node.js oficialmente, aplica sin cambios a Bun. Fuente: `https://nodejs.org/api/fs.html` (v26.7.0, verificado descargando y extrayendo el HTML real de la sección "Synchronous API", líneas 4153–4706 del documento).

### 4.1 `fs.lstatSync(path[, options])` — no sigue el symlink

Cita textual:

> Retrieves the `<fs.Stats>` for **the symbolic link referred to by path**. See the POSIX lstat(2) documentation for more details.
> `throwIfNoEntry <boolean>` Whether an exception will be thrown if no file system entry exists, rather than returning `undefined`. Default: `true`. (Added in v15.3.0, v14.17.0)

`lstatSync` nunca lanza excepción por un symlink roto — el link en sí existe, así que `lstat(2)` tiene éxito y describe el link. Con `throwIfNoEntry: false`, si ni siquiera el link existe, devuelve `undefined` en vez de lanzar `ENOENT`.

### 4.2 `stats.isSymbolicLink()` — solo es válido sobre el resultado de `lstat`

Cita textual:

> Returns true if the `<fs.Stats>` object describes a symbolic link. **This method is only valid when using `fs.lstat()`.**

Esta es la advertencia clave: si se llamara sobre el resultado de `fs.statSync` (que sigue el link), `isSymbolicLink()` siempre daría `false`, porque `statSync` ya resolvió el link y describe el target. Por eso la clasificación tiene que empezar por `lstatSync`, nunca por `statSync`.

### 4.3 `fs.statSync(path[, options])` — sigue el symlink, lanza `ENOENT` si el target no existe

Cita textual:

> Retrieves the `<fs.Stats>` for the path. [...] `throwIfNoEntry <boolean>` [...] Default: `true`.

`statSync` resuelve el symlink hasta llegar al archivo real (semántica POSIX `stat(2)`, la misma que documenta `man stat` de Darwin en la sección 3.2). Sobre un symlink roto, el archivo final no existe, así que lanza `ENOENT` salvo que se pase `throwIfNoEntry: false`.

### 4.4 `fs.existsSync(path)` — sigue el symlink, no distingue "no existe" de "symlink roto"

`fs.existsSync` remite a la versión async para el detalle de comportamiento ("For detailed information, see the documentation of the asynchronous version of this API: `fs.exists()`"), y ahí está la cita textual relevante:

> **If path is a symbolic link, it is followed. Thus, if path exists but points to a non-existent element, the callback will receive the value `false`.**

Esto es importante: `existsSync(p)` da `false` tanto si `p` no existe en absoluto como si `p` es un symlink roto — no alcanza por sí solo para distinguir los dos casos. Hace falta combinarlo con `lstatSync` (o directamente reemplazarlo por `lstatSync` + `isSymbolicLink()`), igual que en shell hace falta combinar `-e` con `-L`.

### 4.5 `fs.readlinkSync` y `fs.realpathSync` — leer vs. resolver

Citas textuales:

> `fs.readlinkSync(path[, options])` [...] Returns **the symbolic link's string value**. See the POSIX readlink(2) documentation for more details.
> `fs.realpathSync(path[, options])` [...] Returns **the resolved pathname**.

`readlinkSync` lee el valor crudo del link (funciona sobre un link roto, igual que `readlink(1)` sin `-f`, sección 3.2); `realpathSync` intenta resolver completamente la cadena y falla si algún componente no existe. Para el caso 2 (copia divergente), ninguno de los dos aplica directamente — el problema ahí no es resolver un link (no lo hay), sino confirmar que la entrada **no es** un symlink en absoluto (`lstatSync(p).isSymbolicLink() === false`).

### 4.6 Bun Shell (`Bun.$`) como alternativa dentro del ecosistema Bun

Bun también documenta un shell scripting API propio (`bun.sh/docs/runtime/shell`):

> Bun Shell [...] is a cross-platform bash-like shell with JavaScript interop. [...] By design, Bun Shell does not invoke a system shell like `/bin/sh`. It's a re-implementation of bash that runs in the same Bun process.

Es una alternativa real, pero para este problema específico agrega una capa de indirección sin necesidad: la clasificación ya se resuelve con dos o tres llamadas a `node:fs`, no hace falta invocar `ls`/`find` a través de un shell reimplementado. Vale la pena mencionarlo porque existe dentro del ecosistema Bun, pero no aporta nada que `node:fs` no dé ya de forma más directa para este caso puntual.

## 5. Cómo se ve la clasificación completa (sin escribir código de producción todavía)

Con las citas de la sección 4, el algoritmo de clasificación por entrada queda así, sin ambigüedad y respaldado 100% por fuente primaria:

1. `lstatSync(p, { throwIfNoEntry: false })` → si devuelve `undefined`: **no existe nada** en `p`.
2. Si el resultado existe y `.isSymbolicLink()` es `true`: es un symlink. Entonces `existsSync(p)` (que sigue el link, sección 4.4): si `false` → **symlink roto**; si `true` → symlink válido, y opcionalmente comparar `realpathSync(p)` contra la ruta canónica esperada dentro del repo para confirmar que apunta a donde debería (no solo que resuelve a *algo*).
3. Si el resultado existe y `.isSymbolicLink()` es `false`: es un archivo o directorio real — **copia divergente** (caso 2), independientemente de si es archivo o carpeta.

El equivalente exacto en shell POSIX, ya derivado en la sección 3.1, es:

```sh
for p in "$HOME/.claude/skills"/<nombre-registrado-en-maturity.json>; do
  if [ -L "$p" ] && [ ! -e "$p" ]; then echo "ROTO: $p"; fi
  if [ -e "$p" ] && [ ! -L "$p" ]; then echo "COPIA REAL: $p"; fi
done
```

o, para descubrir en vez de iterar nombre por nombre, `find -L ~/.claude/skills -maxdepth 1 -type l` para rotos (sección 3.3) combinado con filtrar por los nombres de `maturity.json`.

## 6. Opciones de disparo / automatización

### 6.1 Manual (correr el comando a mano cuando uno se acuerda)

Cero código nuevo de disparo, cero superficie nueva. Costo: depende de que el usuario se acuerde de correrlo. Encaja perfectamente con la restricción explícita de "no sobre-construir" para 7 skills y un solo usuario.

### 6.2 Extender `scripts/validate-skills.mjs` con un modo `--local`

Es la opción que más respeta la convención ya existente: mismo archivo, mismo runtime (Bun), mismo estilo (arrays `errors`/`warnings`, mismo formato de salida). La única diferencia real frente al modo actual es que este chequeo **no puede correr en CI** — confirmado en la sección 2, `validate.yml` corre en `ubuntu-latest` sobre un checkout limpio que nunca tuvo `~/.claude/skills`. Por eso tiene que ser explícitamente un flag opt-in (`--local`) que la CI nunca pasa, y que el usuario corre a mano (o desde otro disparador) en su propia máquina.

### 6.3 Git hook (`pre-commit` / `post-checkout`) en este repo

Cita textual de `git help hooks` sobre el alcance de cada uno:

> `pre-commit` — This hook is invoked by git-commit(1) [...] before obtaining the proposed commit log message and making a commit.
> `post-checkout` — This hook is invoked when a git-checkout(1) or git-switch(1) is run after having updated the worktree. [...] It is also run after git-clone(1) [...]

**Hallazgo importante contra esta opción**: ambos hooks disparan sobre eventos de `git` *dentro de este repo* (un commit, un checkout, un clone). Pero el drift que describe el problema no siempre es un evento de git en este repo — puede ser: alguien borra manualmente `~/.claude/skills/<nombre>` fuera de cualquier operación de git; alguien restaura un backup que reemplaza el symlink con una copia; el usuario mueve el propio `~/Projects/skills` de lugar. Ninguno de esos casos dispara un hook de este repo. Un git hook cubriría bien un subconjunto (una ronda que hace `mv` de una carpeta como parte de un commit de promoción), pero no es una cobertura general del problema — es una opción parcial, no equivalente a las otras.

### 6.4 `launchd` (macOS) con `StartInterval`

Fuentes primarias locales, `man launchd` y `man launchd.plist` en esta máquina:

> `~/Library/LaunchAgents` Per-user agents provided by the user. (de `man launchd`, sección FILES)
> `StartInterval <integer>` This optional key causes the job to be started every N seconds. [...] (de `man launchd.plist`)
> `WatchPaths <array of strings>` This optional key causes the job to be started if any one of the listed paths are modified. **IMPORTANT: Use of this key is highly discouraged, as filesystem event monitoring is highly race-prone** [...] (de `man launchd.plist`)

Dos datos relevantes de esto: la ubicación correcta para un LaunchAgent por-usuario es `~/Library/LaunchAgents/<Label>.plist`, cargado con `launchctl bootstrap` (ver `man launchctl`); y **la propia documentación de Apple desaconseja explícitamente** `WatchPaths` para este tipo de caso (justo el mecanismo que "reaccionaría" a que alguien reemplace un symlink), así que la única forma razonable de usar `launchd` aquí sería `StartInterval` con un intervalo largo (por ejemplo, una vez al día), no un watcher reactivo. Esto es, en los hechos, un daemon corriendo permanentemente en background — exactamente lo que el archivo del problema dice explícitamente que "no hace falta [...] pero tampoco hay que descartar [...] si es claramente la más simple". Dado que sí existe una alternativa más simple (6.1/6.2), `launchd` no es la más simple; sería la opción correcta solo si se quisiera notificación proactiva sin que el usuario tenga que acordarse de correr nada, lo cual el problema no pide como requisito.

## 7. Tabla comparativa

| Opción | Robustez (BSD vs GNU / cobertura) | Simplicidad | Encaja con convención Bun existente | Requiere instalar/configurar algo nuevo |
|---|---|---|---|---|
| **Comando manual, corrido a mano** (shell one-liner o `bun scripts/validate-skills.mjs --local`) | Total si se corre; cero cobertura si no se corre | Máxima — una función o un for-loop | Sí, si se implementa como modo del script existente | No |
| **`--local` en `scripts/validate-skills.mjs`** | Total cuando se invoca; sigue dependiendo de que el usuario lo invoque | Alta — reusa parseo, estilo de errores/warnings y runtime ya existentes | Sí, es la opción que mejor encaja | No (mismo Bun, mismo archivo) |
| **Git hook (`pre-commit`/`post-checkout`)** | Parcial — solo cubre drift causado por operaciones git en este repo, no drift externo | Media — hay que instalar el hook (`.git/hooks/` no versiona por defecto, o usar `core.hooksPath`) | Podría invocar el mismo script Bun | Sí (registrar el hook) |
| **`launchd` con `StartInterval`** | Total si el intervalo es corto; requiere que la Mac esté despierta en el momento del disparo (documentado: se salta el intervalo si el sistema está dormido) | Baja — plist nuevo, `launchctl bootstrap`, logs de un proceso background | Puede invocar el mismo script Bun como `Program` | Sí (el plist, y entender su ciclo de vida) |
| **Bun Shell (`Bun.$`) en vez de `node:fs`** | Igual que la opción de script Bun, pero con una capa extra de indirección sobre comandos tipo shell | Menor que usar `node:fs` directo — no aporta nada que `lstatSync`/`existsSync` no den ya | Sí, sigue siendo Bun | No, pero es una API adicional sin necesidad real aquí |

## 8. ¿Cuál luce más simple, dada la restricción explícita de "no sobre-construir"?

Sin implementar nada: la combinación de **6.1 + 6.2** — un modo `--local` agregado a `scripts/validate-skills.mjs` (mismo archivo, mismo Bun, mismo estilo de reporte de errores que ya existe), usando la clasificación de la sección 5 (`lstatSync` + `isSymbolicLink()` + `existsSync`), corrido **a mano** por el usuario — es la que mejor satisface todas las restricciones explícitas del archivo del problema a la vez: cero dependencias nuevas, cero proceso nuevo corriendo en background, encaja exactamente con la convención Bun ya establecida, y no requiere que CI vea `~/.claude/skills` (imposible de todos modos, confirmado en la sección 2).

El git hook queda descartado como mecanismo *principal* por cobertura parcial (sección 6.3), no por complejidad. `launchd` es la única opción que de verdad requeriría "algo más" que el archivo del problema pide justificar explícitamente antes de asumirla — y la razón que el problema exige ("CI no puede ver `~/.claude/skills`") no aplica a `launchd`, porque `launchd` no es CI, corre en la misma máquina que ya puede correr el comando a mano.

La decisión final (si `--local` corrido a mano alcanza, o si además vale la pena un LaunchAgent periódico para no depender de la memoria del usuario) queda para el usuario — este documento no la toma.
