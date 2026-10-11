/**
 * Discord Webhook Notification Utility for Canocano
 */

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number; // Integer color code (e.g. 15158332 for Red, 3066993 for Green, 3447003 for Blue)
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
}

const ERROR_WEBHOOK = 'https://discord.com/api/webhooks/1538823826442289213/qiYi75PX2S2-X1Gi8W8cwKGsNVdoWcZ39SUBgYbPaPf2v9cNvEk4DV5gf_wVu3oX4Zqh';
const ORDERS_WEBHOOK = 'https://discord.com/api/webhooks/1538823882524463114/xB_VnnYl_DEJpuCrzOTYxYrLvEcFoipRSwANNAd7TxlGuRSDrfa-lWspTEaKLZ7s4_pW';
const INQUIRIES_WEBHOOK = 'https://discord.com/api/webhooks/1538823941169090620/Esvo5NXyU4wam5M46h2LZOWjFXIo9x_YgE-kq_sadw_r0CiNx6VHoW2Hopp3lL3o1gxy';
const INVENTORY_WEBHOOK = 'https://discord.com/api/webhooks/1538824399795396738/Z-0mEpzmb5SNDzG-piaW0R9ysHHw6HMYV81HT0G7JxPfunNcFaA5VRWZcJNER3EYqg3M';

const WEBHOOK_URLS = {
  error: process.env.DISCORD_ERROR_WEBHOOK_URL || ERROR_WEBHOOK,
  orders: process.env.DISCORD_ORDERS_WEBHOOK_URL || ORDERS_WEBHOOK,
  inquiries: process.env.DISCORD_INQUIRIES_WEBHOOK_URL || INQUIRIES_WEBHOOK,
  inventory: process.env.DISCORD_INVENTORY_WEBHOOK_URL || INVENTORY_WEBHOOK,
};

async function postToWebhook(webhookUrl: string, payload: { content?: string; embeds?: DiscordEmbed[] }) {
  if (!webhookUrl) {
    console.warn('[Discord Webhook] Webhook URL is not configured. Skipping alert.', payload);
    return { success: false, reason: 'URL_NOT_CONFIGURED' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Discord Webhook] Failed to send webhook:', res.status, errText);
      return { success: false, status: res.status, error: errText };
    }

    return { success: true };
  } catch (error) {
    console.error('[Discord Webhook] Network error while sending webhook:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * 1. 🚨 오류 보고 (Error Logging)
 * 안티그래비티가 캡처나 텍스트만 보고도 1초 만에 수정할 수 있는 초고해상도 디버그 정보
 */
export async function sendErrorAlert(params: {
  location: string;
  errorMessage: string;
  stack?: string;
  clientInfo?: string;
  actionHint?: string;
  extraData?: Record<string, any>;
}) {
  const fields: DiscordEmbedField[] = [
    { name: '📍 발생 지점 / 엔드포인트', value: `\`${params.location}\``, inline: true },
    { name: '⏱ 발생 시각 (KST)', value: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }), inline: true },
    { name: '⚠️ 오류 메시지', value: `\`\`\`\n${params.errorMessage}\n\`\`\``, inline: false },
  ];

  if (params.clientInfo) {
    fields.push({ name: '👤 사용자 환경 (Client Info)', value: params.clientInfo, inline: false });
  }

  if (params.extraData && Object.keys(params.extraData).length > 0) {
    fields.push({
      name: '📦 요청 페이로드 (Data)',
      value: `\`\`\`json\n${JSON.stringify(params.extraData, null, 2).slice(0, 1000)}\n\`\`\``,
      inline: false,
    });
  }

  if (params.stack) {
    fields.push({
      name: '📋 Stack Trace',
      value: `\`\`\`ts\n${params.stack.slice(0, 1000)}\n\`\`\``,
      inline: false,
    });
  }

  fields.push({
    name: '💡 안티그래비티 조치 가이드',
    value: params.actionHint || '해당 엔드포인트의 입력값 유효성 검사 및 서버 핸들러를 확인하세요.',
    inline: false,
  });

  const embed: DiscordEmbed = {
    title: '🚨 [사이트 오류 감지] Canocano Production Error',
    color: 15158332, // Red
    fields,
    footer: { text: 'Canocano Agent Observer • 안티그래비티 즉각 조치 연동' },
    timestamp: new Date().toISOString(),
  };

  return postToWebhook(WEBHOOK_URLS.error, { embeds: [embed] });
}

/**
 * 2. 💰 신규 주문 및 결제 내역 (Order & Payment Notification)
 */
