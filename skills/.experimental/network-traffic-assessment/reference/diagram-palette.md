# Paleta visual — estilo Palo Alto Networks Health Check

Colores y tipografías extraídos **directamente del contenido vectorial** del PDF de referencia
("Health Check of Next Generation Firewall Report", Palo Alto Networks) con PyMuPDF — no son
una aproximación visual, son los valores hex reales del documento. Reemplaza por completo la
paleta anterior basada en el `.docx` de AENZA (verde `#019F61`, rojo `#C00000`, ámbar
`#BF8F00`) — ya no se usa como referencia visual en este skill.

## Jerarquía de color por nivel de contenido

| Nivel | Uso | Color | Fuente/tamaño típico |
|---|---|---|---|
| 1 | Títulos principales: portada, "Executive Summary", "Scope", "Recommendations", nombre del dispositivo/sección raíz | `#FFCB06` (dorado) | Montserrat-Bold, 15-26pt |
| 2 | Categorías dentro de una sección raíz: "System Evaluation", "Health Checks status", "Best Practices Evaluation", y las etiquetas de severidad "Critical"/"High"/"Important"/"Low" | `#FA582D` (naranja-rojo) | Montserrat-Bold 14pt / Tahoma-Bold 10pt |
| 3 | Nombre de cada check individual (encabezado del bloque Device/Findings/Recommendations/References): "Zone Protection Profile", "Password Management", etc. | `#4F81BD` (azul) | Montserrat-Bold 12pt |
| 4 | Etiquetas de campo dentro de un check: "Findings", "Recommendations", "References", "Device / Observación" | `#807C7B` (gris) | Tahoma-Bold 12pt |
| — | Fondo de encabezado de tabla (texto en blanco) | `#FFCB06` | — |
| — | Enlaces de Referencias | `#1155CC` (azul estándar de hipervínculo) | Tahoma, subrayado |
| — | Cuerpo de texto | `#000000` / `#333333` (variación menor, ambos válidos) | Tahoma / ArialMT, 10pt |
| — | Pie de página (copyright, número de página) | `#000000` o gris neutro | Montserrat-Regular, 8pt |

> **Nota sobre severidad**: en el PDF de origen, **Critical/High/Important/Low usan el mismo
> color** (`#FA582D`) — Palo Alto no codifica la severidad por color distinto, solo por la
> etiqueta de texto y el agrupamiento. Este skill sí mantiene una distinción visual por
> severidad en la lista de Recomendaciones priorizadas (ver más abajo) porque es información
> de alto valor práctico, pero usando **solo colores ya verificados de esta paleta** (no se
> introduce ningún color nuevo):
> - Crítico / Alto → `#FA582D` (negrita)
> - Importante → `#4F81BD`
> - Bajo / Otras Recomendaciones → `#807C7B`

## Tipografía

El PDF usa **Montserrat** (encabezados) y **Tahoma** (cuerpo/etiquetas) — ambas son fuentes que
normalmente no vienen preinstaladas fuera de macOS/Windows con Office. Para el `.docx` generado
por `scripts/render_docx.py`, se especifica Montserrat/Tahoma como fuente preferida, con
fallback automático a Calibri/Arial si el sistema del usuario no las tiene instaladas (Word las
sustituye solo). No es necesario instalar las fuentes para que el documento sea válido.

## Diagrama de arquitectura (dentro de "Network Evaluation")

El PDF de Palo Alto no incluye diagramas de topología (es un reporte de compliance/hardening,
no de arquitectura) — el diagrama de Internet → WAN → Firewall → LAN → núcleo con bypass sigue
siendo un aporte propio de este skill dentro del check de "Network Evaluation" (ver `SKILL.md`
y `heuristics.md`). Se remapea a la paleta verificada de Palo Alto en vez de la paleta SEK
anterior, manteniendo distinción funcional entre elementos:

| Elemento del diagrama | Relleno | Borde/texto |
|---|---|---|
| Internet (nodo raíz) | Azul muy claro | `#4F81BD` |
| Interfaces WAN | Dorado claro | `#FA582D` |
| Firewall (nodo central) | Negro `#141414` | Texto blanco |
| Interfaces LAN | Azul claro | `#4F81BD` |
| Núcleo con bypass este-oeste | Relleno con mayor énfasis (borde más grueso) | `#FA582D` en negrita — es el mismo naranja-rojo que "Critical" en el PDF, consistente con que es el hallazgo de mayor severidad |
| Panel de Peers VPN IPSec | Gris muy claro | `#807C7B` |

## Recomendaciones priorizadas (bloque `recommendations_by_severity`)

Reemplaza la antigua "Matriz de Hallazgos H-1...H-N" en tabla. Sigue el patrón exacto del PDF:
un bloque de texto por nivel de severidad, con bullets (y sub-bullets para ejemplos concretos
como nombres de regla/zona/dispositivo), sin numeración de hallazgo. Orden: Crítico → Alto →
Importante → Bajo → Otras Recomendaciones (esta última replica la sección "Other
Recommendations" del PDF: buenas prácticas de mantenimiento general, no atadas a un hallazgo
puntual).
