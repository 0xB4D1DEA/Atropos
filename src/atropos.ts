#!/usr/bin/env bun
/**
 * Atropos - Image Tile Splitter
 * Named after the Greek Fate who cuts the thread of life
 *
 * Splits images into uniform tile grids, perfect for game assets and sprite sheets.
 */

import { parseArgs } from "util";
import { mkdir } from "fs/promises";
import { basename, dirname, join } from "path";
import { existsSync } from "fs";

const VERSION = "1.0.0";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    size: { type: "string", short: "s", default: "32" },
    output: { type: "string", short: "o" },
    "skip-empty": { type: "boolean", default: true },
    "keep-empty": { type: "boolean", default: false },
    prefix: { type: "string", short: "p", default: "tile" },
    help: { type: "boolean", short: "h" },
    version: { type: "boolean", short: "v" },
    json: { type: "boolean" },
    quiet: { type: "boolean", short: "q" },
  },
  allowPositionals: true,
});

if (values.version) {
  console.log(`atropos v${VERSION}`);
  process.exit(0);
}

if (values.help || positionals.length === 0) {
  console.log(`
Atropos v${VERSION} - Image Tile Splitter
Named after the Greek Fate who cuts the thread of life

Usage:
  atropos <input-image> [options]

Options:
  -s, --size <n>      Tile size in pixels (default: 32)
  -o, --output <dir>  Output directory (default: <input>_tiles/)
  -p, --prefix <str>  Filename prefix (default: tile)
  --skip-empty        Skip fully transparent tiles (default)
  --keep-empty        Keep fully transparent tiles
  -q, --quiet         Suppress output except errors
  --json              Output results as JSON
  -v, --version       Show version
  -h, --help          Show this help

Examples:
  atropos sprite.png
  atropos tileset.png --size 16 --output ./my-tiles
  atropos game.png -s 64 -p sprite --keep-empty
`);
  process.exit(0);
}

const inputPath = positionals[0];
const tileSize = parseInt(values.size as string);
const skipEmpty = values["keep-empty"] ? false : (values["skip-empty"] as boolean);
const prefix = values.prefix as string;
const jsonOutput = values.json as boolean;
const quiet = values.quiet as boolean;

// Resolve input path
const resolvedInput = inputPath.startsWith("/") || inputPath.match(/^[A-Za-z]:/)
  ? inputPath
  : join(process.cwd(), inputPath);

if (!existsSync(resolvedInput)) {
  console.error(`Error: File not found: ${resolvedInput}`);
  process.exit(1);
}

// Validate tile size
if (isNaN(tileSize) || tileSize < 1 || tileSize > 4096) {
  console.error(`Error: Invalid tile size: ${values.size}. Must be 1-4096.`);
  process.exit(1);
}

// Default output directory
const inputBasename = basename(resolvedInput).replace(/\.[^.]+$/, "").replace(/\s+/g, "_");
const outputDir = values.output
  ? (values.output.startsWith("/") || (values.output as string).match(/^[A-Za-z]:/)
    ? values.output
    : join(process.cwd(), values.output as string))
  : join(dirname(resolvedInput), `${inputBasename}_tiles`);

await mkdir(outputDir, { recursive: true });

interface Result {
  input: string;
  outputDir: string;
  tileSize: number;
  dimensions: { width: number; height: number };
  grid: { columns: number; rows: number };
  tilesSaved: number;
  tilesSkipped: number;
  files: string[];
}

async function splitImage(): Promise<Result> {
  const script = `
import sys
import json
from PIL import Image
import os

input_path = sys.argv[1]
output_dir = sys.argv[2]
tile_size = int(sys.argv[3])
skip_empty = sys.argv[4] == "true"
prefix = sys.argv[5]

img = Image.open(input_path).convert("RGBA")
width, height = img.size

columns = width // tile_size
rows = height // tile_size

if columns == 0 or rows == 0:
    print(json.dumps({"error": f"Image {width}x{height} is smaller than tile size {tile_size}x{tile_size}"}))
    sys.exit(1)

files = []
saved = 0
skipped = 0

for row in range(rows):
    for col in range(columns):
        left = col * tile_size
        top = row * tile_size
        right = left + tile_size
        bottom = top + tile_size

        tile = img.crop((left, top, right, bottom))

        if skip_empty:
            alpha = tile.split()[3]
            if alpha.getextrema() == (0, 0):
                skipped += 1
                continue

        filename = f"{prefix}_r{row:02d}_c{col:02d}.png"
        filepath = os.path.join(output_dir, filename)
        tile.save(filepath, "PNG")
        files.append(filename)
        saved += 1

result = {
    "input": input_path,
    "outputDir": output_dir,
    "tileSize": tile_size,
    "dimensions": {"width": width, "height": height},
    "grid": {"columns": columns, "rows": rows},
    "tilesSaved": saved,
    "tilesSkipped": skipped,
    "files": files
}

print(json.dumps(result))
`;

  const proc = Bun.spawn(
    ["python3", "-c", script, resolvedInput, outputDir, tileSize.toString(), skipEmpty.toString(), prefix],
    {
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  const output = await new Response(proc.stdout).text();
  const error = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0 || error) {
    // Check if Python/Pillow is available
    if (error.includes("No module named") || error.includes("PIL")) {
      console.error("Error: Python Pillow library required. Install with:");
      console.error("  pip install Pillow");
      process.exit(1);
    }
    if (error.includes("python3: not found") || error.includes("python3")) {
      console.error("Error: Python 3 required. Install from https://python.org");
      process.exit(1);
    }
    console.error("Error:", error || output);
    process.exit(1);
  }

  const result = JSON.parse(output.trim());
  if (result.error) {
    console.error("Error:", result.error);
    process.exit(1);
  }

  return result;
}

// Run the split
const result = await splitImage();

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2));
} else if (!quiet) {
  console.log(`
Atropos - Split Complete

Input:      ${result.input}
Output:     ${result.outputDir}
Tile size:  ${result.tileSize}x${result.tileSize}
Image:      ${result.dimensions.width}x${result.dimensions.height}
Grid:       ${result.grid.columns} cols x ${result.grid.rows} rows

Tiles saved:   ${result.tilesSaved}
Tiles skipped: ${result.tilesSkipped} (transparent)
`);
}

process.exit(0);
