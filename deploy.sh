#!/bin/bash
export PATH="$HOME/.nodejs/bin:$PATH"

echo "========================================================"
echo "  CANO CANO (canocano.shop) Cloudflare Pages 배포 스크립트"
echo "========================================================"

# 1. 정적 사이트 빌드
echo "[1/3] Next.js 정적 사이트 빌드 중..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ 빌드 실패! 오류를 확인하세요."
  exit 1
fi

# 2. Cloudflare Pages 배포
echo "[2/3] Cloudflare Pages로 업로드 및 배포 중..."
npx wrangler pages deploy out --project-name=canocano-shop --commit-dirty=true

echo "========================================================"
echo "✅ 배포 완료!"
echo "• Cloudflare Pages 실시간 배포 링크: https://canocano-shop.pages.dev"
echo "• 커스텀 도메인 연결: https://canocano.shop"
echo "========================================================"
