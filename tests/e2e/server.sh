#!/usr/bin/env bash
# Fresh database per e2e run, seeded so screenshots look real.
set -euo pipefail
cd "$(dirname "$0")/../.."
rm -rf .e2e-data
DATA_DIR=.e2e-data npx tsx scripts/seed.ts
exec env DATA_DIR=.e2e-data npx next start -p 3100
