#!/usr/bin/env python3
"""
Register Nostr shop identities on CoinOS to get Lightning addresses.

Zero external dependencies — uses stdlib only (urllib, json).

Usage:
    python3 register-coinos.py
    python3 register-coinos.py --shop trade
    python3 register-coinos.py --verify-only
    python3 register-coinos.py --username customname --pubkey <hex> --password <pass>

Registers accounts on coinos.io via POST /api/register. Returns Lightning
addresses (lud16) that work with Plebeian Market for receiving payments.

No captcha. No manual account creation. No Lightning node needed.

Credentials stored in KeePass:
    ~/.hermes/profiles/manager/secrets/nostr-shops.kdbx
    Group: "CoinOS"
"""

import argparse
import json
import sys
import urllib.request
import urllib.error

COINOS_API = "https://coinos.io/api/register"
COINOS_LNURL_CHECK = "https://coinos.io/.well-known/lnurlp/{username}"

DEFAULT_SHOPS = [
    {
        "username": "sovrnoptics",
        "password": "c03rad0r-sats-2026",
        "pubkey": "e18a1d171a59d874edd336472afeb3a614d3dc83397dd097e922a99dcee02133",
        "name": "Sovereign Optics",
        "npub": "npub1ux9p69c6t8v8fmwnxerj4l4n5c2d8hyr897ap9lfy25emnhqyyes7wxnqk",
    },
    {
        "username": "sovereigntrade",
        "password": "c03rad0r-sats-2026",
        "pubkey": "cc3e0c9f963c9fd4b211ac58cda671a102dda13570c54c454ca1d262ea09b089",
        "name": "Sovereign Trade",
        "npub": "npub1eslqe8uk8j0afvs343vvmfn35ypdmgf4wrz5c32v58fx96sfkzysa5galy",
    },
    {
        "username": "sovereignguides",
        "password": "c03rad0r-sats-2026",
        "pubkey": "8be0710742d29c87729e5f81e45b8604f2aab60c91ba730123ed21cef1d061bc",
        "name": "Sovereign Guides",
        "npub": "npub130s8zp6z62wgwu57t7q7gkuxqne24dsvjxa8xqfra5suauwsvx7qw3fvpa",
    },
    {
        "username": "sovereigneng",
        "password": "c03rad0r-sats-2026",
        "pubkey": "5062157c07dc7c2a00690d72d6815f93909fee9656bce8887e095527bcb6364b",
        "name": "Sovereign Engineering",
        "npub": "npub12p3p2lq8m37z5qrfp4eddq2ljwgflm5k267w3zr7p92j009kxe9syugjc9",
    },
]


def register_shop(username, password, pubkey):
    payload = json.dumps({
        "user": {
            "username": username,
            "password": password,
            "pubkey": pubkey,
            "fresh": True,
        }
    }).encode()
    req = urllib.request.Request(
        COINOS_API, data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200]
        return {"error": f"HTTP {e.code}: {body}"}
    except Exception as e:
        return {"error": str(e)}


def verify_lnurl(username):
    url = COINOS_LNURL_CHECK.format(username=username)
    try:
        resp = urllib.request.urlopen(url, timeout=10)
        data = json.loads(resp.read())
        return data.get("tag") == "payRequest"
    except Exception:
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Register Nostr shops on CoinOS for Lightning addresses"
    )
    parser.add_argument("--shop", choices=["optics", "trade", "guides", "engineering"],
                        help="Register only one shop")
    parser.add_argument("--username", help="Custom username")
    parser.add_argument("--pubkey", help="Custom pubkey (hex)")
    parser.add_argument("--password", help="Custom password")
    parser.add_argument("--verify-only", action="store_true",
                        help="Only verify existing LNURLs, don't register")
    args = parser.parse_args()

    if args.username and args.pubkey:
        shops = [{
            "username": args.username,
            "password": args.password or "changeme",
            "pubkey": args.pubkey,
            "name": args.username,
        }]
    elif args.shop:
        idx = {"optics": 0, "trade": 1, "guides": 2, "engineering": 3}
        shops = [DEFAULT_SHOPS[idx[args.shop]]]
    else:
        shops = DEFAULT_SHOPS

    print(f"{'Shop':<25} {'Lightning Address':<35} {'Status':<20}")
    print("-" * 82)

    for shop in shops:
        ln_addr = f"{shop['username']}@coinos.io"

        if args.verify_only:
            ok = verify_lnurl(shop["username"])
            status = "OK" if ok else "FAIL"
        else:
            result = register_shop(
                shop["username"], shop["password"], shop["pubkey"]
            )
            if "error" in result:
                if "taken" in str(result["error"]).lower():
                    ok = verify_lnurl(shop["username"])
                    status = "EXISTS+OK" if ok else "EXISTS+FAIL"
                else:
                    status = f"ERROR: {result['error'][:40]}"
            else:
                ok = verify_lnurl(shop["username"])
                status = "OK" if ok else "REGISTERED+LNURL_FAIL"

        print(f"{shop['name']:<25} {ln_addr:<35} {status:<20}")

    print()
    print("Update Nostr profiles with these lud16 addresses:")
    print('  nak event -k 0 --content \'{"lud16":"USERNAME@coinos.io",...}\' --sec <nsec> <relays>')


if __name__ == "__main__":
    main()
