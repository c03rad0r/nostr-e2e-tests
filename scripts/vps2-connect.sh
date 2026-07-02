#!/usr/bin/env bash
# VPS2 connection helper — source this to get SSH variables
# Usage: source scripts/vps2-connect.sh && ssh $VPS2_SSH "command"
#
# Credentials in KeePass: ~/.hermes/profiles/manager/secrets/nostr-shops.kdbx
# Group: "VPS Access" → Entry: "VPS2 Dallas"

export VPS2_IP="23.182.128.51"
export VPS2_USER="debian"
export VPS2_SSH="${VPS2_USER}@${VPS2_IP}"

# Password fallback (only needed if SSH key not authorized):
# Read from tollgate-infrastructure-kit .env if present
if [ -f ~/tollgate-infrastructure-kit/.env ]; then
    source ~/tollgate-infrastructure-kit/.env
fi

echo "VPS2 connection ready: ssh $VPS2_SSH"
