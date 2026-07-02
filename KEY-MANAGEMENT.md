# Key Management — Nostr Shop Identities

All Nostr shop nsec keys are stored in an encrypted KeePass database.

DO NOT commit any secrets, .env files, or nsec keys to this repository.

## KeePass Database

Location: `~/.hermes/profiles/manager/secrets/nostr-shops.kdbx`
Password: stored in operator's password manager (not in any repo)

## Shop Identities

| Shop Name | npub | Purpose |
|-----------|------|---------|
| Sovereign Optics | npub1ux9p69c6t8v8fmwnxerj4l4n5c2d8hyr897ap9lfy25emnhqyyes7wxnqk | Optical lens products (5 SKUs) |
| Sovereign Trade | npub1eslqe8uk8j0afvs343vvmfn35ypdmgf4wrz5c32v58fx96sfkzysa5galy | Physical imports (saffron, tea, incense, Boswellia) |
| Sovereign Guides | npub130s8zp6z62wgwu57t7q7gkuxqne24dsvjxa8xqfra5suauwsvx7qw3fvpa | Digital products (guides, config packs) |
| Sovereign Engineering | npub12p3p2lq8m37z5qrfp4eddq2ljwgflm5k267w3zr7p92j009kxe9syugjc9 | Services (flashing, consulting, translation) |

## Test Buyer Identities

| Name | npub hex | Purpose |
|------|----------|---------|
| Buyer 1 | dea5c33c29b1cf3be14a64a00d05760293c6cae89a55567e2112fac49fe0ae29 | E2E test buyer |
| Buyer 2 | fcf375640d840ac738fab3ee923807c778e1752f4938fe04342b20b2f084cb8a | E2E test buyer |

All keypairs (shop + test buyers) are in the KeePass database under groups "Nostr Shops" and "Test Buyers" respectively.

## Deprecated Identities

Two older shop identities (DEPRECATED Services and DEPRECATED Imports) are also stored in KeePass but should not be used.

## Secret File Locations (operational copies, gitignored)

- `~/nostr-glasses/secrets/.env` — Sovereign Optics
- `~/nostr-trade/secrets/.env` — Sovereign Trade
- `~/nostr-guides/secrets/.env` — Sovereign Guides
- `~/nostr-engineering/secrets/.env` — Sovereign Engineering

All `.env` and `secrets/` directories are gitignored.
