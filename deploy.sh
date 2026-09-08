#!/usr/bin/env bash
# سكربت نشر بنقرة واحدة: يبني تطبيق الويب ويرفعه إلى GitHub Pages (فرع gh-pages)
# الاستخدام:  bash deploy.sh
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
WEB="$ROOT/web"
REPO="https://github.com/alassli7/invoices-web.git"
SITE="https://alassli7.github.io/invoices-web/"

echo "› بناء التطبيق..."
cd "$WEB"
npm install --no-audit --no-fund >/dev/null 2>&1 || true
npm run build

echo "› تجهيز ملفات النشر..."
TMP="$(mktemp -d)"
cp -r "$WEB/dist/." "$TMP/"
touch "$TMP/.nojekyll"

cd "$TMP"
git init -q
git add -A
git commit -q -m "deploy $(date +%Y-%m-%dT%H:%M:%S)"
git branch -M gh-pages

echo "› ربط Git بـ GitHub عبر gh..."
gh auth setup-git >/dev/null 2>&1 || true
git remote add origin "$REPO" 2>/dev/null || git remote set-url origin "$REPO"
git push -u origin gh-pages --force

rm -rf "$TMP"
echo "✓ تم النشر على: $SITE"
