# network-traffic-assessment — Health Check de firewall Palo Alto para cliente SEK

- Skill: `network-traffic-assessment`
- Fecha: sin registrar (anterior a este sistema — ver limitación abajo)
- Proyecto/contexto: entrega a cliente vía SEK

## Qué se hizo

A partir de un Backup XML de configuración y un Tech Support File (TSF) reales de un firewall Palo Alto Networks, se generó un informe de Health Check / Assessment siguiendo la estructura de un reporte oficial de Palo Alto (categorías por tipo de evaluación, cada check como bloque Device/Findings/Recommendations/References, recomendaciones priorizadas por severidad).

## Resultado

Un informe entregable a cliente, con hallazgos de arquitectura y segmentación de red (bypass este-oeste, enrutamiento, VPN), adopción de funcionalidades de seguridad, y buenas prácticas de configuración — todo trazable a datos concretos de los dos inputs, sin contenido inventado (regla de oro de la skill).

## Evidencia recuperable

`skills/.experimental/network-traffic-assessment/reference/example-report-anonymized.md` es un ejemplo anonimizado del reporte real generado con este método.

## Limitación de este caso

Este caso se escribió retroactivamente en la Ronda 001, al migrar la skill a este catálogo — no se registró en el momento en que pasó, así que no hay fecha exacta ni el Backup XML/TSF originales (son del cliente, no se conservan acá por confidencialidad). Cuenta como evidencia de que el método se aplicó sobre un caso real y produjo un entregable real, pero es más débil que un caso registrado en el momento con todos los artefactos a mano — ver `foundry/governance.md`, "Dimensiones de estado independientes".
