# Lente 2 — "El Algoritmo" (0-100)

Framework de primeros principios (estilo Elon Musk), traducido a software/producto. 6 dimensiones fijas, pesos fijos — no se ajustan por proyecto. Lo que varía por proyecto es la evidencia que encontrás, no la estructura.

Cada dimensión tiene un **indicador de proceso/calidad** (cómo se hizo el trabajo) y un **indicador de resultado real** (lo que efectivamente experimenta el usuario final del producto — nunca solo "horas u horas de ahorro interno", eso es contabilidad, no producto).

| # | Dimensión | Peso | Qué significa en software | Indicador de proceso/calidad | Indicador de resultado real (usuario final) |
|---|---|---|---|---|---|
| 1 | Cuestionar requisito | 10% | Cada feature construida tiene un dueño y una necesidad real trazable al brief, no "porque parecía buena idea" | % de features del repo con justificación trazable a `.shipcheck-brief.md` | El usuario puede completar la tarea central del producto sin toparse con un hueco donde debería haber una feature que se descartó por error |
| 2 | Eliminar | 10% | Se identificó y removió lo que no aportaba (features, servicios, dependencias) | Tasa de restauración post-eliminación — si tuvo que devolver algo, cortó de más (el 10% es calibrador, no meta) | El usuario no percibe ninguna carencia funcional por lo que se eliminó |
| 3 | Simplificar | 15% | Arquitectura directa para el tiempo disponible, no capas/microservicios de más ("la mejor parte es la que no existe") | Conteo de componentes/dependencias vs. el mínimo necesario para el problema declarado | La arquitectura simple no degrada la experiencia ni la confiabilidad que el usuario percibe |
| 4 | Acelerar ciclo | 25% | Cadencia real de commits, lead time entre encontrar un problema y arreglarlo | Commits/hora activa, lead time promedio fix-encontrado → fix-committeado (leer `git log` real, no asumir) | Cada iteración conecta con una mejora verificable en el resultado que ve el usuario, no solo actividad — equivalente a "measured improvement": el historial de commits debería poder leerse como una cadena de evidencia, no una lista de "wip" |
| 5 | Automatizar | 30% | Qué tan mecanizada está la verificación (CI, tests que gatean, no memoria humana bajo presión) — la dimensión de mayor peso porque es donde más evidencia real de gap apareció en auditorías previas | % de checks críticos (tests/lint/build) gateados automáticamente vs. dependientes de que alguien se acuerde de correrlos | El happy path corre de punta a punta para el usuario sin intervención manual, y otra persona puede reproducirlo desde un ambiente limpio ("reproducibility") |
| 6 | Reutilizar | 10% | Usar librerías/soluciones probadas en vez de reinventar lo no-diferenciador | % de funcionalidad no-core delegada a librerías/servicios probados vs. reimplementada desde cero sin necesidad | El tiempo no gastado reinventando se invirtió en algo que el usuario sí nota (UX, confiabilidad, velocidad percibida) |

## Cómo buscar evidencia por dimensión

- **Cuestionar requisito / Eliminar**: comparar el árbol de features/endpoints/pantallas contra los criterios de éxito del brief. Una feature sin ningún criterio que la explique es sospechosa, no automáticamente mala — preguntá o marcá como hallazgo a confirmar.
- **Simplificar**: contar servicios/procesos/lenguajes/frameworks distintos en el repo. Más de 2-3 piezas móviles en un proyecto de <48h es una señal a investigar, no una condena automática — el tiempo disponible del brief es el criterio, no un número mágico universal.
- **Acelerar ciclo**: `git log --format='%ad %s' --date=iso` para ver cadencia real. Buscá gaps largos sin commits relativos a la duración total del evento, y mensajes de commit que describan un fix concreto vs. mensajes vacíos ("wip", "fix", "asdf").
- **Automatizar**: `find . -iname "*.yml" -path "*workflows*"` o equivalente para CI; contar archivos de test reales (no vacíos) vs. si algo los ejecuta automáticamente antes de un deploy (`render.yaml`, `vercel.json`, etc. que despliegan sin gate de test es la señal negativa).
- **Reutilizar**: mirar `package.json`/`requirements.txt`/equivalente vs. código propio que reimplementa algo que una librería ya resuelve (parsers, auth, validación de schema).

## Fórmula

`Score Lente 2 = Σ (peso_dimensión × score_dimensión_0_a_100) / 100`

Cada dimensión se puntúa 0-100 combinando su indicador de proceso y su indicador de resultado real — si hay evidencia fuerte en uno y ausente en el otro, el score de esa dimensión refleja el promedio ponderado hacia abajo, no se ignora el indicador faltante.
