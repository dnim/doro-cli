#!/bin/bash
set -e

# 1. Check if we are on main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "Error: You must be on the 'main' branch to release (current: $BRANCH)."
  exit 1
fi

# 2. Check for unstaged changes
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: You have uncommitted or unstaged changes. Please commit or stash them first."
  exit 1
fi

# 3. Check for sync with origin
echo "Checking sync with origin..."
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "Error: Local 'main' is not in sync with 'origin/main'. Please pull or push first."
  exit 1
fi

# 4. Quality Checks
echo "Running Lint..."
npm run lint
echo "Running Typecheck..."
npm run typecheck
echo "Running Tests..."
npm run test:unit

echo "✅ Pre-release checks passed!"
