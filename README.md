# token-saver

Plugin para Claude que ayuda a reducir el consumo de tokens de entrada y salida mediante:

- **Skills** de ahorro de tokens y compresión de contexto.
- **Herramientas MCP** para leer archivos de forma compacta y minificar JSON.

Sin dependencias externas: el servidor MCP usa únicamente módulos nativos de Node.js. Requiere Node.js instalado (no hay `npm install`).

## Estructura

```
token-saver/
├── README.md
├── LICENSE
├── .mcp.json
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── server/
│   └── index.js
└── skills/
    ├── ahorrar-tokens/SKILL.md
    └── comprimir-prompt/SKILL.md
```

## Contenido

### Skills

| Skill | Propósito |
|---|---|
| `ahorrar-tokens` | Pautas para respuestas breves y directas: sin saludos, sin conclusiones redundantes, preferir diffs y listas cortas. Se aplican cuando no entran en conflicto con instrucciones de mayor prioridad del usuario o del sistema. |
| `comprimir-prompt` | Compacta prompts, logs, JSON y texto redundante conservando significado y estructura. |

### Herramientas MCP (`server/index.js`)

| Herramienta | Parámetros | Comportamiento |
|---|---|---|
| `read_compact_file` | `{ "path": "ruta/al/archivo" }` | Lee el archivo en UTF-8, elimina líneas vacías y líneas que empiezan por `//` (comentario puro). No toca `//` dentro de cadenas, por lo que las URL (`https://`) se conservan. |
| `minify_json` | `{ "path": "ruta/al/archivo.json" }` | Valida con `JSON.parse()` y devuelve `JSON.stringify(obj)`. |

Notas y límites:

- Las rutas relativas se resuelven desde el directorio de trabajo del proceso.
- Se rechazan archivos de más de 10 MB.
- `read_compact_file` solo elimina comentarios `//` a línea completa. No procesa comentarios de bloque (`/* */`), `#` ni comentarios al final de línea. En formatos donde una línea que empieza por `//` es contenido válido, se perderá esa línea.
- Los errores de las herramientas (archivo inexistente, JSON inválido) se devuelven con `isError: true`.

## Instalación

<!--
  COMPATIBILIDAD: Los comandos de plugins y marketplaces dependen de la versión
  y del cliente de Claude (p. ej. Claude Code). Verifica la sintaxis en la
  documentación oficial de tu versión. Los comandos de abajo son orientativos.
-->

`.claude-plugin/marketplace.json` declara este repositorio como un marketplace que contiene un único plugin (`"source": "./"`, ya que la raíz del repositorio es el propio plugin). **Esto no garantiza la instalación automática desde GitHub**: la compatibilidad depende de la versión y del cliente de Claude que utilices.

Ejemplo orientativo en un cliente que soporte plugins y marketplaces (como Claude Code):

```
/plugin marketplace add sebastianveras-netizen/token-saver
/plugin install token-saver@token-saver
```

Si tu cliente no soporta marketplaces, puedes usar las piezas por separado:

- **Skills:** copia las carpetas de `skills/` al directorio de skills que admita tu cliente.
- **Servidor MCP:** registra manualmente un servidor `stdio` con `node /ruta/absoluta/token-saver/server/index.js`.

<!--
  DEPENDENCIA DE VERSIÓN: `${CLAUDE_PLUGIN_ROOT}` en `.mcp.json` y el descubrimiento
  automático de `skills/` y `.mcp.json` por convención de directorios dependen de
  que tu cliente soporte plugins. No son características universales.
-->

`.mcp.json` usa `${CLAUDE_PLUGIN_ROOT}` para que la ruta del servidor funcione cuando el plugin se instala en caché. Fuera del sistema de plugins, esa variable no se expande: usa una ruta absoluta.

## Probar el servidor localmente

```bash
printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"0"}}}' \
 '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"minify_json","arguments":{"path":".claude-plugin/plugin.json"}}}' \
 | node server/index.js
```

Debes recibir exactamente tres respuestas (ids 1, 2 y 3); la notificación no genera ninguna.

## Protocolo

- JSON-RPC 2.0, un mensaje por línea en `stdin`/`stdout`.
- Implementa `initialize`, `tools/list`, `tools/call` y `ping`.
- Cualquier mensaje sin campo `id` (por ejemplo `notifications/initialized`) se ignora sin respuesta.
- `initialize` devuelve la versión del protocolo solicitada si es una de `2025-06-18`, `2025-03-26` o `2024-11-05`; si no, `2025-06-18`.
- Los diagnósticos se escriben en `stderr`, nunca en `stdout`.

## Licencia

Distribuido bajo la licencia [MIT](LICENSE).
