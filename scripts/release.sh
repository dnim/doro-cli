#!/bin/bash
set -e

# 1. Run safety checks
bash scripts/pre-release.sh

# 2. Get the release type (patch, minor, major)
TYPE=$1
if [ -z "$TYPE" ]; then
  echo "Usage: npm run release -- [patch|minor|major|prerelease]"
  exit 1
fi

# 3. Bump version without committing yet
echo "Bumping version ($TYPE)..."
npm version $TYPE --no-git-tag-version

# 4. Build the project
echo "Building project..."
npm run build

# 5. Get the new version number
VERSION=$(node -p "require('./package.json').version")

# 6. Publish to npm
echo "Publishing v$VERSION to npm..."
if npm publish --access public --tag latest; then
  echo "✅ Published to npm successfully."
else
  echo "❌ Publish failed. Reverting package.json changes..."
  git checkout package.json package-lock.json
  exit 1
fi

# 7. Commit and Tag
echo "Committing and tagging v$VERSION..."
git add package.json package-lock.json
git commit -m "$VERSION"
git tag -a "v$VERSION" -m "v$VERSION"

# 8. Push to GitHub
echo "Pushing to GitHub..."
git push origin main --follow-tags

echo "🚀 Release v$VERSION complete!"
