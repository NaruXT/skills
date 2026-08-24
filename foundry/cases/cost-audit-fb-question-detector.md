# cost-audit — Bug de reprocesamiento en fb-question-detector

- Skill: `cost-audit`
- Fecha: 2026-07-23
- Proyecto/contexto: `fb-question-detector`

## Qué se hizo

Se agregó logging de costo por llamada al LLM (identificador de qué se procesó, origen/disparador, tokens de entrada/salida, costo calculado, timestamp) sobre un pipeline que no tenía instrumentación de costo. Con el log corriendo, se buscó qué porcentaje del costo total correspondía al mismo identificador procesado más de una vez.

## Resultado

Se encontró que el 49% de las llamadas al modelo eran reprocesamiento innecesario: el pipeline persistía el resultado "positivo" de una clasificación pero no el "negativo", así que cada ítem clasificado como negativo se volvía a procesar en cada ciclo siguiente en vez de quedar marcado como ya visto. Se corrigió el chequeo de dedup para cubrir ambos resultados posibles, y se validó el fix con datos reales de producción en varias rondas antes de darlo por cerrado.

## Evidencia recuperable

El propio `SKILL.md` de `cost-audit` documenta el caso como su origen (ver encabezado del archivo). La corrección vive en el historial de commits de `fb-question-detector`; no hay un artefacto separado fuera del repo de ese proyecto.
