#!/usr/bin/env bash
# Local smoke test — runs from local machine (for quick validation only)
# For production tests, use run-vps2.sh instead (runs from Dallas TX IP)
set -euo pipefail

CHROME_PATH="${PLAYWRIGHT_CHROMIUM:-$HOME/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome}"
SCREENSHOTS_DIR="$(dirname "$0")/screenshots"
mkdir -p "$SCREENSHOTS_DIR"

echo "=== Local Smoke Test (T470) ==="
echo "NOTE: For production, run from VPS2 via run-vps2.sh"
echo "Chrome: $CHROME_PATH"
echo ""

cd "$(dirname "$0")"

node -e "
const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({
    executablePath: '$CHROME_PATH',
    args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'],
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Inject Nostr auth
  await page.addInitScript(() => {
    localStorage.setItem('nostr_local_signer_key', 'e4d2bff3011b848753765d51c3d43fe030ff5d72cccca7e6f431f507b9c83032');
    localStorage.setItem('nostr_auto_login', 'true');
    localStorage.setItem('plebeian_terms_accepted', 'true');
  });

  console.log('[TC1] Loading homepage...');
  await page.goto('https://plebeian.market', { timeout: 20000, waitUntil: 'domcontentloaded' });
  const title = await page.title();
  console.log('  Title:', title);
  await page.screenshot({ path: '$SCREENSHOTS_DIR/tc1-homepage.png' });
  console.log('  Screenshot saved');

  console.log('[TC2] Checking login state...');
  const nsec = await page.evaluate(() => localStorage.getItem('nostr_local_signer_key'));
  console.log('  Auth:', nsec ? 'INJECTED' : 'MISSING');

  console.log('[TC3] Loading products...');
  await page.goto('https://plebeian.market/products', { timeout: 20000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: '$SCREENSHOTS_DIR/tc3-products.png', fullPage: true });
  console.log('  Products screenshot saved');

  console.log('[TC7] Checking API config...');
  const resp = await page.request.get('https://plebeian.market/api/config');
  const config = await resp.json();
  console.log('  Relay:', config.appRelay);
  console.log('  Stage:', config.stage);

  console.log('[TC8] Loading auctions...');
  await page.goto('https://plebeian.market/auctions', { timeout: 15000, waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.screenshot({ path: '$SCREENSHOTS_DIR/tc8-auctions.png', fullPage: true });

  await browser.close();
  console.log('\\n=== Smoke test complete ===');
  console.log('Screenshots in: $SCREENSHOTS_DIR/');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
" 2>&1
