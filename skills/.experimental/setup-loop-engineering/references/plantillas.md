# Plantillas de setup-loop-engineering

Plantillas que cita `SKILL.md`: `HANDOFF.md`, `forbidden-paths.txt`, `verify.sh`, `PROGRESS.md`, y la config de hooks de compactación.
Copialas y completá los placeholders entre `<>` con lo que se acordó en el Paso 2 - nunca las dejes con el placeholder sin completar.

## `.loop/HANDOFF.md`

```markdown
# HANDOFF - Estado del loop

## Objetivo
<una frase concreta y verificable de qué significa "hecho" - ver el litmus
 test de references/protocolo-verificacion.md §1>

## Guardarraíles numéricos
- Máximo por iteración: <N> archivos / <N> líneas
- Máximo de intentos por ítem: <N>
- Pausa obligatoria cada <N> iteraciones o tras <N> ROJOS consecutivos en el mismo ítem
- Tope de gasto: <N llamadas o T segundos> - al toparlo, cerrar con PROGRESS.md como traspaso, no reintentar

## Guardarraíles de irreversibilidad
- Acciones que requieren bloqueo duro (no solo instrucción): <lista - ver
  references/protocolo-verificacion.md §6>

## Paths
- Permitidos: <lista>
- Prohibidos: ver `.loop/forbidden-paths.txt` - cualquier match ahí es ROJO automático, no es juicio del Grader

## Baseline
Commit de referencia: `<contenido de .loop/baseline-commit.txt>`

## Estado
<< cada iteración reescribe esta sección antes de terminar, con lo mínimo
   necesario para que la próxima iteración retome sin el contexto actual:
   qué se hizo, qué falta, y cualquier decisión tomada que no sea obvia
   desde el diff >>

## Bloqueadas
<< ítems que llegaron al tope de intentos o de ROJOS consecutivos:
   ítem, causa concreta, qué se intentó >>

## Protocolo Maker/Grader
1. Maker: implementa el próximo ítem de PROGRESS.md → Next, corre `.loop/verify.sh`.
2. Grader (subagente SEPARADO del Maker, nunca el mismo contexto - ver
   references/protocolo-verificacion.md §2): si verify.sh da verde, mira en
   frío el diff contra este Objetivo y estos Guardarraíles
   (`git diff $(cat .loop/baseline-commit.txt)..HEAD --stat`, y cruzá los
   paths tocados contra `.loop/forbidden-paths.txt`). Para criterios
   subjetivos o de UI, abrí y mirá la evidencia real (screenshot en
   `.loop/visual/`), nunca asumas del exit code solo.
   Si algo no cumple, revertí y anotá el motivo en PROGRESS.md - nunca lo
   dejes pasar solo porque verify.sh dio verde.
```

## `.loop/forbidden-paths.txt`

Un path/glob por línea. Vacío a propósito si no hay ninguno, pero si el usuario nombró un no-goal explícito en el Paso 2 (ej. "no toques backend/"), tiene que estar acá, no solo en la conversación.

```
# ejemplo
backend/**
.github/workflows/**
CHANGELOG.md
```

## `.loop/verify.sh`

Esqueleto, no un script genérico listo para usar - reemplazá los tres comandos por los reales del proyecto (Paso 1 de `SKILL.md`) antes de darlo por terminado.

```bash
#!/usr/bin/env bash
set -euo pipefail

LOG_DIR=".loop/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/verify-$(date +%Y%m%d-%H%M%S).log"

run_step() {
  local name="$1"; shift
  echo "== $name ==" | tee -a "$LOG_FILE"
  if ! "$@" >>"$LOG_FILE" 2>&1; then
    echo "FALLÓ: $name (ver $LOG_FILE)" >&2
    exit 1
  fi
}

run_step "lint"  <comando real de lint>
run_step "build" <comando real de build>
run_step "test"  <comando real de test>

echo "verify.sh: todo verde" | tee -a "$LOG_FILE"
```

## `PROGRESS.md`

```markdown
# PROGRESS - Control de iteraciones

## Done
- [x] Setup inicial del framework de loop engineering

## In progress
- Ninguna

## Next
- [ ] <primer ítem concreto a implementar>

## Blocked
- Ninguna

## Notes
- Sin bloqueos detectados.
```

## Hooks de compactación

Persisten `.loop/HANDOFF.md` de forma mecánica en vez de depender de que el modelo se acuerde de actualizarlo antes de compactar.
No edites `.claude/settings.json` a mano para esto - instalá los hooks con la skill `update-config`, pasándole esta configuración:

```json
{
  "hooks": {
    "PreCompact": [
      {
        "matcher": "auto",
        "hooks": [
          { "type": "command", "command": "cp .loop/HANDOFF.md .loop/handoff-backup.md 2>/dev/null; exit 0" }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          { "type": "command", "command": "cat .loop/handoff-backup.md 2>/dev/null || true" }
        ]
      }
    ]
  }
}
```

`PreCompact` corre antes de que la compactación empiece y respalda el `HANDOFF.md` actual.
`SessionStart` con matcher `compact` corre justo después de que la sesión se retoma compactada, y lo que su comando imprime a stdout se reinyecta al contexto de Claude automáticamente - por eso el segundo comando es un `cat` plano, no un paso silencioso.
