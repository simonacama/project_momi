#!/usr/bin/env bash
set -e

# SSH per GitHub: la chiave dedicata sta in .ssh/ nella repo (ignorata da git)
mkdir -p ~/.ssh && chmod 700 ~/.ssh
cp "$(dirname "$0")/../.ssh/id_ed25519_momi" ~/.ssh/id_ed25519_momi
chmod 600 ~/.ssh/id_ed25519_momi
cat > ~/.ssh/config <<'CONF'
Host github.com
  IdentityFile ~/.ssh/id_ed25519_momi
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
CONF
chmod 600 ~/.ssh/config

[ -f package.json ] && npm install || true
