#!/usr/bin/env node
// Renders one D2 source file to an SVG file using the real D2 compiler +
// layout engine (compile() + render() from @d2lang/d2). Run this only after
// validate.mjs already confirmed the source compiles - this script assumes
// valid input and will surface a raw compiler error otherwise.
// Usage: node render.mjs <input.d2> <output.svg>
// Exit code 0 on success (writes <output.svg>). Exit code 1 + the error on
// stderr on failure.
import { readFileSync, writeFileSync } from 'node:fs';
import { D2 } from '@d2lang/d2';

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Usage: node render.mjs <input.d2> <output.svg>');
  process.exit(1);
}

const source = readFileSync(inputPath, 'utf-8');
const d2 = new D2();

try {
  const result = await d2.compile(source);
  const svg = await d2.render(result.diagram, result.renderOptions);
  writeFileSync(outputPath, svg);
  console.log(`OK: wrote ${outputPath}`);
  process.exit(0);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
