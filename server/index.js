#!/usr/bin/env node
'use strict';

/**
 * token-saver: servidor MCP mínimo (transporte stdio, JSON-RPC 2.0 delimitado por saltos de línea).
 * Solo módulos nativos de Node.js; sin dependencias externas.
 */

const fs = require('node:fs');
const path = require('node:path');

const SERVER_INFO = { name: 'token-saver', version: '1.0.0' };
const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const TOOLS = [
  {
    name: 'read_compact_file',
    description:
      'Lee un archivo de texto UTF-8 y devuelve su contenido sin líneas vacías ni líneas de comentario puro que empiecen por "//".',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta al archivo' },
      },
      required: ['path'],
    },
  },
  {
    name: 'minify_json',
    description: 'Lee un archivo JSON, lo valida y lo devuelve minificado.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta al archivo .json' },
      },
      required: ['path'],
    },
  },
];

function readTextFile(p) {
  if (typeof p !== 'string' || p.trim() === '') {
    throw new Error('El parámetro "path" es obligatorio y debe ser una cadena.');
  }
  const abs = path.resolve(process.cwd(), p);
  const stat = fs.statSync(abs);
  if (!stat.isFile()) throw new Error(`No es un archivo: ${abs}`);
  if (stat.size > MAX_FILE_BYTES) {
    throw new Error(`El archivo supera el límite de ${MAX_FILE_BYTES} bytes.`);
  }
  return fs.readFileSync(abs, 'utf8');
}

function readCompactFile(p) {
  const text = readTextFile(p);
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '' && !/^\s*\/\//.test(line))
    .join('\n');
}

function minifyJson(p) {
  let text = readTextFile(p);
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // quitar BOM
  return JSON.stringify(JSON.parse(text));
}

function callTool(name, args) {
  const a = args && typeof args === 'object' ? args : {};
  try {
    let text;
    if (name === 'read_compact_file') text = readCompactFile(a.path);
    else if (name === 'minify_json') text = minifyJson(a.path);
    else return { error: { code: -32602, message: `Herramienta desconocida: ${name}` } };
    return { result: { content: [{ type: 'text', text }] } };
  } catch (err) {
    // Errores de ejecución de la herramienta: se reportan dentro del resultado.
    return {
      result: {
        content: [{ type: 'text', text: `Error: ${err.message}` }],
        isError: true,
      },
    };
  }
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function handle(msg) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return;

  // Notificaciones (sin "id"): ignorar silenciosamente, sin respuesta.
  if (!Object.prototype.hasOwnProperty.call(msg, 'id') || msg.id === undefined) return;

  const { id, method, params } = msg;

  // Respuestas del cliente a peticiones del servidor (no las hacemos): ignorar.
  if (typeof method !== 'string') return;

  switch (method) {
    case 'initialize': {
      const requested = params && params.protocolVersion;
      const protocolVersion = SUPPORTED_VERSIONS.includes(requested)
        ? requested
        : SUPPORTED_VERSIONS[0];
      return send({
        jsonrpc: '2.0',
        id,
        result: { protocolVersion, capabilities: { tools: {} }, serverInfo: SERVER_INFO },
      });
    }
    case 'ping':
      return send({ jsonrpc: '2.0', id, result: {} });
    case 'tools/list':
      return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
    case 'tools/call': {
      const name = params && params.name;
      const out = callTool(name, params && params.arguments);
      return send({ jsonrpc: '2.0', id, ...out });
    }
    default:
      return send({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Método no encontrado: ${method}` },
      });
  }
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch (err) {
      process.stderr.write(`token-saver: JSON inválido recibido: ${err.message}\n`);
      continue;
    }
    handle(msg);
  }
});
process.stdin.on('end', () => process.exit(0));
