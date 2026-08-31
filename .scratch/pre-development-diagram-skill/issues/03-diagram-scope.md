# Alcance de tipos de diagrama

Type: grilling
Status: resolved

## Question

¿Qué subconjunto de tipos de diagrama cubre la v1 de la skill?

Insumo ya dado por el usuario: quiere cubrir tanto los tipos UML clásicos (secuencia, clases, estados, casos de uso, componentes) como la taxonomía de 5 tipos que maneja Archify (`architecture`, `workflow`, `sequence`, `dataflow`, `lifecycle`) - no uno u otro.

Hay overlap real a resolver: `sequence` aparece en ambas taxonomías, y `lifecycle` de Archify es esencialmente un state/lifecycle diagram de UML. Esta pregunta tiene que decidir si son el mismo tipo con un nombre único, o si coexisten como tipos distintos, y producir la lista final v1 (probablemente un subconjunto de la unión, no la unión completa - ver la nota de gobernanza de que ninguna skill nace en `stable` y que arrancar chico deja que el dogfooding real justifique sumar tipos).

## Answer

**V1 cubre los 8 tipos completos**, deduplicando los dos pares que eran el mismo concepto con nombre distinto:

| Tipo canónico | Viene de | Construcción Mermaid |
|---|---|---|
| `sequence` | UML "secuencia" = Archify "sequence" (fusionado) | `sequenceDiagram` (nativo) |
| `class` | UML "clases" | `classDiagram` (nativo) |
| `state` | UML "estados" = Archify "lifecycle" (fusionado, se usa el nombre "state" por coincidir con el diagrama Mermaid real) | `stateDiagram-v2` (nativo) |
| `use-case` | UML "casos de uso" | `flowchart` (aproximado, per ticket Filosofía de salida) |
| `component` | UML "componentes" | `flowchart` (aproximado, per ticket Filosofía de salida) |
| `architecture` | Archify "architecture" | `architecture-beta` o `flowchart` según el caso |
| `workflow` | Archify "workflow" | `flowchart` |
| `dataflow` | Archify "dataflow" | `flowchart` |

**Razonamiento del "empezar chico" revisado:** el ticket original asumía que cada tipo nuevo es una inversión de ingeniería significativa (como en Archify, con renderer propio por tipo). Al haber resuelto ya "Mermaid puro, sin renderer propio" en el ticket Filosofía de salida, el costo marginal de un tipo más es una fila en la tabla de ruteo + una convención de qué construcción Mermaid usa, no un subsistema nuevo. El principio de gobernanza de "ninguna skill nace en `stable`" sigue aplicando al canal/madurez de la skill entera, no al número de tipos que cubre. Los 8 tipos son casos de uso reales ya nombrados por el usuario, no hipotéticos.

No se agregan tickets nuevos ni se gradúa niebla como consecuencia de esta decisión.
