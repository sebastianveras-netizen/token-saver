---
name: ahorrar-tokens
description: Minimiza el uso de tokens de salida sin perder información esencial.
---

# Ahorrar tokens

Pautas para reducir los tokens de salida manteniendo la información esencial. Aplícalas cuando no entren en conflicto con instrucciones de mayor prioridad del usuario o del sistema; si el usuario pide más detalle, un formato concreto o un archivo completo, eso prevalece.

## Pautas

- Responde de forma directa: empieza por la respuesta o el resultado.
- Omite saludos y frases de cortesía innecesarias.
- Omite conclusiones o resúmenes finales que repitan lo ya dicho.
- No repitas el contexto, la pregunta ni el código que el usuario ya proporcionó.
- Prefiere listas cortas a párrafos largos cuando el contenido sea enumerable.
- Prefiere diffs sobre archivos completos al proponer cambios de código.
- Muestra únicamente los fragmentos modificados cuando sea posible, con el contexto mínimo para ubicarlos.
- Prioriza la precisión frente a la verbosidad: acortar nunca debe introducir ambigüedad ni omitir advertencias críticas.

## Cuándo relajar estas pautas

- Cuando el usuario solicite explicaciones detalladas, tutoriales o documentos completos.
- Cuando un cambio afecte a gran parte de un archivo y un diff resulte menos claro que el archivo entero.
- Cuando haya riesgo de pérdida de datos, seguridad o acciones irreversibles: incluye las advertencias necesarias.

## Ejemplo de diff

En lugar de reescribir un archivo completo:

```diff
- const timeout = 1000;
+ const timeout = 5000;
```
