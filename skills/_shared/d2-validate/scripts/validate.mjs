#!/usr/bin/env node
// Validates one D2 source file against the real D2 compiler (compile() from
// the official @d2lang/d2 WASM build - the same engine the CLI uses). This
// is the parse step only: no layout, no SVG, so it's cheap to run on every
// correction round. render.mjs does the actual rendering once this passes.
// Usage: node validate.mjs <input.d2>
// Exit code 0 + "OK" on stdout if valid. Exit code 1 + the compiler's error
// message(s) on stderr if invalid.
import { readFileSync } from 'node:fs';
import { D2 } from '@d2lang/d2';

const [, , inputPath] = process.argv;

if (!inputPath) {
  console.error('Usage: node validate.mjs <input.d2>');
  process.exit(1);
}

const source = readFileSync(inputPath, 'utf-8');
const d2 = new D2();

try {
  await d2.compile(source);
  console.log('OK');
  process.exit(0);
} catch (e) {
  console.error(formatD2Errors(e.message));
  process.exit(1);
}

// compile() rejects with an Error whose .message is a JSON array of
// {range, errmsg} objects, one per parse error found - format each as a
// plain "range: message" line instead of dumping the raw JSON.
function formatD2Errors(rawMessage) {
  try {
    const errors = JSON.parse(rawMessage);
    return errors.map((err) => `${err.range}: ${err.errmsg}`).join('\n');
  } catch {
    return rawMessage;
  }
}
