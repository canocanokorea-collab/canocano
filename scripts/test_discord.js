const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '../.env.local');
let env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length > 0) {
      env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const cleanUrl = (url) => url ? url.replace(/^["']|["']$/g, '').trim() : null;

const WEBHOOKS = {
  error: cleanUrl(env.DISCORD_ERROR_WEBHOOK_URL || process.env.DISCORD_ERROR_WEBHOOK_URL),
  orders: cleanUrl(env.DISCORD_ORDERS_WEBHOOK_URL || process.env.DISCORD_ORDERS_WEBHOOK_URL),
  inquiries: cleanUrl(env.DISCORD_INQUIRIES_WEBHOOK_URL || process.env.DISCORD_INQUIRIES_WEBHOOK_URL),
  inventory: cleanUrl(env.DISCORD_INVENTORY_WEBHOOK_URL || process.env.DISCORD_INVENTORY_WEBHOOK_URL),
};

async function sendTest(name, url, embed) {
  if (!url) {
    console.log(`⚠️ [${name}] 웹훅 URL이 설정되지 않았습니다. .env.local을 확인하세요.`);
    return;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (res.ok) {
      console.log(`✅ [${name}] 디스코드 실시간 메시지 발송 성공!`);
    } else {
      console.error(`❌ [${name}] 발송 실패 (${res.status}):`, await res.text());
    }
  } catch (err) {
    console.error(`❌ [${name}] 오류:`, err.message);
  }
}

async function main() {
  console.log('🔔 카노카노 한국어 채널별 웹훅 연동 테스트 시작...\n');

  // 1. Error Channel
  await sendTest('🚨 #🚨-오류-관제', WEBHOOKS.error, {
    title: '🚨 [오류 관제 시스템 가동] 카노카노 모니터링 활성화',
    color: 15158332,
    description: '사이트에서 발생하는 모든 에러와 스택 트레이스가 이 채널로 실시간 보고됩니다.',
    fields: [
      { name: '📍 감시 대상', value: '`canocano.shop` (Cloudflare Pages & Edge API)', inline: true },
      { name: '🤖 담당 에이전트', value: 'Antigravity (안티그래비티)', inline: true },
      { name: '💡 조치 안내', value: '오류 메시지를 복사해서 안티그래비티에게 전달하면 즉시 1-Shot 해결됩니다.', inline: false },
    ],
    footer: { text: 'Canocano Observer • 가동 시작' },
    timestamp: new Date().toISOString(),
  });

  // 2. Orders Channel
  await sendTest('💰 #💰-주문-결제-내역', WEBHOOKS.orders, {
    title: '🛍️ [주문 알림 시스템 가동] 토스페이먼츠 결제 관제 활성화',
    color: 3066993,
    description: '고객이 결제를 완료하면 주문번호, 상품, 금액, 배송지가 이 채널로 실시간 보고됩니다.',
    fields: [
      { name: '💳 결제 PG', value: 'Toss Payments (토스페이/카드/가상계좌)', inline: true },
      { name: '📦 배송 규칙', value: '5만원 이상 무료배송 (기본 3,000원)', inline: true },
    ],
    footer: { text: 'Canocano Orders • 가동 시작' },
    timestamp: new Date().toISOString(),
  });

  // 3. Inquiries Channel
  await sendTest('💬 #💬-1대1-고객-문의', WEBHOOKS.inquiries, {
    title: '💌 [고객 문의 시스템 가동] 1:1 CS 실시간 접수 활성화',
    color: 3447003,
    description: '고객이 웹사이트에서 1:1 문의를 남기면 즉시 알림이 발송됩니다.',
    fields: [
      { name: '📌 문의 유형', value: '배송/제작, 상품상세, 쇼룸방문 등', inline: true },
      { name: '✉️ 회신 방식', value: '고객 이메일/문자로 직접 회신', inline: true },
    ],
    footer: { text: 'Canocano CS Support • 가동 시작' },
    timestamp: new Date().toISOString(),
  });

  // 4. Inventory Channel
  await sendTest('📦 #📦-상품-재고-현황', WEBHOOKS.inventory, {
    title: '📦 [상품/재고 관리 가동] 카탈로그 매니저 활성화',
    color: 15844367,
    description: '신규 상품 등록, 가격 변동, 품절 알림이 이 채널로 보고됩니다.',
    fields: [
      { name: '총 등록 상품', value: '12종 (베베블 우드 테이블 등)', inline: true },
      { name: '상태', value: '정상 진열 중', inline: true },
    ],
    footer: { text: 'Canocano Catalog Manager • 가동 시작' },
    timestamp: new Date().toISOString(),
  });

  console.log('\n✨ 4개 채널 전체 테스트 발송 완료.');
}

main();
