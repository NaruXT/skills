# Lente 3 — Robustez de ingeniería

Dos capas. La primera es un piso mínimo con evidencia externa (research de ~170 repos de Platanus Hack, inspección profunda de los 9 con más puntaje/ganadores oficiales). La segunda es abierta — el piso fijo no es exhaustivo, y dos de los gaps reales encontrados en repos propios del usuario (tests sin CI, README raíz boilerplate) no estaban en la lista original de 6 ítems hasta que aparecieron.

## Capa 1 — Checklist fijo de antipatrones conocidos

Para cada ítem: buscá evidencia concreta (archivo:línea), no lo des por sentado ni por ausente sin mirar.

1. **`eval()`/`exec()` o parseo de texto libre sobre output crudo de un LLM**, en vez de salida estructurada validada contra un schema (ej. `response_format=json_schema`, Zod, Pydantic). Buscá dónde el código consume la respuesta de un modelo y cómo la valida antes de actuar sobre ella.
2. **Lógica crítica (seguridad, corrección, dinero) que depende 100% del LLM** sin un guardrail o validador determinista después de la generación. El patrón correcto contrario (a buscar como evidencia positiva, no solo negativa): una decisión de alto riesgo restringida por schema a un subconjunto de acciones seguras, con la decisión más peligrosa resuelta por código determinista, no por el modelo.
3. **Código muerto, archivos vacíos, o endpoints fantasma** — el frontend llama algo que el backend no expone (404 silencioso). Cruzar las rutas que el cliente invoca contra las rutas que el servidor realmente define.
4. **Tests o CI de fachada** — carpetas de test vacías, o tests reales que existen pero ningún workflow de CI los ejecuta antes de un deploy (`find .github/workflows`, o el equivalente de la plataforma de CI que use el proyecto). Esta es la variante que más apareció en la evidencia propia del usuario — no asumas que "hay tests" es suficiente, verificá que algo los gatea.
5. **Submódulos de git rotos o vacíos** que dejan el código real fuera del repo entregable (`git submodule status`, o revisar `.gitmodules` contra el contenido real de esos directorios).
6. **README boilerplate** — el archivo que un jurado o cliente abre primero sigue siendo el scaffold sin editar de un framework (`create-next-app`, `create-react-app`, etc.), aunque exista documentación real del producto en otro archivo (`CLAUDE.md`, `docs/`, etc.) que nadie ve primero. Abrí el README raíz literal, no asumas que la documentación real en otro lado cuenta como si estuviera ahí.

## Capa 2 — Pasada abierta de rastreo de evidencia

El checklist de la Capa 1 es piso, no techo. Para cada afirmación que el repo hace sobre sí mismo, verificá si es cierta:

- El README dice que el producto hace X — ¿el código realmente implementa X, o solo una parte?
- Existe un archivo de configuración de deploy — ¿el deploy realmente funciona, o solo existe el archivo?
- Hay un test con nombre `test_happy_path` o similar — ¿prueba el camino real, o es un smoke test trivial que no prueba nada?
- El proyecto dice usar un patrón de seguridad (auth, rate limiting, validación) — ¿está aplicado en todos los endpoints relevantes, o solo en el que se mostró en la demo?

Esta capa es la que atrapa un gap que ningún checklist precargado anticipó. Si encontrás algo acá que no encaja en ningún ítem de la Capa 1, repórtalo igual — no lo descartes por "no está en la lista".

## Cuándo agregar un antipatrón nuevo a la Capa 1

Nunca por un solo hallazgo. Seguí la misma disciplina que `foundry/skill-writing-patterns.md` (regla 1) de este catálogo ya aplica al resto de las skills:

- Un hallazgo único se reporta como hallazgo de ese proyecto puntual, no se generaliza al checklist fijo.
- Si el mismo tipo de gap aparece en un segundo proyecto real, con causa distinta al patrón que ya conocés, ahí es candidato a sumarse a la Capa 1 como ítem nuevo — con su propio "tell" (cómo reconocerlo, para diferenciarlo de otros gaps parecidos).
- Registrar la evidencia en `foundry/cases/` de este catálogo, si el usuario decide que vale la pena, es lo que respalda la promoción del checklist — no una impresión de que "esto pasa seguido".
