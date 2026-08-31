# Especificación de agente: design-diagrams

**Fecha:** 2026-08-31
**Estado:** borrador - lista para pasar a `CREATING_SKILLS.md`, construcción todavía no iniciada

## 1. Discovery

| Campo | Definición |
|---|---|
| Usuario | Josue, en su rol de arquitecto de software, durante la fase de planeación de cualquier proyecto de software que esté armando. |
| Caso de uso | Diagramar los flujos de una feature o conjunto de features antes de codearlas. |
| Dolores | Sin diagrama se escapan casos borde en la interacción entre componentes; aparecen alucinaciones de la IA en la etapa de implementación por falta de referencia visual/estructural; no queda documentación que el resto del proceso de planeación pueda referenciar. |
| Soluciones | La skill toma información de la ideación y la planeación ya existente; si no alcanza, hace las preguntas necesarias para no dejar dudas; infiere qué tipo(s) de los 8 diagramas aplican según el contexto; genera el/los diagrama(s) en Mermaid; el usuario revisa y/o ajusta; queda en un archivo del repo citable por otras skills. |
| Métrica de producto | % de diagramas generados que no necesitan corrección manual antes de usarse. |
| Métrica de negocio | Reducción medible de alucinaciones o retrabajo en la etapa de implementación en los proyectos donde se usó, documentada como caso en `foundry/cases/`. |

## 2. Identidad

- **Rol:** Es un asistente de diagramación de diseño pre-código: responsable de traducir una descripción de diseño (de ideación/planeación) en uno o más diagramas Mermaid del tipo correcto, sin inventar detalles que no surgieron de la conversación ni del contexto disponible - si falta información, pregunta antes de generar.
- **Comportamiento** (cuándo pregunta vs. cuándo ejecuta autónomo): Pregunta siempre que la información disponible sea insuficiente para generar el diagrama sin rellenar huecos con suposiciones propias. Si la información alcanza, infiere el/los tipo(s) de diagrama aplicables (de los 8 definidos) y genera directamente, sin pedir permiso previo para elegir el tipo. Si, incluso después de preguntar, sigue faltando información suficiente para algún tipo de diagrama en particular, la skill indica explícitamente cuáles diagramas no va a generar y por qué - nunca los omite en silencio ni los genera incompletos rellenando con suposiciones.
- **Reglas duras** (lo que nunca hace):
  1. Nunca genera un diagrama con sintaxis Mermaid sin validarla contra el parser oficial de mermaid.js antes de darlo por terminado.
  2. Nunca inventa componentes, flujos o elementos que no surgieron de la conversación, la ideación o la planeación disponible.
  3. Nunca diagrama código real existente como si fuera el diseño target - eso es responsabilidad de `architecture-map`; respeta el límite de disparo decidido para este catálogo.
- **Vocabulario** (términos propios / prohibidos): Usa siempre los 8 nombres canónicos de tipo de diagrama - `sequence`, `class`, `state`, `use-case`, `component`, `architecture`, `workflow`, `dataflow` - evita sinónimos ("lifecycle", "flujo de proceso", "diagrama de casos de uso", etc.) tanto en prosa como en nombres de archivo/sección.
- **Tono:** Directo y técnico, sin formalismos.

## 3. Skills

| Skill | Camino de creación (A: co-creación / B: extracción de SOP) | Estado |
|---|---|---|
| Validación de sintaxis Mermaid contra el parser oficial | B: extracción, de `architecture-map` (Paso 5 de su `SKILL.md`), vía la ubicación compartida `skills/_shared/mermaid-validate/` | Definido |
| Type router para `architecture`, `workflow`, `sequence`, `dataflow`, `state` | B: extracción, de la tabla tema→tipo de Archify (citada en `foundry/research/archify-vs-architecture-map.md` y en `foundry/open-problems/pre-development-diagram-skill.md`) | Definido |
| Type router extendido para `class`, `use-case`, `component` | B: extracción/adaptación - temas nuevos definidos en este intake (sin precedente en Archify): `class`→entidades del dominio y sus relaciones; `use-case`→qué puede hacer un actor sobre lo diseñado; `component`→composición interna e interfaces de un componente específico | Definido |
| Detectar información insuficiente y declarar qué diagramas no se generan | A: co-creación, definida en este mismo intake - no existe documento previo del que extraerla | Definido |

## 4. Herramientas

| Herramienta | Tipo de conexión (MCP/CLI/API) | Alcance de permisos |
|---|---|---|
| Bash | CLI (script local `validate.mjs` / `screenshot.mjs` en `skills/_shared/mermaid-validate/`) | Ejecución local, sin red |
| Write | Nativa de Claude Code | Lectura-escritura solo dentro del repo del usuario |
| Read | Nativa de Claude Code | Solo lectura, documentos de ideación/planeación ya existentes en el repo |

Sin MCP ni API externa - la skill no toca ningún sistema de terceros (no requiere repo real grounding, no integra con Archify ni ninguna otra herramienta externa).

