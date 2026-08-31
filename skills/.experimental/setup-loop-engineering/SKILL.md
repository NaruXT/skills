---
name: setup-loop-engineering
description: Escanea el proyecto actual y arma el andamiaje de archivos y convenciones para correr desarrollo autónomo con /loop de forma segura - guardarraíles numéricos y de irreversibilidad acordados con el usuario, doble verificación Maker/Grader con capa determinista y capa de juicio, un modo entrenamiento supervisado antes de soltar el loop, persistencia de estado entre compactaciones vía hooks reales (PreCompact + SessionStart), y un verify.sh que corre los comandos reales de lint/build/test del proyecto como gate objetivo. Usar cuando el usuario pida "preparame el proyecto para correr /loop", "quiero dejar un loop autónomo corriendo", "arma el framework de loop engineering", "necesito guardarraíles antes de un loop sin supervisión", "cómo pruebo si mi loop funciona", o antes de lanzar cualquier /loop, /goal o /schedule de varias iteraciones que va a escribir código sin revisión directa de cada cambio.
compatibility: Requiere que el directorio actual sea un repositorio git - el guardarraíl de "cambios no autorizados" se ancla a un commit de referencia (`git rev-parse HEAD`), y sin `.git` ese guardarraíl no se puede construir.
version: 0.2.0
---

# setup-loop-engineering

Preparás el terreno para un loop que va a iterar sin que el usuario revise cada cambio en el momento.
Tu entrega es el andamiaje y una validación supervisada de que funciona - nunca soltás un loop desatendido sin haber corrido el Paso 7 primero.

## 0. Verificar estado previo

Si ya existe `.loop/HANDOFF.md`, es un loop en curso, no un setup nuevo.
Avisá explícito y preguntá si el usuario quiere retomarlo o reiniciarlo - nunca lo sobreescribas en silencio.

## 1. Inspeccionar el proyecto

