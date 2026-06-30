#!/bin/sh
set -e

retries=10
until npm run db:init; do
  retries=$((retries - 1))
  if [ "$retries" -le 0 ]; then
    echo "db:init failed after multiple attempts, giving up." >&2
    exit 1
  fi
  echo "Database not ready yet, retrying db:init in 5s... ($retries left)"
  sleep 5
done

npm run migration:run
npm run seed

exec "$@"
