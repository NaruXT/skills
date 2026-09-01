# Reglas de fidelidad al código real

Estas reglas son específicas de `architecture-map` — no viven en
`skills/_shared/mermaid-validate/`, porque asumen que hay código real
detrás del diagrama. `design-diagrams` (diseño pre-código, sin repo) tiene
su propia regla equivalente de fidelidad a lo acordado en la conversación,
no a esta.

Para las reglas de **sintaxis** (frontmatter, `;`, `end`, `#`, backticks,
edge-spaghetti) ver
`~/.claude/skills/_shared/mermaid-validate/references/mermaid-syntax-rules.md`
— esas sí son compartidas, porque son hechos del parser, no de la fuente.
Excepción: la topología de infraestructura es D2, no Mermaid — su sintaxis
la valida directamente el compilador real (`d2-validate`, SKILL.md Paso 5b),
sin guía aparte. Las reglas de fidelidad de este archivo sí le aplican.

- Nombres de nodos/participantes/clases en el mismo casing que usa el código
  real (no inventes nombres bonitos si el código dice `OrderSvc`, usá
  `OrderSvc`).
- No agregues campos, métodos, o pasos que no viste en el código.
- `sequenceDiagram`: mostrá el camino de error relevante (ej. credenciales
  inválidas), no solo el happy path, si el código lo maneja explícitamente.
- `classDiagram`: solo relaciones que el código expresa (herencia real, campo
  que referencia otra clase, interfaz implementada) — no relaciones
  "conceptuales" inventadas.
- `erDiagram`: cardinalidad tal como está en la migración/modelo (`||--o{`,
  etc.), no una suposición.
- `stateDiagram-v2`: un estado por valor real del enum. Una transición por
  cada función/rama de código que efectivamente cambia el estado — no
  inventes transiciones "lógicas" que el código no implementa.
- Topología de infraestructura (D2): un nodo por recurso declarado en IaC o
  config de despliegue real (un `resource` de Terraform, un `service` de
  `docker-compose.yml`, un binding de `wrangler.toml`, un `Deployment`/
  `Service` de k8s) — no inventes recursos "típicos" que no estén en el
  archivo (una CDN, un WAF, una réplica de lectura) solo porque suelen
  acompañar ese tipo de arquitectura. No inventes regiones, zonas de
  disponibilidad, ni tiers de instancia que no estén especificados en la
  fuente. Si la config es informal (un `Dockerfile` suelto, variables de
  entorno) en vez de IaC declarativo, marcá en `## Notes` qué relaciones son
  inferidas y de qué evidencia salen — no las trates con la misma certeza
  que un recurso declarado explícitamente.
