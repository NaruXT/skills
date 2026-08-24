---
name: cost-audit
description: Audita el consumo y costo real de un sistema que usa un LLM o cualquier API de pago (tokens, llamadas, requests) — mapea dónde se gasta, agrega logging de uso/costo si no existe, detecta llamadas redundantes o reprocesadas, mide el costo real por unidad con datos de producción y proyecta el gasto mensual. Úsalo cuando el usuario pida auditar/optimizar costos de LLM o API, pregunte "cuánto me está costando esto", "dónde se va la plata", quiera reducir el gasto de un pipeline con IA, o quiera validar que una solución tenga suficiente instrumentación para diagnosticar su propio costo.
---

# Auditoría de costo de LLM/API

Nace de una auditoría real hecha sobre `fb-question-detector`
(2026-07-23): se agregó logging de costo por llamada, se encontró un bug
que reprocesaba el 49% de las llamadas sin necesidad, se corrigió y se
validó con datos reales de producción en varias rondas. Esta skill
generaliza ese mismo proceso a cualquier proyecto.

Es un proceso **interactivo**, no una tarea para delegar a un subagente y
esperar un reporte: cada paso alimenta decisiones del siguiente (qué
instrumentar, si desplegar, cómo interpretar los números reales), y el
usuario suele querer validar con más de una ronda de datos antes de dar
algo por resuelto — no cierres la auditoría con una sola lectura si el
usuario puede generar más tráfico real para confirmar.

## Paso 1 — Mapear los call sites

Encuentra en el código todas las llamadas al LLM/API de pago (buscar el SDK
correspondiente: `anthropic`, `openai`, cliente HTTP a un endpoint pago,
etc.). Para cada call site anota:
- Qué lo dispara (un webhook, un cron, un endpoint, un batch job).
- Con qué frecuencia se ejecuta ese disparador.
- Si hay algún chequeo de "¿ya proceso esto?" antes de llamar al modelo, y
  si ese chequeo cubre **todos** los resultados posibles o solo algunos
  (el bug típico: se persiste el resultado "positivo" pero no el
  "negativo", así que lo negativo se reprocesa indefinidamente en cada
  ciclo — exactamente lo que pasó acá).

## Paso 2 — Ver si ya hay logging de costo

Busca si el proyecto ya registra tokens/costo por llamada en algún lado
(tabla, log file, servicio de observabilidad). Si existe, úsalo. Si no
—el caso más común— sigue al paso 3.

## Paso 3 — Agregar logging mínimo (si no existe)

No hace falta nada elaborado. Como mínimo, por cada llamada real al
modelo/API:
- Identificador de qué se procesó (comment_id, request_id, lo que aplique
  como clave de dedup natural del dominio).
- Origen/disparador (qué código lo llamó — webhook, cron, endpoint, cli).
- Tokens de entrada/salida (o el equivalente de unidades facturables de la
  API que sea) y el costo calculado con el precio vigente del proveedor.
- Timestamp.

Si el runtime lo permite, expón un endpoint o comando de solo lectura para
consultar el log agregado (por día, por tipo de llamada, por origen, y
—importante— un desglose por identificador individual para detectar
reprocesamiento: más llamadas que resultados distintos posibles para el
mismo identificador = se está repitiendo trabajo). Antes de tocar código de
producción o hacer deploy, confirma con el usuario — instrumentar
logging es de bajo riesgo pero sigue siendo un cambio a un sistema real.

## Paso 4 — Buscar patrones de desperdicio con datos reales

Con el log corriendo (aunque sea unas horas), consulta:
- ¿Qué % del costo total es el mismo identificador procesado más de una
  vez? Si es alto, ese es el primer sospechoso — casi siempre viene de una
  falta de memoización como la del paso 1, no de volumen real.
- ¿Qué origen/disparador concentra el costo? Un cron/polling que se
  superpone con un webhook en tiempo real es un patrón común de
  duplicación.
- ¿Hay llamadas más caras de lo necesario por prompt/contexto
  sobredimensionado (ej. few-shot examples enormes en cada llamada cuando
  podrían cachearse o recortarse)?

## Paso 5 — Medir costo real por unidad y proyectar

Con los datos reales (no estimados) del log:
- Costo real por tipo de operación (ej. "clasificar" vs "generar
  respuesta"), comparado contra cualquier estimación teórica previa que
  tuviera el proyecto — si difieren mucho, dilo explícitamente.
- Proyección mensual: pide o infiere el volumen esperado, aplica el costo
  real medido por unidad (no el estimado), y da un rango de sensibilidad
  si la mezcla de tipos de operación es incierta — no una sola cifra
  sin contexto.
- Si se encontró y corrigió un bug de reprocesamiento, aclara que el
  costo histórico medido incluye ese bug y no es proyectable tal cual;
  proyecta con el costo post-fix.

## Paso 6 — Reportar y validar antes de cerrar

- Números concretos con su fuente (tabla, query), no aproximaciones por
  resta de totales si se puede tener el dato exacto — si el usuario nota
  que una cifra estimada no cuadra, prioriza dar el desglose exacto en vez
  de defender la aproximación.
- Si se implementó un fix, ofrece (y si el usuario acepta, ejecuta) una
  validación con una ronda nueva de datos reales antes de darlo por
  cerrado — idealmente más de una ronda, para confirmar que el patrón se
  mantiene y no fue casualidad de una sola muestra.
- Documenta el hallazgo y el fix en el proyecto (ADR si el proyecto usa esa
  convención, o el doc de costos/arquitectura que corresponda) — no dejes
  el contexto solo en el chat.

## Cuidado con el blast radius

- Nunca dispares tráfico real (llamadas a APIs externas reales de
  terceros, notificaciones a usuarios reales, publicaciones) para "generar
  datos de prueba" sin permiso explícito — mejor esperar tráfico orgánico
  o pedirle al usuario que genere la actividad de prueba él mismo.
- Cualquier commit/push/deploy que surja de la auditoría (agregar
  logging, aplicar un fix) se confirma con el usuario antes de ejecutarse,
  igual que cualquier otro cambio a un sistema en producción.
- Si vas a usar herramientas de infraestructura (CLI de un proveedor cloud,
  etc.) para inspeccionar el entorno de producción, usa solo comandos de
  **solo lectura** a menos que el usuario pida explícitamente algo que
  modifique estado — algunos comandos "inofensivos" en apariencia
  (ej. `railway domain` sin subcomando) mutan infraestructura por default.
