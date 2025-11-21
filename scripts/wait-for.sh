#!/usr/bin/env sh
# Simple wait-for script that polls a URL until it returns 200
# Usage: ./scripts/wait-for.sh http://frontend:3000/health 60

URL=${1:-http://frontend:3000/}
TIMEOUT=${2:-60}

echo "Waiting for $URL (timeout ${TIMEOUT}s)"
COUNT=0
while [ $COUNT -lt $TIMEOUT ]; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || true)
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ]; then
    echo "Service is up (HTTP $STATUS)"
    exit 0
  fi
  COUNT=$((COUNT+1))
  sleep 1
done

echo "Timed out waiting for $URL"
exit 1