Detectá el stack real (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Makefile`).
Sacá los comandos de lint/build/test de una fuente confiable, en este orden de preferencia: un workflow de CI (`.github/workflows/*.yml`), después los scripts declarados (`package.json` → `scripts`, targets de `Makefile`).
Nunca los inventes a mano.
Preguntale también al usuario si hay reglas de negocio propias del proyecto que un lint/build/test genérico no captura (ej. un invariante de datos, un chequeo de precios, algo específico del dominio) - esas también son parte de la verificación.
Si no encontrás comandos genéricos, preguntá los exactos - no asumas `npm test` porque es lo típico del stack.

## 2. Acordar objetivo y guardarraíles con el usuario

Nunca fijes nada de esto en silencio.
Confirmá con el usuario:
- El objetivo en una frase concreta y verificable. Aplicá el litmus test antes de aceptarla: ¿un agente externo que nunca conversó con quien implementó sabría, solo con esa frase, si está hecho? Si no, es una meta difusa - ver [`references/protocolo-verificacion.md`](references/protocolo-verificacion.md) §1.
- Paths permitidos y prohibidos (los prohibidos van a `.loop/forbidden-paths.txt`, no solo a la conversación).
- Guardarraíles numéricos: archivos/líneas máximos por iteración, intentos máximos por ítem, ROJOS consecutivos antes de marcar BLOQUEADO, iteraciones antes de pausa obligatoria, y un tope de gasto (llamadas o tiempo).
- Guardarraíles de irreversibilidad: cualquier acción no reversible (borrado permanente, envío externo, movimiento financiero) necesita bloqueo estructural, no una instrucción blanda - ver [`references/protocolo-verificacion.md`](references/protocolo-verificacion.md) §6.
- Si el loop va a usar una skill existente para el trabajo fino, confirmá que esa skill ya se probó sola y es confiable - un loop no es el lugar para validar una skill nueva por primera vez.

Si el usuario no tiene cifras en mente, proponé defaults conservadores (10 archivos / 300 líneas por iteración, 6 intentos por ítem, 3 ROJOS seguidos → bloqueado, pausa cada 20 iteraciones) y confirmalos antes de escribirlos.

## 3. Crear `.loop/`

- `.loop/HANDOFF.md`, `.loop/forbidden-paths.txt`: plantillas completas en [`references/plantillas.md`](references/plantillas.md).
- `.loop/baseline-commit.txt`: el `git rev-parse HEAD` actual. Si hay cambios sin commitear, avisá y confirmá antes de fijar el baseline - si no, ese trabajo en progreso queda afuera del guardarraíl sin que nadie lo haya decidido.
- `.loop/logs/` y, si el proyecto tiene interfaz visual, `.loop/visual/`.
- Instalá los hooks de compactación (`PreCompact` + `SessionStart` con matcher `compact`) invocando la skill `update-config` con la configuración de [`references/plantillas.md`](references/plantillas.md) - no edites `.claude/settings.json` a mano. Esto hace que `HANDOFF.md` sobreviva una compactación de forma mecánica, no porque el modelo se acordó de actualizarlo a tiempo.

## 4. Generar `.loop/verify.sh`

Corre lint → build → test (más cualquier chequeo de negocio del Paso 1) con los comandos reales, en ese orden, corta en el primer fallo, vuelca el output a `.loop/logs/verify-<timestamp>.log`.
Es el gate determinista - nunca el juicio del modelo solo (ver capas en el Paso 5).
Dale permiso de ejecución (`chmod +x`).
Esqueleto en [`references/plantillas.md`](references/plantillas.md).

## 5. Documentar el protocolo de verificación en `HANDOFF.md`

Escribí en `HANDOFF.md` (plantilla en [`references/plantillas.md`](references/plantillas.md)) el ciclo Maker/Grader: el Maker implementa un ítem y corre `verify.sh`; el Grader es un **subagente separado** que mira en frío el resultado (nunca conversa con el Maker antes de dar veredicto) y aplica dos capas - la determinista (`verify.sh`, paths contra `forbidden-paths.txt`) siempre, y una capa de juicio solo para criterios subjetivos o de UI, que debe abrir y mirar la evidencia real, no asumir de un exit code.
Detalle completo (writer≠grader, capas, circuit breaker, por qué verde no es éxito, presupuesto) en [`references/protocolo-verificacion.md`](references/protocolo-verificacion.md) - citalo, no lo reescribas.

## 6. Generar `PROGRESS.md` en la raíz

Visible para el usuario, no escondido en `.loop/`.
Estructura: `Done` / `In progress` / `Next` / `Blocked` / `Notes`.
Plantilla en [`references/plantillas.md`](references/plantillas.md).

## 7. Modo entrenamiento (esto es cómo se valida que el setup funciona)

Nunca sueltes un loop de horas como primer intento.
Corré 2-3 iteraciones completas del ciclo Maker/Grader vos mismo, en la conversación actual, sin ningún mecanismo de `/loop`/`/goal`/`/schedule` todavía:
1. Maker implementa el primer ítem de `PROGRESS.md` → `Next`.
2. Grader (subagente separado, Paso 5) da veredicto real.
3. Mirá dónde se desvió el resultado de lo esperado - un guardarraíl mal calibrado, un `verify.sh` que no capturó algo, un objetivo que resultó menos verificable de lo que parecía.
4. Ajustá `HANDOFF.md`, `forbidden-paths.txt`, o `verify.sh` en base a eso, y repetí.

Solo después de que 2-3 iteraciones corran sin sorpresas pasás al Paso 8.
Si el usuario pregunta "¿cómo sé que esto funciona?" o "quiero validar la skill primero", la respuesta es este paso, no una corrida larga.

## 8. Elegir el mecanismo de lanzamiento y confirmar

Mostrale al usuario el resumen (objetivo, guardarraíles, comandos de `verify.sh`) y lo que salió del modo entrenamiento.
Ayudalo a elegir entre un solo prompt, `/goal`, `/loop`, o `/schedule` según lo que necesita - tabla de decisión en [`references/mecanismos-de-loop.md`](references/mecanismos-de-loop.md).
Preguntá explícito si quiere lanzarlo ahora y con qué parámetros - nunca en el mismo paso en que terminaste el setup o el entrenamiento.
Si confirma, sugerí el comando exacto; el disparo lo hace el usuario, salvo que pida explícito que lo hagas vos.

## Reglas duras

- Nunca inventás guardarraíles, objetivos, o comandos de verificación sin confirmar con el usuario o sin haberlos leído de una fuente real del proyecto.
- Nunca sobreescribís un `.loop/HANDOFF.md` existente en silencio.
- Nunca saltás el modo entrenamiento (Paso 7) para ir directo a un lanzamiento desatendido.
- Este setup arma el andamiaje y lo valida en modo supervisado - no lanza el loop desatendido por su cuenta.

## Límites

- Los guardarraíles son un piso, no una garantía - un loop autónomo puede seguir rompiendo cosas dentro del propio límite numérico; `verify.sh` y el Grader reducen el riesgo, no lo eliminan.
- El baseline se ancla a un commit real - si el repo no está en git, este setup no puede construir el guardarraíl de cambios no autorizados (ver `compatibility`).
- El modo entrenamiento (Paso 7) reduce sorpresas, no las elimina - 2-3 iteraciones supervisadas no cubren todos los caminos que un loop de horas puede tomar.
- No reemplaza al revisor humano final - está pensado para loops que corren varias iteraciones sin supervisión *directa*, no para eliminar la revisión humana del resultado completo al final.

## Referencias

| Archivo | Contenido |
|---|---|
| [`references/plantillas.md`](references/plantillas.md) | Plantillas de `HANDOFF.md`, `forbidden-paths.txt`, `verify.sh`, `PROGRESS.md`, y la configuración de hooks `PreCompact`/`SessionStart` para instalar vía `update-config`. |
| [`references/protocolo-verificacion.md`](references/protocolo-verificacion.md) | Litmus test del objetivo, writer≠grader en caja negra, capas determinista/juicio del gate, circuit breaker, por qué verde no es éxito, guardarraíl de irreversibilidad, y presupuesto. |
| [`references/mecanismos-de-loop.md`](references/mecanismos-de-loop.md) | Las cuatro formas de correr el loop (prompt único, `/goal`, `/loop`, `/schedule`), qué puede ver/hacer cada evaluador, y una tabla de cuándo usar cada una. |
