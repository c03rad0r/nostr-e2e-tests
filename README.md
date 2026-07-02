# Nostr E2E Tests — Plebeian Market

End-to-end Playwright tests for our 4 Nostr shops on Plebeian Market.

## Shops Under Test

| Shop | npub | Products |
|------|------|----------|
| Sovereign Optics | npub1ux9p69... | Optical lenses (5 SKUs) |
| Sovereign Trade | npub1eslqe8... | Physical imports (saffron, tea, etc.) |
| Sovereign Guides | npub130s8z... | Digital products (guides, configs) |
| Sovereign Engineering | npub12p3p2... | Services (flashing, consulting) |

**All npub/nsec keys are in KeePass** — see [KEY-MANAGEMENT.md](./KEY-MANAGEMENT.md)

## Test Cases

| TC | Description |
|----|-------------|
| TC1 | Homepage loads, header/footer visible |
| TC2 | Buyer login via localStorage nsec injection |
| TC3 | Products page shows listings from Nostr relays |
| TC4 | Search for products (saffron, glasses, guide) |
| TC5 | Product detail page renders with buy button |
| TC6 | Add to cart and reach checkout page |
| TC7 | API config endpoint returns valid relay info |
| TC8 | Buyer 2 full journey (products, auctions, community) |

## Running Tests

### From VPS2 (Production — Dallas TX IP)

```bash
./run-vps2.sh
```

This deploys the tests to VPS2 (23.182.128.51), runs them from the Texas IP, and retrieves screenshots/videos/results.

### Local Quick Smoke (T470 — for dev only)

```bash
./run-local.sh
```

**WARNING:** Local tests run from the Berlin home IP. Do NOT use for production interactions with external sites. Only for quick UI verification.

### Prerequisites

```bash
npm install
npx playwright install chromium
```

## Output

- `screenshots/` — PNG screenshots per test case
- `videos/` — WebM video recordings (when run via Playwright runner)
- `reports/` — HTML and JSON test reports

## Important

- Tests use fresh buyer npubs (never the shop nsec keys)
- Buyer keys are in KeePass under "Test Buyers" group
- All web automation MUST run from VPS2, never from T470/DQ05 (Berlin IP)
- See `KEY-MANAGEMENT.md` for key locations
