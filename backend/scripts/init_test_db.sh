#!/usr/bin/env sh
# Initialize the test database using backend/sql/init.sql
# Usage: PGHOST=localhost PGPORT=5432 PGUSER=postgres PGPASSWORD=test PGDATABASE=velo_platform_test ./backend/scripts/init_test_db.sh

: "Using defaults if env vars not provided"
PGHOST=${PGHOST:-localhost}
PGPORT=${PGPORT:-5432}
PGUSER=${PGUSER:-postgres}
PGPASSWORD=${PGPASSWORD:-test}
PGDATABASE=${PGDATABASE:-velo_platform_test}

export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

if ! command -v psql >/dev/null 2>&1; then
  echo "psql client is required but not found. Install 'postgresql-client' or run inside a container with psql."
  exit 2
fi

echo "Initializing test DB ${PGDATABASE} on ${PGHOST}:${PGPORT} as ${PGUSER}"
psql --set ON_ERROR_STOP=1 -v ON_ERROR_STOP=1 -q -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -d "$PGDATABASE" -f backend/sql/init.sql
RC=$?
if [ $RC -ne 0 ]; then
  echo "Failed to initialize DB (psql exit $RC)"
  exit $RC
fi

echo "DB initialized successfully"
exit 0
