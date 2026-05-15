#!/usr/bin/env bash
#
# deploy.sh — Pull latest from git and rebuild the site if anything changed.
#
# Cron setup (run as the user who owns /var/www/cesmii):
#   crontab -e
#   */10 * * * * /var/www/cesmii/deploy.sh >> /var/log/cesmii-deploy.log 2>&1
#
# First-time setup on the server:
#   chmod +x /var/www/cesmii/deploy.sh
#   # Create the log file and give ownership to the deploy user:
#   sudo touch /var/log/cesmii-deploy.log
#   sudo chown $USER:$USER /var/log/cesmii-deploy.log

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAMP="[$(date '+%Y-%m-%d %H:%M:%S')]"

cd "$DIR"

# Prevent overlapping runs if a build takes longer than the cron interval.
# Note: if the process is killed (SIGKILL), remove /tmp/cesmii-deploy.lock manually.
LOCK="/tmp/cesmii-deploy.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
    echo "$STAMP Skipping — previous run still in progress."
    exit 0
fi
trap "rmdir '$LOCK'" EXIT

# Record HEAD before pull so we can detect what changed.
BEFORE=$(git rev-parse HEAD)

git pull --quiet

AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" = "$AFTER" ] && [ -d "$DIR/out" ]; then
    echo "$STAMP Already up to date."
    exit 0
fi

if [ "$BEFORE" = "$AFTER" ]; then
    echo "$STAMP No new commits, but out/ is missing — building."
else
    echo "$STAMP Changes pulled (${BEFORE:0:7} → ${AFTER:0:7})."
fi

# Install dependencies if node_modules is missing or package-lock.json changed.
if [ ! -d "$DIR/node_modules" ] || git diff --name-only "$BEFORE" "$AFTER" | grep -q 'package-lock\.json'; then
    echo "$STAMP Running npm install..."
    npm install --quiet
fi

# Locate node: check PATH first, then common nvm install location.
NODE=$(command -v node 2>/dev/null || true)
if [ -z "$NODE" ] && [ -d "$HOME/.nvm/versions/node" ]; then
    NODE=$(ls -v "$HOME/.nvm/versions/node/"*/bin/node 2>/dev/null | tail -1 || true)
fi
if [ -z "$NODE" ]; then
    echo "$STAMP ERROR: node not found. Ensure node is on PATH for the cron user."
    exit 1
fi

echo "$STAMP Clearing proxy cache..."
rm -f /tmp/cesmii_*.html /tmp/cesmii_*_title.txt

echo "$STAMP Building..."
"$NODE" build.js
echo "$STAMP Deploy complete."
