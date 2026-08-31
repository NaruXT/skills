# Cómo crear una skill de Claude Code manualmente

Guía de referencia personal — no es una skill en sí (por eso no está en su
propia carpeta con `SKILL.md`, así Claude Code no la lista como una skill
más). Está basada en ejemplos reales de este catálogo, en la skill
`cost-audit` que se armó en la sesión de `fb-question-detector`, y en el
patrón de escritura observado en dos catálogos reales ajenos:
[Railly/skills](https://github.com/Railly/skills) y
[crafter-station/skills](https://github.com/crafter-station/skills) (este
último deriva a su vez de la guía oficial de Anthropic para
`skill-creator`). De ahí salen las secciones 5.1, 5.2 y 9 de más abajo.

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

Antes de escribir nada: revisá si esta skill va a consumir el output de
una skill ya existente del catálogo, o si una skill ya existente debería
consumir el suyo. Si hay un límite compartido así, la cross-referencia se
agrega en las dos direcciones en el mismo cambio - se edita también la
skill vieja, no solo la que estás creando. Ver
[`foundry/skill-writing-patterns.md`](foundry/skill-writing-patterns.md#6-citá-a-la-skill-hermana-cuando-hay-un-límite-compartido)
para el criterio completo y el caso abierto que ya está anotado.

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

**Qué no meter en la carpeta de la skill:** ni `README.md`, ni
`CHANGELOG.md`, ni `INSTALLATION_GUIDE.md`, ni `QUICK_REFERENCE.md`, ni
ningún otro archivo de documentación "sobre" la skill. La carpeta es para
lo que el modelo necesita para ejecutar la tarea, no para documentación
dirigida a un humano que la esté auditando - eso vive en `foundry/cases/`,
en la ronda que la evaluó, o en este mismo archivo. Es un error real que
aparece seguido cuando se generan skills en lote (crafter-station lo marca
explícito en su guía de `skill-gen`, ya deprecada): agrega ruido al
contexto sin agregar capacidad.

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

```yaml
compatibility: Requiere que 'radius' esté en PATH para el análisis de impacto;
                sin él, el paso 2 se salta en silencio.
```

`compatibility` (patrón tomado de `Railly/skills`) documenta un
prerrequisito de runtime que no es una herramienta de Claude Code (un CLI
externo que debe estar instalado, una versión mínima, la necesidad de que
el modelo que revisa sea distinto del que escribió lo que revisa). Solo
agregalo si la skill realmente depende de algo así - no lo uses como lugar
para poner contexto general.

```yaml
version: 0.1.0
```

`version` (patrón de `crafter-station/skills`) no es lo mismo que la
madurez de [`maturity.json`](foundry/maturity.json) - son dos ejes
distintos. `version` responde "cuánto cambió el método de este documento
puntual", `maturity` responde "cuánta evidencia lo respalda". No se
inferá uno del otro.

Semver de documento, no de software:
- **major**: cambió el flujo (se agregó/sacó un paso, se reordenó algo que
  cambia el resultado de seguirlo).
- **minor**: se agregó material o se corrigió una afirmación, sin cambiar
  el flujo.
- **patch**: wording, links, typos.

Se mantiene a mano al editar el `SKILL.md` - no hay script que lo bumpee
todavía (a diferencia de `maturity.json`, que sí se edita solo vía
`scripts/promote.mjs`). Eso es una asunción de riesgo real: nada impide
olvidarse de subirlo. Si con el tiempo se nota que se olvida seguido, ahí
se justifica un chequeo en `validate-skills.mjs` que lo exija en cada
commit que toque el cuerpo - no antes.

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
  de "cuidado con acciones riesgosas". Si además la skill toca un sistema
  externo, datos de un cliente, o tiene un límite de alcance no obvio
  (qué no implementa, qué no valida), cerrá con una sección `## Límites`
  aparte con esas afirmaciones - no alcanza con la advertencia de blast
  radius sola, que es sobre *acciones* riesgosas, no sobre *alcance*. Ver
  [`foundry/skill-writing-patterns.md`](foundry/skill-writing-patterns.md#4-sección--límites-de-cierre)
  regla 4.
- **Generalizá una barrera por su mecanismo, no por el vendor que la
  implementa** ("CDN challenge page", no "Cloudflare"), y si citás un caso
  real como evidencia de una regla, decí el conteo real si hay más de uno,
  o cobertura explícita si hay uno solo ("en el caso de origen, X" - no
  "casi siempre X" ni "el patrón típico es X"). Ver
  [`foundry/skill-writing-patterns.md`](foundry/skill-writing-patterns.md)
  reglas 1 y 2 para el detalle y ejemplos reales.
- **Forma imperativa**: escribí las instrucciones como comandos ("leé
  `X`", "corré `Y`"), no como descripciones de tercera persona ("el modelo
  debería leer X"). Es el estilo que usa la guía oficial de skill-creator
  de Anthropic, y hace cada paso más corto y menos ambiguo sobre quién
  actúa.
- **Nunca repitas "cuándo usar esta skill" en el cuerpo.** El body solo se
  carga *después* de que la skill ya disparó - una sección tipo "## Cuándo
  usar" ahí adentro no ayuda a Claude a decidir si aplica, porque para
  cuando la lee ya decidió que sí. Toda la información de disparo va en
  `description` (sección 4). Si te encontrás escribiendo eso en el cuerpo,
  es señal de que en realidad falta en la `description`.

### 5.1 Grados de libertad

No todos los pasos merecen el mismo nivel de prescripción. Elegí el nivel
según qué tan frágil o variable es la tarea:

| Nivel | Cuándo usarlo | Se ve así |
|---|---|---|
| **Alto** (instrucciones en prosa) | Hay varias formas válidas de resolverlo, o depende de contexto que solo el modelo puede evaluar en el momento | "Revisá el diff y elegí qué lentes de review aplican según qué tocó" |
| **Medio** (pseudocódigo o script con parámetros) | Existe un patrón preferido, pero hay variación aceptable | "Corré `scripts/check.sh <archivo>` - si falla, ajustá el umbral con `--threshold`" |
| **Bajo** (script específico, pocos parámetros) | La operación es frágil, propensa a error, o necesita un orden exacto que no se puede improvisar | "Ejecutá exactamente `scripts/promote.mjs <skill> --channel X`, nunca lo hagas a mano" |

Pensalo como un camino: un puente angosto con precipicios necesita
barandas específicas (bajo), un campo abierto admite muchas rutas (alto).
Mezclar los niveles al revés - prosa donde hace falta un script exacto, o
un script rígido donde hace falta juicio - es la causa más común de una
skill que falla en producción pero se veía bien en la revisión.

**Esto es una herramienta para vos mientras escribís, no un rótulo para el
resultado final.** Ninguna skill madura real (revisadas: `surface-recon`,
`cli-build`) anota "Grado de libertad: alto" en su propio texto - el
nivel se transmite implícito en cuánto detalle deja la prosa. Si escribís
la etiqueta literal en el `SKILL.md` que vas a entregar, sacala antes de
darla por terminada.

### 5.2 Presupuesto de extensión (progressive disclosure)

Claude carga la skill en tres niveles, y cada uno cuesta contexto en un
momento distinto:

1. **Frontmatter** (`name` + `description`): siempre en contexto, en toda
   sesión, dispare o no la skill. Por eso tiene que ser corto.
2. **Cuerpo del `SKILL.md`**: se carga completo cuando la skill dispara.
   Mantenelo bajo ~500 líneas - si se te va de ahí, es señal de que hay
   contenido que pertenece a `references/`, no al cuerpo.
3. **`references/` y `scripts/`**: se cargan solo si el cuerpo los cita
   explícitamente y el modelo decide que hacen falta para ese caso
   puntual.

Reglas prácticas para cuando el cuerpo crece:

- Movés a `references/<tema>.md` el contenido específico de una variante
  (un stack, un proveedor, un formato) que no aplica a todos los casos -
  el cuerpo se queda con el flujo general y la lógica de selección ("si es
  AWS, leé `references/aws.md`").
- Las referencias van a **un solo nivel de profundidad** desde el
  `SKILL.md` - todas se citan directo desde ahí, nunca una referencia que
  cita a otra referencia.
- Si una referencia pasa las ~100 líneas, ponele un índice arriba del
  todo, así el modelo ve el alcance completo antes de decidir si le sirve
  leerla entera o solo una sección.
- **Si terminás con dos o más archivos en `references/`, cerrá el
  `SKILL.md` con una tabla `## Referencias`** que liste cada archivo con
  una cláusula de qué contiene (o cuándo consultarlo, mejor todavía) - no
  alcanza con haberlos citado inline en el paso que los usa. Es lo que le
  permite a alguien que abre el archivo por primera vez ver el alcance
  completo sin leer los pasos enteros antes. Con un solo archivo en
  `references/` no hace falta la tabla, la cita inline alcanza.

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

**Técnica manual para afinar la `description`:** antes de darla por
terminada, escribí a mano 2-3 frases que deberían dispararla y 2-3 parecidas
que no deberían (un pedido vecino pero distinto). Probalas una por una en
una sesión nueva y fijate si el resultado coincide con lo esperado. Esto es
una versión deliberadamente liviana y a mano de lo que `Railly/skills` hace
con un archivo `evals/triggers.json` por skill y corre de forma
automatizada - acá no vale la pena automatizarlo (ver la limitación
reconocida en [`governance.md`](foundry/governance.md)), pero el ejercicio
de escribir los casos negativos igual sirve para encontrar una
`description` demasiado ancha antes de que dispare donde no debía.

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

## 10. Patrones de skills maduras reales

Las secciones de arriba son el procedimiento mecánico. Para reglas de más
fondo (cómo generalizar evidencia sin inflar un caso único, cómo nombrar
una barrera sin atarse a un vendor, cuándo un patrón de fallo merece su
propio archivo catalogado, la sección `## Límites` de cierre) - leé
[`foundry/skill-writing-patterns.md`](foundry/skill-writing-patterns.md)
antes de escribir una skill que se apoye en casos reales o toque un
sistema externo con fallos variables (red, auth, rate limits). No lo
repitas de memoria acá, por la misma razón que no se repite el criterio
de promoción: son reglas que van a seguir evolucionando con cada skill
nueva que las ponga a prueba.
