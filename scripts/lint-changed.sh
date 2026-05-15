#!/bin/sh
# Lint only TypeScript files under src/ that changed since HEAD (staged + unstaged).
# Scoped to src/ because tsconfig.json only includes that directory;
# files outside it (e.g. .pi/extensions/) are not part of the TS project.
# Works on macOS and Linux; uses xargs -0 to handle any filename safely.

FILES=$(git diff --name-only --diff-filter=ACMR HEAD | grep -E '^src/.*\.(ts|tsx)$')

if [ -z "$FILES" ]; then
  echo "No changed TypeScript files to lint."
  exit 0
fi

echo "Linting changed files:"
echo "$FILES"
echo ""

echo "$FILES" | tr '\n' '\0' | xargs -0 npx eslint
