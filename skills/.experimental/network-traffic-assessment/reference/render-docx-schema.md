# Esquema JSON para `scripts/render_docx.py`

El script recibe un único JSON con esta forma, siguiendo la estructura del Paso 3 de
`SKILL.md` (portada estilo Palo Alto, Scope, Recommendations priorizadas, categorías con
checks). No hace falta que todas las claves estén presentes — solo las que correspondan a lo
que realmente encontraste en el Backup XML/TSF.

```json
{
  "meta": {
    "report_title": "Health Check / Assessment de Firewall",
    "client": "Nombre del cliente (del formulario) — va en 'Prepared for'",
    "date": "2026-08-10",
    "prepared_by": "Nombre del analista (del formulario)",
    "version": "1.0",
    "disclaimer": "Texto breve de confidencialidad de SEK (opcional, no copies el legal de Palo Alto Networks)"
  },
  "scope": {
    "narrative": "Texto introductorio opcional.",
    "table": {
      "headers": ["Dispositivo", "Modelo", "Versión", "Virtual Systems"],
      "rows": [["FW-DEMO-01", "PA-440", "PAN-OS 11.1.10-h10", "Single-vsys"]]
    }
  },
  "recommendations": {
    "Crítico": [
      {"text": "Bypass este-oeste: 47 segmentos internos...", "sub_bullets": []}
    ],
    "Alto": ["No hay Trusted Hosts definidos para el acceso de gestión.", "..."],
    "Importante": ["..."],
    "Bajo": ["..."],
    "Otras Recomendaciones": ["..."]
  },
  "sections": [
    {
      "title": "FW-DEMO-01 › System Evaluation",
      "checks": [
        {
          "title": "Licensing",
          "device_observation": "FW-DEMO-01 — suscripciones activas: Threat Prevention, URL Filtering.",
          "findings": ["No se detectan suscripciones de Advanced WildFire ni DNS Security."],
          "recommendations": ["Evaluar la adquisición de Advanced WildFire y DNS Security."]
        },
        {
          "title": "Disk space",
          "device_observation": "FW-DEMO-01 — `show system disk-space`.",
          "data_table": {
            "headers": ["Filesystem", "Size", "Used", "Avail", "Use%", "Mounted on"],
            "rows": [["/dev/md2", "38G", "7.7G", "29G", "22%", "/"], ["/dev/md8", "73G", "633M", "68G", "1%", "/opt/panlogs"]]
          },
          "findings": ["Ninguno — todos los filesystems por debajo del umbral de atención."],
          "recommendations": ["Ninguna."]
        }
      ]
    },
    {
      "title": "FW-DEMO-01 › Best Practices Evaluation",
      "subsections": [
        {
          "title": "Network Evaluation",
          "diagram": {
            "model": "PA-440", "device": "FW-DEMO-01", "os_label": "PAN-OS", "os_version": "11.1.10-h10",
            "vpn_peers": [{"name": "GATEWAY-X", "peer": "203.0.113.10"}],
            "wan": [{"name": "ethernet1/1", "zone": "WAN.A", "ips": ["203.0.113.1/29"]}],
            "lan": [{"name": "ethernet1/3", "zone": "LAN.TRANSITO", "ips": ["172.19.93.97/29"], "is_core_transit": true}],
            "core": {"next_hop": "172.19.93.98", "segment_count": 47}
          },
          "checks": [
            {
              "title": "Bypass este-oeste",
              "device_observation": "FW-DEMO-01 — 47 segmentos con next-hop 172.19.93.98 por ethernet1/3.",
              "findings": ["El tráfico lateral entre las 47 subredes internas no pasa por el firewall."],
              "recommendations": ["Rediseñar la segmentación llevando las VLAN internas al firewall."]
            }
          ]
        },
        {
          "title": "Security Policies Evaluation",
          "checks": []
        }
      ]
    }
  ]
}
```

## Notas de uso

- `meta.report_title`/`disclaimer` son opcionales; si faltan, el script usa un título genérico
  y omite el bloque de Notices.
- `scope` es opcional pero recomendado — siempre que tengas el modelo/versión del dispositivo.
- `recommendations` es un dict con las 5 claves de severidad exactas: `Crítico`, `Alto`,
  `Importante`, `Bajo`, `Otras Recomendaciones` (mayúscula inicial, con tilde en "Crítico").
  Cada valor es una lista; cada item puede ser un string simple o
  `{"text": "...", "sub_bullets": ["..."]}` para agregar evidencia concreta como sub-bullets
  (ej. nombres de regla). Omite las claves de severidad sin items — no generes un encabezado
  "Bajo" vacío.
- `sections` es una lista ordenada; el orden en que aparecen es el orden en que se imprimen.
  `number` es opcional (si lo omites, el título se imprime sin prefijo numérico — la estructura
  de Palo Alto no numera sus categorías). Omite las secciones para las que no hay ningún dato
  relevante.
- `narrative` acepta un string o una lista de strings (un párrafo por elemento).
- `tables[].severity_col` es el índice (0-based) de una columna con severidad
  (`Crítico`/`Alto`/`Importante`/`Bajo`) para resaltarla en negrita con el color correspondiente
  — úsalo solo si tiene sentido para esa tabla puntual (la mayoría de las tablas del informe no
  lo necesitan, porque la severidad ya vive en el bloque `recommendations`).
- `diagram` va dentro de la subsección "Network Evaluation" (no en el nivel raíz de `sections`).
- `checks` es el bloque para el patrón Device/Findings/Recommendations/References. Cada
  elemento:
  - `title` (string, obligatorio): nombre del check.
  - `device_observation` (string, opcional): equipo(s) analizado(s) y el valor/estado observado.
  - `data_table` (objeto opcional `{"headers": [...], "rows": [[...], ...]}`): la tabla de datos
    completa para checks de "inventario" (Software process status, Disk space, Files Core Dump —
    ver SKILL.md "Datos completos, no solo el comando"). Va inmediatamente después de
    `device_observation`. Incluye **todas** las filas del comando, nunca una muestra parcial.
  - `findings` (lista de strings, opcional): hallazgos concretos con evidencia.
  - `recommendations` (lista de strings, opcional): recomendaciones (o "Ninguna").
  - `references` (lista de `{"label": "...", "url": "..."}`, opcional): **solo incluir si el
    enlace está verificado** — nunca un objeto con una URL inventada. Si no hay referencia
    confiable, omite la clave `references` por completo.
  - No generes un `check` completo para algo que ya está en buena práctica y no aporta nada
    que el cliente necesite leer.
- `subsections` anida un nivel más (ej. "Device Evaluation"/"Network Evaluation"/"Security
  Policies Evaluation"/"Security Profiles Evaluation" dentro de "Best Practices Evaluation");
  también acepta `checks`, `tables`, `narrative` y `diagram` con el mismo formato que a nivel
  de sección.
- Guarda el JSON intermedio como archivo temporal (ej. `/tmp/informe_<cliente>.json`) antes de
  invocar el script — no hace falta conservarlo después de generar el `.docx`.

## Comando de generación

```bash
python3 scripts/render_docx.py /ruta/al/informe.json "Informe_<Cliente>_<Dispositivo>_SEK.docx"
```

Requiere `python-docx` instalado (`pip install python-docx`); Pillow suele venir ya instalado
con Python, si no: `pip install Pillow`.