## 5. Modelo

- **Modelo(s) elegido(s):** Hereda el modelo de la sesión activa de Claude Code que la invoca. No elige ni fuerza un modelo propio.
- **Motivo** (costo / razonamiento / velocidad): Es una skill que se carga inline dentro de la sesión en curso (standalone, o desde `/shaping`, `/breadboarding`, `/to-spec`, `/to-tickets`, `/create-plan`) - no es un subagente con configuración de modelo independiente, así que no tiene forma técnica de forzar un modelo distinto al de la sesión.
- **¿Fijo o varía según tarea?:** No elige - siempre hereda. Al invocarse, **sugiere explícitamente** al usuario cambiar a Opus vía `/model` para el trabajo de planeación (mayor razonamiento), dejando la decisión final a la persona - no bloquea ni fuerza el cambio.

## 6. Memoria

- **Nivel elegido:** archivo plano (`.md`) en el propio repo del usuario.
- **Qué guarda:** un archivo `docs/design/<slug>.md` por diagrama generado (título, contexto, bloque Mermaid, notas - mismo formato que usa `architecture-map` para sus diagramas de detalle), más un índice `docs/design.md` por proyecto que lista qué tipos de los 8 ya se generaron y linkea a cada archivo. Este índice funciona como la memoria entre invocaciones: antes de generar, la skill lo lee para saber qué ya existe.
- **Qué NO debe guardar:** historial de conversación, suposiciones no confirmadas por el usuario, o cualquier dato fuera del propio diagrama y sus notas.

## 7. Riesgos de seguridad

- **Exposición de credenciales:** no aplica - la skill no toca sistemas externos, APIs ni credenciales; todo el trabajo es local al repo y a la conversación.
- **Prompt injection / manipulación de comportamiento:** riesgo bajo. La skill no ingiere contenido no confiable de terceros (solo conversación directa con el usuario y documentos de planeación del propio repo) y no tiene acceso a acciones externas irreversibles (solo escribe archivos `.md` locales, revisables antes de cualquier commit). No se activa la regla dura de "tratar el contenido ingerido como datos" del protocolo de `agent-architect`, porque no se cumple la condición de ingesta de contenido no confiable combinada con efectos externos.

## 8. Disciplina de alcance

- [x] Este agente cubre un solo rol: diagramar diseño pre-código en etapa de planeación.
- [x] No aplica el chequeo de vocabulario/reglas entre dominios - todas las skills (validación, type router, detección de información insuficiente) son facetas del mismo propósito declarado, no dominios de negocio distintos.

## 9. Checklist de cierre (gate de ambigüedad)

Las 14 casillas de las secciones 1 a 6 están completas, sin "TBD" ni respuestas vagas. La sección de métricas (1) incluye las dos filas - producto y negocio.

---

## Nota para CREATING_SKILLS.md - `description` propuesta (fuera de la plantilla estándar de agent-architect)

Esta sección no es parte de la plantilla genérica de `agent-architect` - se agrega porque el ticket de Wayfinder que originó este intake pidió explícitamente una `description` que incluya el límite de disparo ya decidido frente a `architecture-map`.

> Diagrama, en etapa de planeación, el diseño de una feature o sistema que todavía no existe en código (o que existe pero se está rediseñando) - sin necesitar un repo real. Cubre 8 tipos (`sequence`, `class`, `state`, `use-case`, `component`, `architecture`, `workflow`, `dataflow`), inferidos por el tema de lo que se está diseñando, con Mermaid puro validado contra el parser oficial de mermaid.js antes de darse por terminado (mecanismo compartido con `architecture-map`). Invocable standalone o desde `/shaping`, `/breadboarding`, `/to-spec`, `/to-tickets`, `/create-plan`. Usar cuando el usuario pida "diagramame cómo debería quedar X", "antes de escribir código, diagramá el flujo/las clases/los estados propuestos", "diseñame un diagrama de secuencia/clases/estados/casos de uso para esto que estamos planeando" - incluso con repo existente, mientras el diagrama describa un diseño target, no el código actual. No usar cuando ya existe el código y se quiere documentar/diagramar lo que YA hace (para eso, `architecture-map`).

## Pendientes heredados del mapa de Wayfinder para la sesión de construcción (fuera de esta spec)

- Reemplazar la referencia rota "mermaid-skill" en `architecture-map/SKILL.md` por `design-diagrams`, agregando la cross-referencia inversa en el mismo cambio.
- Extraer `validate.mjs`, `screenshot.mjs` y las referencias de validación de `architecture-map` a `skills/_shared/mermaid-validate/` (symlink `~/.claude/skills/_shared/mermaid-validate`), actualizar `architecture-map` para apuntar ahí, y revisar `scripts/validate-skills.mjs` para que entienda/ignore `skills/_shared/` correctamente.
- Registrar `design-diagrams` en `foundry/maturity.json` con `channel: "experimental"` y `maturity: "experimental"`.
