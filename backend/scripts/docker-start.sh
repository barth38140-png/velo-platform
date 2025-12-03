#!/bin/sh
# Wait for DB then start the app (used by container startup)
echo "[docker-start] waiting for DB..."
node ./scripts/wait-for-db.js
rc=$?
if [ "$rc" -ne 0 ]; then
  echo "[docker-start] wait-for-db failed with code $rc — exiting"
  exit $rc
fi
echo "[docker-start] starting server"
exec npm start
