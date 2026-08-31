# Verificación visual — mecánica de las herramientas

El `SKILL.md` que te trajo acá (sección "Verificación visual") dice cuándo
invocar esto — leé esa sección primero. Esto es solo la mecánica de los dos
comandos, compartida entre `architecture-map` y `design-diagrams`.

Dos herramientas distintas, para dos audiencias distintas. **Ninguna de las
dos corre en el paso de validación automática** — ese chequeo, por cada
diagrama, sigue siendo solo `validate.mjs` (sintaxis, sin imagen, sin tokens
de visión). Esto es para cuando *vos* (el modelo) o el usuario necesitan
mirar el resultado.

## Para que el usuario lo vea — abre una ventana real de navegador

```bash
node ~/.claude/skills/_shared/mermaid-validate/scripts/open-live.mjs <archivo.md>
```

Extrae el fence ` ```mermaid ` automáticamente (o usá un `.mmd` suelto
directo) y abre `mermaid.live` con el diagrama ya cargado — mismo motor
oficial que GitHub, cero copiar/pegar manual.

## Para que VOS lo veas (depurar un layout, confirmar que un fix funcionó, sin abrir nada visible) — headless, sin ventana

```bash
node ~/.claude/skills/_shared/mermaid-validate/scripts/screenshot.mjs <archivo.md> <salida.png> [ancho] [alto]
```

Renderiza con `mermaid.js` real vía Chrome/Chromium headless (autodetecta el
binario: macOS, `google-chrome`, `chromium`) a un PNG local, sin ventana
visible, sin mandar nada a `mermaid.live`. Después usá el tool `Read` sobre
ese PNG para mirarlo con tu propia visión.

## Dependencias

Ambas necesitan `pako`/`js-base64` (`open-live.mjs`) además de `mermaid`/
`jsdom` del Prerequisito — mismo `bun install`, ya declaradas en el
`package.json` de `~/.claude/skills/_shared/mermaid-validate/scripts/`.
