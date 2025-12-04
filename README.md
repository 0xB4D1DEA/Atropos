# Atropos

Image tile splitter - cut images into uniform grids.

Named after the Greek Fate who cuts the thread of life.

Perfect for game development, sprite sheets, and tilesets.

## Features

- Split any image into uniform tile grids
- Automatically skip fully transparent tiles
- Support for any tile size (8x8, 16x16, 32x32, 64x64, etc.)
- JSON output for scripting
- Cross-platform (Linux, macOS, Windows)

## Installation

### Option 1: Download Binary (Easiest)

Download the pre-built binary for your platform from [Releases](https://github.com/0xB4D1DEA/atropos/releases):

- `atropos-linux` - Linux x64
- `atropos-macos` - macOS Intel
- `atropos-macos-arm` - macOS Apple Silicon
- `atropos-windows.exe` - Windows x64

Then make it executable and move to your PATH:

```bash
# Linux/macOS
chmod +x atropos-linux
sudo mv atropos-linux /usr/local/bin/atropos

# Windows - move atropos-windows.exe to a folder in your PATH
```

### Option 2: Install via Bun

If you have [Bun](https://bun.sh) installed:

```bash
# Clone and install globally
git clone https://github.com/0xB4D1DEA/atropos.git
cd atropos
bun install
bun link
```

### Option 3: One-Line Install Script

```bash
curl -fsSL https://raw.githubusercontent.com/jkuskos/atropos/main/install.sh | bash
```

## Requirements

**Python 3 with Pillow** is required for image processing:

```bash
# Ubuntu/Debian
sudo apt install python3-pil

# macOS
pip3 install Pillow

# Windows
pip install Pillow
```

## Usage

```bash
atropos <input-image> [options]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-s, --size <n>` | Tile size in pixels | 32 |
| `-o, --output <dir>` | Output directory | `<input>_tiles/` |
| `-p, --prefix <str>` | Filename prefix | tile |
| `--skip-empty` | Skip transparent tiles | (default) |
| `--keep-empty` | Keep transparent tiles | |
| `-q, --quiet` | Suppress output | |
| `--json` | Output as JSON | |
| `-v, --version` | Show version | |
| `-h, --help` | Show help | |

### Examples

```bash
# Split into 32x32 tiles (default)
atropos spritesheet.png

# Split into 16x16 tiles
atropos tileset.png --size 16

# Custom output directory and prefix
atropos game-assets.png -s 64 -o ./sprites -p player

# Keep empty/transparent tiles
atropos tilemap.png --keep-empty

# JSON output for scripting
atropos sheet.png --json > tiles.json
```

### Output

Tiles are named by their grid position:
- `tile_r00_c00.png` - Row 0, Column 0 (top-left)
- `tile_r00_c01.png` - Row 0, Column 1
- `tile_r01_c00.png` - Row 1, Column 0
- etc.

## Building from Source

```bash
git clone https://github.com/0xB4D1DEA/atropos.git
cd atropos
bun install

# Build for current platform
bun run build

# Build for specific platform
bun run build:linux
bun run build:mac
bun run build:mac-arm
bun run build:windows
```

## License

MIT
