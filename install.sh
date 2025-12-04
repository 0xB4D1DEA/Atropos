#!/bin/bash
# Atropos Installer
# Installs the atropos image tile splitter

set -e

REPO="0xB4D1DEA/atropos"
INSTALL_DIR="/usr/local/bin"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  linux)
    BINARY="atropos-linux"
    ;;
  darwin)
    if [ "$ARCH" = "arm64" ]; then
      BINARY="atropos-macos-arm"
    else
      BINARY="atropos-macos"
    fi
    ;;
  *)
    echo "Unsupported OS: $OS"
    echo "Please download manually from https://github.com/$REPO/releases"
    exit 1
    ;;
esac

echo "Atropos Installer"
echo "================="
echo ""
echo "Detected: $OS ($ARCH)"
echo "Binary: $BINARY"
echo ""

# Get latest release URL
RELEASE_URL="https://github.com/$REPO/releases/latest/download/$BINARY"

echo "Downloading from $RELEASE_URL..."
curl -fsSL "$RELEASE_URL" -o /tmp/atropos

echo "Installing to $INSTALL_DIR/atropos..."
chmod +x /tmp/atropos

if [ -w "$INSTALL_DIR" ]; then
  mv /tmp/atropos "$INSTALL_DIR/atropos"
else
  sudo mv /tmp/atropos "$INSTALL_DIR/atropos"
fi

echo ""
echo "Checking Python/Pillow dependency..."
if command -v python3 &> /dev/null; then
  if python3 -c "import PIL" 2>/dev/null; then
    echo "  Python + Pillow: OK"
  else
    echo "  Pillow not found. Install with: pip3 install Pillow"
  fi
else
  echo "  Python 3 not found. Please install Python 3 and Pillow."
fi

echo ""
echo "Installation complete!"
echo "Run 'atropos --help' to get started."
