# Prerequisito — por qué hace falta `jsdom` y qué hacer si falla

El paso de validación necesita el paquete oficial `mermaid` **más `jsdom`**,
que le da el DOM que `mermaid.parse()` necesita internamente para sanitizar
labels — sin `jsdom`, solo `sequenceDiagram` parsea bien en Node; `flowchart`,
`classDiagram`, `erDiagram` y `stateDiagram-v2` fallan con un error interno
ajeno a la sintaxis del diagrama que estás validando (no es que el diagrama
esté mal escrito, es que falta esa dependencia).

Compartido entre `architecture-map` y `design-diagrams` — instalación de una
sola vez, sirve para las dos. Ninguna de las dos skills instala nada sola:

```bash
cd ~/.claude/skills/_shared/mermaid-validate/scripts
bun install   # o: npm install
```

Antes de validar, verificá que esté disponible:

```bash
node -e "require.resolve('mermaid', {paths: ['/Users/josueroquecastillo/.claude/skills/_shared/mermaid-validate/scripts']}); require.resolve('jsdom', {paths: ['/Users/josueroquecastillo/.claude/skills/_shared/mermaid-validate/scripts']})" 2>&1
```

Si falla, **no lo instales vos**: decile al usuario "Falta `mermaid` instalado
— corré `cd ~/.claude/skills/_shared/mermaid-validate/scripts && bun install`
y volvé a pedirme esto" y detenete ahí. El resto de la skill (explorar/diseñar,
escribir el `.md`) funciona igual sin esto, pero **sin garantía de que el
Mermaid generado sea sintácticamente válido** — avisale eso al usuario
explícitamente si seguís sin poder validar.
