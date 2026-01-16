#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <secret-value>"
  exit 1
fi

SECRET="$1"

echo "Setting MIGRATION_SECRET via wrangler..."
# Pipe the secret into wrangler secret put (interactive prompt)
echo -n "$SECRET" | npx wrangler secret put MIGRATION_SECRET

echo "Done."
