# Patrones de skills maduras reales

Reglas de fondo, no de mecánica. Citado desde
[`CREATING_SKILLS.md`](../CREATING_SKILLS.md) §10 - leelo antes de escribir
una skill que se apoye en un caso real concreto, o que toque un sistema
externo con más de una forma de fallar (red, auth, rate limits, un CLI de
terceros).

Salió de comparar `cost-audit`/`cost-audit-2` (catálogo propio) contra
`surface-recon` y `cli-build` (`crafter-station/skills`, construidas
ambas sobre el mismo ecosistema `cligentic`/`agent-browser` - por eso se
parecen entre sí más de lo esperable, no es casualidad de estilo).

## 1. No infles un caso único a "el patrón típico"

Si una regla general se apoya en un caso real, dos formas válidas de
citarlo:

- **Con conteo real**, cuando hay más de un caso: "3 de 4 CLIs del corpus
  hicieron X", "6 de los targets bloquearon el fetch plano".
- **Con cobertura explícita**, cuando hay uno solo: "en el caso de
  origen, X" - no "casi siempre X" ni "el patrón típico es X".

`cost-audit-2` viola esto hoy: el Paso 4 dice "casi siempre viene de una
falta de memoización como la del paso 1" con un solo caso real
(`fb-question-detector`) respaldándolo. Corregir esa frase antes de
fusionar cualquier cambio a `cost-audit`.

## 2. Nombrá el mecanismo, no el vendor

Generalizá una barrera por *cómo se comporta*, no por *qué producto la
implementa*: "CDN challenge page" en vez de "Cloudflare", "un ORM con
lazy loading" en vez de nombrar uno puntual si la regla no depende de esa
herramienta específica. La regla sobrevive el día que cambia el
proveedor.

Citar texto literal como evidencia sigue siendo válido y deseable (un
mensaje de error exacto, un header de respuesta) - lo que hay que
generalizar es la *conclusión* que se saca de esa cita, no la cita en sí.
Ejemplo real de `cli-build`: cita textual `env: <runtime>: No such file
or directory`, conclusión generalizada ("a message that names no cause
and no fix").

## 3. Catalogá variantes de fallo, no una sola causa canónica

Cuando el mismo síntoma puede tener más de una causa real distinta,
armale su propio archivo de referencia con cada variante y su "tell"
(cómo diferenciarla de las otras) - no describas una sola causa como si
fuera la única.

Modelo real: `references/anti-bot.md` de `surface-recon` distingue tres
causas de un mismo síntoma (403):

- **CDN challenge page** - interstitial o script de desafío en vez de
  contenido.
- **TLS fingerprint block** - 403 limpio con sesión y headers válidos;
  indistinguible de un header faltante hasta que se compara; el tell es
  que un browser real pasa con las mismas cookies que un cliente plano
  falla.
- **Edge security checkpoint** - 403 con un header propio del vendor que
  nombra la mitigación.

`cost-audit`/`cost-audit-2` no tienen ningún catálogo equivalente: un
único patrón de bug (dedup asimétrico) tratado como si fuera el único
posible. No hace falta escribir ese catálogo todavía (no hay evidencia de
un segundo patrón de desperdicio real distinto en el catálogo propio) -
pero si aparece un segundo caso real con una causa distinta, ese es el
momento de armar el archivo, no antes.

## 4. Sección `## Límites` de cierre

Toda skill que interactúa con un sistema externo o un límite de alcance
no obvio cierra con una sección de límites, redactada como afirmaciones
durables, no como una lista de "esto no hace":

> Mapea una superficie a la que el usuario tiene derecho de acceso. Un
> paywall, un límite de autenticación que no te dieron, o datos
> personales de terceros marca el borde de la skill: el veredicto ahí es
> "bloqueado", y es un resultado legítimo.
> - `surface-recon`, sección Boundaries

No hace falta en una skill sin ese tipo de riesgo (ej. `dando-seguimiento-
a-proyectos` no la necesita).

## 5. Sección `## Referencias` explícita cuando existe `references/`

No alcanza con citar cada archivo inline en el paso que lo usa (aunque
eso también hay que hacerlo). Al final del `SKILL.md`, una lista con una
cláusula por archivo de qué contiene, así alguien que abre el archivo por
primera vez ve el alcance completo sin tener que leer los pasos enteros
primero.

## 6. Citá a la skill hermana cuando hay un límite compartido

Si dos skills del catálogo tocan fases consecutivas del mismo trabajo,
que cada una nombre explícitamente dónde termina la suya y arranca la
otra - en las dos direcciones si se puede.

Ejemplo real: `cli-build` dice "si existe un reporte de `surface-recon`,
empezá de ahí"; `surface-recon` dice "eso es trabajo de `cli-build`,
recon se detiene en el reporte". Ninguna de las dos asume en silencio que
es dueña de todo el problema.

**Cuándo aplicarla:** antes de escribir el `SKILL.md` de una skill nueva
(ver [`CREATING_SKILLS.md`](../CREATING_SKILLS.md) §3), revisá si consume
el output de una skill existente o si una skill existente debería
consumir el suyo. Si sí, la
cross-referencia se agrega **en las dos direcciones en el mismo cambio**:
la skill nueva cita a la vieja, y se edita la skill vieja para que cite a
la nueva - no alcanza con tocar solo la que se está creando.

No lo hagas al revés (agregar una referencia a una skill que todavía no
existe, adivinando su nombre). Eso es inventar una relación, no
prepararse para ella - la preparación real vive en este chequeo, no en el
texto de una skill que no tiene con quién conectarse todavía.

**Caso abierto en este catálogo:** `agent-architect` produce una
especificación (`references/plantilla-spec-agente.md`) pensada para
construir un agente a partir de ella, pero no existe todavía ninguna
skill que la consuma. El día que se cree una skill de ese tipo, este es
el par a revisar primero.

## Pendiente, no adoptado todavía

`surface-recon` y `cli-build` abren un `friction.md` propio de la skill
antes del primer paso, lo completan sobre la marcha, y lo entregan junto
con el resultado. Es distinto de [`PAPERCUTS.md`](../PAPERCUTS.md), que
hoy captura fricción a nivel catálogo, después del hecho. Vale la pena
como patrón, pero es una decisión de diseño (¿reemplaza a `PAPERCUTS.md`?
¿lo complementa?) que todavía no se tomó - no lo adoptes en una skill
nueva sin decidirlo primero explícitamente.