export async function sendOrderAlert(params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; quantity: number; options?: Record<string, string>; price: number }[];
  totalAmount: number;
  deliveryFee: number;
  address: string;
  paymentMethod: string;
  paymentKey?: string;
}) {
  const itemListText = params.items
    .map(it => {
      const optStr = it.options ? Object.entries(it.options).map(([k, v]) => `${k}:${v}`).join(', ') : '';
      return `• **${it.name}** x ${it.quantity}개 (${optStr ? `옵션: ${optStr}` : '기본'}) - ₩${(it.price * it.quantity).toLocaleString()}`;
    })
    .join('\n');

  const fields: DiscordEmbedField[] = [
    { name: '🧾 주문번호', value: `\`${params.orderId}\``, inline: true },
    { name: '💳 결제수단', value: params.paymentMethod || '토스페이/카드', inline: true },
    { name: '👤 구매자 정보', value: `${params.customerName} (${params.customerPhone})`, inline: true },
    { name: '📦 주문 상품 목록', value: itemListText, inline: false },
    {
      name: '💵 결제 금액',
      value: `**총 ₩${params.totalAmount.toLocaleString()}** (배송비 ₩${params.deliveryFee.toLocaleString()} 포함)`,
      inline: true,
    },
    { name: '🏠 배송지 주소', value: params.address, inline: false },
  ];

  const embed: DiscordEmbed = {
    title: '🛍️ [결제 완료] 신규 주문이 접수되었습니다!',
    color: 3066993, // Green
    fields,
    footer: { text: 'Canocano Order System • 토스페이먼츠 승인 완료' },
    timestamp: new Date().toISOString(),
  };

  return postToWebhook(WEBHOOK_URLS.orders, { embeds: [embed] });
}

/**
 * 3. 💬 1:1 고객 문의 (Customer Inquiry Notification)
 */
export async function sendInquiryAlert(params: {
  name: string;
  phone: string;
  email: string;
  type: string;
  title: string;
  content: string;
  productName?: string;
}) {
  const cleanPhone = (params.phone || '').replace(/[^0-9]/g, '');
  const formattedPhone =
    cleanPhone.length === 11
      ? cleanPhone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
      : cleanPhone.length === 10
      ? cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
      : params.phone;

  const fields: DiscordEmbedField[] = [
    {
      name: '1. 문의 대상 상품',
      value: params.productName || '일반 문의',
      inline: false,
    },
    {
      name: '2. 작성자',
      value: `${params.name} (${formattedPhone})`,
      inline: true,
    },
    {
      name: '3. 이메일',
      value: params.email || '미입력',
      inline: true,
    },
    {
      name: '4. 문의 유형',
      value: params.type || '배송/제작',
      inline: true,
    },
    {
      name: '5. 제목',
      value: params.title,
      inline: false,
    },
    {
      name: '6. 문의 내용',
      value: params.content,
      inline: false,
    },
  ];

  const embed: DiscordEmbed = {
    title: '[새로운 고객 문의]',
    color: 0x27397D,
    fields,
    footer: { text: 'CANO CANO (canocano.shop)' },
    timestamp: new Date().toISOString(),
  };

  return postToWebhook(WEBHOOK_URLS.inquiries, { embeds: [embed] });
}

/**
 * 4. 📦 상품 및 재고 알림 (Stock / Product Notification)
 */
export async function sendStockAlert(params: {
  productName: string;
  eventType: 'PRODUCT_CREATED' | 'OUT_OF_STOCK' | 'PRICE_CHANGED';
  message: string;
}) {
  const embed: DiscordEmbed = {
    title: `📦 [상품 알림] ${params.productName}`,
    color: 15844367, // Gold/Orange
    description: params.message,
    fields: [
      { name: '이벤트', value: params.eventType, inline: true },
      { name: '시각', value: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }), inline: true },
    ],
    footer: { text: 'Canocano Catalog Manager' },
    timestamp: new Date().toISOString(),
  };

  return postToWebhook(WEBHOOK_URLS.inventory, { embeds: [embed] });
}

/**
 * 5. 🚨 주문 취소 / 반품(환불) / 교환 신청 알림
 */
export async function sendCancelRequestAlert(params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
  requestType: '주문취소' | '반품(환불)' | '교환';
  reasonType: string;
  reasonDetail: string;
  refundAccount?: string;
  totalAmount?: number;
}) {
  const fields: DiscordEmbedField[] = [
    { name: '🧾 주문번호', value: `\`${params.orderId}\``, inline: true },
    { name: '📌 신청 구분', value: `**${params.requestType}**`, inline: true },
    { name: '👤 구매자 정보', value: `${params.customerName} (${params.customerPhone})`, inline: true },
    { name: '📋 사유 분류', value: params.reasonType, inline: true },
    {
      name: '💵 주문 금액',
      value: params.totalAmount ? `₩${params.totalAmount.toLocaleString()}` : '확인 필요',
      inline: true,
    },
    {
      name: '💬 상세 사유',
      value: params.reasonDetail || '상세 사유 미기재',
      inline: false,
    },
  ];

  if (params.refundAccount) {
    fields.push({
      name: '🏦 환불 계좌 정보',
      value: params.refundAccount,
      inline: false,
    });
  }

  const embed: DiscordEmbed = {
    title: `🚨 [${params.requestType} 신청] 고객 주문 처리 요청`,
    color: params.requestType === '주문취소' ? 15158332 : 15844367, // Red or Orange
    fields,
    footer: { text: 'Canocano Order System • 실시간 고객 클레임/취소 접수' },
    timestamp: new Date().toISOString(),
  };

  // 주문 채널 및 문의 채널 모두에 전송
  return postToWebhook(WEBHOOK_URLS.orders, { embeds: [embed] });
}

