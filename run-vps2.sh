#!/usr/bin/env bash
# VPS2 Runner — Deploys and runs E2E tests from Dallas TX IP
# Usage: ./run-vps2.sh
# Prereqs: SSH key for c03rad0r@23.182.128.51 must be authorized

set -euo pipefail

VPS2_HOST="c03rad0r@23.182.128.51"
VPS2_DIR="nostr-e2e"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Plebeian Market E2E Test Runner (VPS2) ==="
echo ""

# Step 1: Deploy test files to VPS2
echo "[1/5] Deploying test files to VPS2..."
rsync -avz --exclude='node_modules' --exclude='reports' --exclude='videos' --exclude='screenshots' \
  "${SCRIPT_DIR}/" "${VPS2_HOST}:~/${VPS2_DIR}/"
echo "Deployed."

# Step 2: Install dependencies on VPS2
echo ""
echo "[2/5] Installing dependencies on VPS2..."
ssh "${VPS2_HOST}" "cd ~/${VPS2_DIR} && \
  npm install --production=false 2>&1 | tail -5 && \
  npx playwright install chromium 2>&1 | tail -3"
echo "Dependencies installed."

# Step 3: Create output directories
echo ""
echo "[3/5] Creating output directories..."
ssh "${VPS2_HOST}" "cd ~/${VPS2_DIR} && mkdir -p screenshots videos reports"

# Step 4: Run tests
echo ""
echo "[4/5] Running E2E tests against plebeian.market..."
ssh "${VPS2_HOST}" "cd ~/${VPS2_DIR} && \
  export PLEBEIAN_URL='https://plebeian.market' && \
  npx playwright test --reporter=json,list 2>&1 | tee reports/test-output.log; \
  echo \"EXIT_CODE: \$?\"" || true
echo "Tests complete."

# Step 5: Retrieve results
echo ""
echo "[5/5] Retrieving test artifacts (screenshots, videos, reports)..."
mkdir -p "${SCRIPT_DIR}/vps2-results"
scp -r "${VPS2_HOST}:~/${VPS2_DIR}/screenshots/" "${SCRIPT_DIR}/vps2-results/" 2>/dev/null || true
scp -r "${VPS2_HOST}:~/${VPS2_DIR}/videos/" "${SCRIPT_DIR}/vps2-results/" 2>/dev/null || true
scp -r "${VPS2_HOST}:~/${VPS2_DIR}/reports/" "${SCRIPT_DIR}/vps2-results/" 2>/dev/null || true

echo ""
echo "=== Results retrieved ==="
echo "Screenshots: $(ls "${SCRIPT_DIR}/vps2-results/screenshots/" 2>/dev/null | wc -l)"
echo "Videos: $(ls "${SCRIPT_DIR}/vps2-results/videos/" 2>/dev/null | wc -l)"
echo "Reports: ${SCRIPT_DIR}/vps2-results/reports/"
echo ""
echo "View HTML report: open ${SCRIPT_DIR}/vps2-results/reports/html/index.html"
