# Mecanismos para correr el loop

Detalle que cita `SKILL.md` Paso 8 - cuatro formas reales de correr un loop en Claude Code, y cuándo conviene cada una.
No arrancan solas: elegí una acá, mostrale el objetivo/guardarraíles/verificación al usuario, y que confirme antes de lanzar (Paso 8 del `SKILL.md`).

## 1. Un solo prompt, el propio Claude juzga cada turno

La forma más simple: le pedís que corra el check e itere dentro del mismo mensaje.
La más débil de las cuatro - el que implementa y el que juzga son el mismo contexto, así que hereda el sesgo de "quiero que mi trabajo pase" (ver `references/protocolo-verificacion.md` §2).
Sirve para tareas cortas y de bajo riesgo donde montar cualquiera de los otros tres mecanismos no se justifica.

## 2. `/goal <condición>`

Claude sigue trabajando hasta que la condición se cumple.
Después de cada turno, un Stop hook de sesión corre un modelo evaluador chico que **solo ve la transcripción de la conversación - no corre comandos ni lee archivos por su cuenta**.
Por eso la condición tiene que ser algo que Claude mismo demuestre en su output (ej. "todos los tests pasan" porque Claude corrió los tests y lo mostró) - si la condición depende de un estado que nunca aparece en el chat, el evaluador no lo puede verificar.
Límite de ~4000 caracteres en la condición. Para de forma automática cuando: la condición se cumple, el evaluador la juzga imposible, un turno falla con un error no recuperable, o corrés `/goal clear`.
Bueno para metas acotadas a una sesión donde alcanza con juicio sobre lo que ya se mostró en el chat - no reemplaza al gate determinista de `verify.sh` si la condición necesita evidencia que Claude no puso en la conversación.

## 3. `/loop [intervalo]`

Corre en la sesión local, a un intervalo fijo o en modo dinámico (el propio Claude marca el ritmo con `ScheduleWakeup` según lo que queda por hacer).
Es el mecanismo pensado para lo que este setup arma: retoma `.loop/HANDOFF.md` y `PROGRESS.md` en cada disparo, corre `.loop/verify.sh`, aplica el protocolo Maker/Grader.
Requiere la sesión/máquina activa durante todo el loop.

## 4. `/schedule`

Routine en la nube (Anthropic), con cron - no necesita que tu máquina ni tu sesión sigan abiertas.

Según la charla de referencia de esta skill (no verificado directamente para este catálogo - confirmalo en la práctica antes de asumirlo): cada corrida clona el repo fresco, así que nada que viva solo en el filesystem local entre corridas persiste - si tu loop depende de `.loop/HANDOFF.md` como estado mutable local, `/schedule` probablemente no es el mecanismo correcto sin externalizar ese estado (ej. commitearlo, o guardarlo fuera del repo).

## Cómo elegir

| Necesitás... | Usá |
|---|---|
| Iterar una tarea acotada dentro de la sesión actual, con juicio sobre lo ya mostrado en el chat | `/goal` |
| Correr varias iteraciones con el andamiaje completo de este setup (`.loop/`, `verify.sh`, Maker/Grader), sesión/máquina activa | `/loop` |
| Que corra sin tu máquina prendida, en un cron, y el estado que necesita vive en el repo (no solo en `.loop/` local) | `/schedule` |
| Una tarea corta y de bajo riesgo donde el overhead de montar cualquiera de los anteriores no se justifica | un solo prompt |
