---
name: comprimir-prompt
description: Compacta prompts, logs extensos, JSON y texto redundante para reducir tokens conservando significado y estructura. Úsala cuando el usuario pida comprimir, resumir sin perder datos, limpiar o reducir el tamaño de un contenido.
---

# Comprimir prompt

Devuelve una versión optimizada del contenido recibido, con la menor cantidad posible de tokens, sin perder información crítica.

## Qué puede procesar

- Prompts e instrucciones.
- Logs extensos.
- JSON (y estructuras similares).
- Texto con redundancias o explicaciones innecesarias.

## Procedimiento

1. Identifica el tipo de contenido y qué información es crítica (valores, identificadores, errores, restricciones, pasos, nombres, cifras, fechas).
2. Aplica las reglas del tipo correspondiente.
3. Verifica que no se perdió información crítica ni se alteró el significado.
4. Devuelve solo el contenido comprimido, sin preámbulo. Añade como máximo una línea de nota si omitiste algo relevante.

## Reglas por tipo

### Prompts
- Elimina cortesías, muletillas y repeticiones.
- Sustituye frases largas por formas imperativas breves.
- Conserva restricciones, formato de salida esperado, ejemplos esenciales y orden de las instrucciones.
- Mantén la estructura (secciones, numeración) si aporta claridad.

### Logs
- Agrupa líneas repetidas: `línea (x N)`.
- Conserva errores, advertencias, stack traces relevantes, marcas de tiempo clave y códigos de salida.
- Elimina líneas informativas rutinarias que no aporten al problema.
- Indica brevemente cuántas líneas se omitieron.

### JSON
- Elimina espacios y saltos de línea innecesarios (minificar).
- No cambies claves, valores ni tipos.
- Si hay arrays largos y repetitivos, puedes resumir con un recuento y un ejemplo, indicándolo explícitamente.
- Si hay una herramienta `minify_json` disponible, úsala sobre archivos JSON en disco.

### Texto redundante
- Elimina frases que repitan ideas.
- Prefiere listas cortas a párrafos.
- Conserva datos, nombres, cifras y condiciones.

## Restricciones

- No inventes ni infieras datos ausentes.
- No elimines advertencias de seguridad ni condiciones de error.
- Si dudas sobre si algo es crítico, consérvalo.
- Si el usuario indica un formato o nivel de compresión, síguelo.
- Para archivos de código en disco, puedes usar la herramienta `read_compact_file`, sabiendo que elimina líneas vacías y comentarios puros que empiezan por `//`.
