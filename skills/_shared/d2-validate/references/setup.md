# Prerequisito — por qué hace falta `@d2lang/d2` y qué hacer si falla

El paso de validación y el de render usan `@d2lang/d2`, el wrapper oficial en
WASM de D2 (el mismo compilador que usa la CLI real) — no hace falta instalar
ningún binario de Go por separado, es un paquete npm normal.

`compile()` hace de parser real: rechaza con el error exacto del compilador
si el D2 tiene un problema de sintaxis, sin hacer el layout completo (por
eso `validate.mjs` es liviano). `render()` sí hace el layout y produce el
SVG final — se corre una sola vez, después de que `compile()` ya pasó.

Instalación de una sola vez:

```bash
cd ~/.claude/skills/_shared/d2-validate/scripts
bun install   # o: npm install
```

Antes de validar, verificá que esté disponible:

```bash
node -e "require.resolve('@d2lang/d2', {paths: ['/Users/josueroquecastillo/.claude/skills/_shared/d2-validate/scripts']})" 2>&1
```

Si falla, **no lo instales vos**: decile al usuario "Falta `@d2lang/d2`
instalado — corré `cd ~/.claude/skills/_shared/d2-validate/scripts && bun
install` y volvé a pedirme esto" y detenete ahí. El resto de la skill
funciona igual sin esto, pero **el diagrama de topología de infraestructura
no se puede generar sin esto** (no hay SVG sin `render()`, y sin `compile()`
no hay garantía de que el D2 sea sintácticamente válido) — avisale eso al
usuario explícitamente y seguí con el resto de los diagramas (Mermaid) sin
bloquearte en este.
