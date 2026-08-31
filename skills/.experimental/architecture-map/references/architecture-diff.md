# Diff estructurado del boundary diagram — "Qué cambió desde la última corrida"

El `SKILL.md` (Paso 7) dice cuándo aplicar esto — solo al actualizar un
`docs/architecture.md` existente, y solo para el `flowchart` de
`overall-architecture`. Esto es la mecánica.

## Por qué solo ese diagrama

Es el único que toda corrida genera siempre (Paso 2). Los diagramas de
detalle pueden aparecer o desaparecer entre corridas según lo que el código
justifique en ese momento — no hay garantía de que exista una versión
anterior comparable para diffear.

## Cómo extraer la lista de nodos y edges

No hace falta un parser de grafos: alcanza un parseo de línea simple sobre
el texto del `flowchart` viejo (el que está entre los marcadores
`architecture-map:generated:start`/`end` en la versión actual del archivo,
antes de reemplazarla) contra el nuevo que acabás de redactar.

- **Nodos**: líneas con la forma `id[Label]`, `id(Label)`, `id{{Label}}`,
  etc. — extraé `id` y el label.
- **Edges**: líneas con `-->`, `-.->`, `==>` — extraé origen, destino, y el
  label del edge si tiene (`-- texto -->`).

Comparalos:

- **Agregado**: el `id` (nodo) o el par origen→destino (edge) existe en el
  nuevo, no en el viejo.
- **Eliminado**: existe en el viejo, no en el nuevo.
- **Renombrado**: mismo `id` en ambos pero label distinto, o mismo label
  con `id` distinto — juicio del modelo: si dos nodos comparten posición
  relativa y responsabilidad evidente, es un rename, no un alta + baja.

## Formato de salida

```markdown
## Qué cambió desde la última corrida

- Agregado: `<nodo o edge nuevo>`
- Eliminado: `<nodo o edge que ya no está>`
- Renombrado: `<nombre viejo>` → `<nombre nuevo>`
```

Si la comparación no encontró ningún cambio, escribí una sola línea ("Sin
cambios estructurales desde la última corrida") en vez de omitir la
sección — a diferencia de la primera corrida (sin versión previa, donde sí
corresponde omitirla), acá hubo una comparación real y vale la pena
decir que no encontró nada.
