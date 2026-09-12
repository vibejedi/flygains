#!/bin/sh
# Pinned public FlyBody asset checkout. Retains its Apache-2.0 license.
set -eu
DEST="${1:-data/flybody}"
if [ -e "$DEST" ]; then
  echo "Destination already exists; verify it manually: $DEST" >&2
  exit 1
fi
git clone https://github.com/TuragaLab/flybody.git "$DEST"
git -C "$DEST" checkout --detach d015e9bfe441bd90ae431bac24c55cb74bdbce26
