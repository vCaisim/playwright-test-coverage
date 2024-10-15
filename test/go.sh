#!/usr/bin/env bash
set -euxo pipefail

# Create tarball from package
npm run pack

# Change into script folder
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "$SCRIPT_DIR"

# If CI is set, install dependencies
if [ -n "${CI-}" ]; then
  npm install
  npx playwright install-deps
  npx playwright install
fi

rm -rf .next/ coverage/ .nyc_output/ test-results/
npx start-server-and-test 3000 "playwright test"
