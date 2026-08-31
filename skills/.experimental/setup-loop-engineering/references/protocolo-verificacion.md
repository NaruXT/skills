# Protocolo de verificación

Detalle que cita `SKILL.md` para los Pasos 2 y 5.
Es lo que hace que un loop sin supervisión directa sea seguro, no solo rápido.

## 1. Litmus test del objetivo (Paso 2)

Antes de dar el objetivo por definido, aplicá esta pregunta: ¿un agente externo, que nunca conversó con quien implementó, sabría solo con la frase del objetivo si está hecho - sin adivinar, sin preguntar?
Si la respuesta es no, es una meta difusa ("mejorá el performance", "que quede profesional").
Empujala hacia algo cuantitativo antes de seguir: un score (Lighthouse >= 90), un umbral (carga en menos de 2s), un conteo (0 skips, eval >= 0.90), un estado (PR aprobado).

## 2. Writer ≠ Grader, en caja negra

El Grader es un subagente separado del que implementó - nunca el mismo contexto autocalificándose.
No conversa con el Maker antes de dar veredicto: mira el artefacto final en frío (diff, output de `verify.sh`, screenshots) - la conversación previa sesga al verificador hacia aprobar.
Para acciones de alto riesgo, un verificador de otro proveedor de modelo reduce aún más el sesgo de familia (no es obligatorio - el punto es que no comparta el incentivo de "que mi propio trabajo pase").

## 3. Capas del gate

- **Determinista (siempre, bloqueante)**: `verify.sh` - exit codes, conteos, scores. Evidencia dura, no interpretación.
- **Juicio (solo para criterios subjetivos o de UI)**: un segundo subagente aplica una rúbrica concreta (preguntas puntuales, no "¿se ve bien?") y DEBE abrir y mirar la evidencia real - nunca confiar en que alguien se la describa.

Antes de caer en la capa de juicio, empujá el criterio hacia algo más determinista si es posible (un score, un diff de screenshot contra una referencia, selector CSS por selector) - un juez LLM es el último recurso cuando no hay forma de hacerlo determinista, no el default para todo lo visual.

## 4. Circuit breaker

- Máximo de intentos por ítem (ej. 6).
- N ROJOS consecutivos en el MISMO ítem -> márcalo BLOQUEADO con la causa concreta en `PROGRESS.md` y seguí con el siguiente ítem. Nunca insistas contra una pared.
- Señales adicionales para pausar y avisar al usuario: iteraciones sin ningún avance (ej. 20 seguidas), o el mismo fallo repitiéndose (ej. 2 veces) - un patrón que se repite no se resuelve insistiendo más fuerte.

## 5. Verde ≠ éxito

- SKIP es legítimo solo cuando falta un prerrequisito real (ej. el selector que el test necesita todavía no existe) - listalo siempre, nunca lo escondas.
- Los skips deben ir bajando con el tiempo. Si en una fase avanzada del roadmap un skip sigue presente, algo se saltó de verdad - no es normal que persista.
- Un sistema caído o inalcanzable NUNCA es SKIP - es ROJO con causa.
- Exit 0 es el piso, no el techo: para cualquier criterio visual, el Grader tiene que abrir y mirar el screenshot, nunca asumir a partir del código de salida.
- Prohibido debilitar, relajar, o borrar un test para pintar verde. Si un caso está mal escrito, se corrige Y se justifica el porqué en el commit - menos cobertura nunca es aceptable como atajo.

## 6. Guardarraíl de irreversibilidad

Categoría aparte de los guardarraíles numéricos del Paso 2: cualquier acción no reversible (movimiento financiero, borrado permanente, envío a un tercero, compra) necesita un bloqueo estructural - un hook o una regla dura que impida avanzar sin humano, no una instrucción que el modelo podría simplemente no seguir.
Tratá al agente como a un practicante: una instrucción vaga sobre algo irreversible es una invitación a que salga mal.

## 7. Presupuesto

- Subagentes de verificación en un tier más barato que el agente principal (ej. principal en el modelo más capaz, verificadores en uno intermedio), con tope de tokens por llamada.
- Tope de gasto duro (llamadas o segundos): si se topa, cerrá la sesión con `PROGRESS.md` como traspaso legible y NO reintentes contra el tope.
- Cuanto más determinista el objetivo (Paso 2), menos se desvía el loop y menos gasta en resultados que terminan descartados - invertir tiempo en una meta bien definida se paga solo.
