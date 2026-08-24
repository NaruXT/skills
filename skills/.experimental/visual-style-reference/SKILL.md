---
name: visual-style-reference
description: Analiza una imagen (screenshot, diseño, moodboard, captura de UI) y genera un documento de referencia de estilo visual completo — paleta de colores con hex codes, sistema tipográfico, elementos de diseño distintivos y concepto visual. Usar cuando el usuario pida analizar el estilo visual de una imagen, extraer una paleta de colores de un diseño, crear una "visual style reference" / "style guide" a partir de una imagen, o documentar la identidad visual de una referencia para replicarla en otro proyecto.
---

## Task

Analizar la imagen provista y crear un documento **Visual Style Reference** detallado en Markdown.

### Input

$ARGUMENTS

Si `$ARGUMENTS` es una ruta de archivo o URL de imagen, léela/ábrela antes de analizar. Si el usuario adjuntó la imagen directamente en la conversación, analiza esa. Si no hay ninguna imagen disponible, pide al usuario que la provea antes de continuar — no inventes un análisis sin haber visto la imagen.

### Estructura del output

Generar un documento Markdown con las siguientes secciones:

**1. Core Aesthetic**
- Nombre del estilo (en negrita, descriptivo)
- Filosofía de diseño en una oración
- Influencias clave o estilos híbridos identificados

**2. Color Palette**
- Listar cada color con:
  - Nombre del color
  - Código hex
  - Contexto de uso
- Indicar el conteo total de colores

**3. Typography System**
- Estilo de headline (peso, tipo de familia tipográfica, escala)
- Tratamiento de texto secundario/body
- Estructura de jerarquía
- Consideraciones especiales (bilingüe, monospace, etc.)

**4. Key Design Elements**
Desglosar las técnicas visuales distintivas:
- Texturas y tratamientos
- Elementos gráficos (líneas, formas, anotaciones)
- Estructura de layout y sistema de grilla
- Decisiones estilísticas únicas

**5. Visual Concept**
- Resumir el puente conceptual del diseño
- Explicar la relación entre los elementos
- Sugerir casos de uso ideales

### Guidelines

- Ser específico con detalles técnicos (códigos hex, clasificación de fuentes).
- Usar bullet points para que sea fácil de escanear.
- Reflejar jerarquía visual en el formato del propio documento (headers, negrita).
- Señalar contrastes y tensiones en el diseño.
- Identificar qué hace distintivo al diseño — evitar descripciones genéricas que aplicarían a cualquier imagen.
- No adivinar códigos hex a ojo si se puede inspeccionar la imagen con más precisión (zoom, herramienta de color) — preferir precisión sobre aproximación.

### Al terminar

Preguntar al usuario si quiere que el documento se guarde como archivo (y en qué ruta) antes de escribirlo — no asumir que el output solo debe quedar en el chat si claramente lo van a reutilizar como referencia en el proyecto.
