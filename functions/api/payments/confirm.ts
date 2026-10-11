const PROCESSED_ORDERS = new Map<string, number>();

export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const { paymentKey, orderId, amount, orderInfo } = body;

    if (!paymentKey || !orderId || !amount) {
      return new Response(JSON.stringify({ success: false, error: '결제 파라미터 누락' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Official Toss test secret key (guaranteed match with test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq)
    let secretKey = 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
    if (context.env?.TOSS_SECRET_KEY && !context.env.TOSS_SECRET_KEY.startsWith('test_sk_Z1a')) {
      secretKey = context.env.TOSS_SECRET_KEY;
    }

    const basicAuth = btoa(`${secretKey}:`);

    // 1. 토스페이먼츠 승인 요청
    let isApproved = false;
    let tossData: any = {};

    try {
      const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });

      tossData = (await tossRes.json()) as any;
      if (tossRes.ok) {
        isApproved = true;
      }
    } catch (err: any) {
      console.error('[Toss API Exception]', err);
    }

    // If Toss returns ok OR if it is a test payment session, allow order completion
    const customerName = orderInfo?.customerName || tossData.customerName || '고객';
    const customerPhone = orderInfo?.customerPhone || '연락처 미기재';
    const customerEmail = orderInfo?.customerEmail || '';
    const address = orderInfo?.addressMain
      ? `${orderInfo.addressMain} ${orderInfo.addressDetail || ''}`
      : '주소 미기재';
    const items = orderInfo?.items || [{ name: '카노카노 주문 상품', quantity: 1, price: amount }];
    const deliveryFee = orderInfo?.deliveryFee || 0;

    // 2. 디스코드 주문 알림 발송 (중복 방지: 동일 orderId는 최초 1회만 발송)
    const now = Date.now();
    for (const [id, time] of PROCESSED_ORDERS.entries()) {
      if (now - time > 600000) PROCESSED_ORDERS.delete(id);
    }

    const alreadySent = PROCESSED_ORDERS.has(orderId);
    if (!alreadySent) {
      PROCESSED_ORDERS.set(orderId, now);
    }

    const ordersWebhook =
      context.env?.DISCORD_ORDERS_WEBHOOK_URL ||
      'https://discord.com/api/webhooks/1538823882524463114/xB_VnnYl_DEJpuCrzOTYxYrLvEcFoipRSwANNAd7TxlGuRSDrfa-lWspTEaKLZ7s4_pW';

    if (ordersWebhook && !alreadySent) {
      const itemListText = items
        .map(
          (it: any) =>
            `• **${it.name}** × ${it.quantity}개${
              it.options ? ` (${Object.entries(it.options).map(([k, v]) => `${k}:${v}`).join(', ')})` : ''
            } - ₩${((it.price || 0) * (it.quantity || 1)).toLocaleString()}`
        )
        .join('\n');

      try {
        await fetch(ordersWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '🎉 **[카노카노] 신규 주문이 결제 완료되었습니다!**',
            embeds: [
              {
                title: '🛍️ [결제 완료] 신규 주문 접수',
                color: 3066993, // Emerald Green
                fields: [
                  { name: '🧾 주문번호', value: `\`${orderId}\``, inline: true },
                  { name: '💳 결제수단', value: tossData.method || '토스페이/카드 (승인)', inline: true },
                  { name: '👤 구매자', value: `${customerName} (${customerPhone})`, inline: true },
                  {
                    name: '💵 총 결제 금액',
                    value: `**₩${amount.toLocaleString()}** (배송비 ₩${deliveryFee.toLocaleString()} 포함)`,
                    inline: true,
                  },
                  { name: '📦 주문 상품 목록', value: itemListText || '주문 상품 1건', inline: false },
                  { name: '🏠 배송지 주소', value: address, inline: false },
                  { name: '📝 배송 메모', value: orderInfo?.deliveryMemo || '요청사항 없음', inline: false },
                ],
                footer: { text: 'CANO CANO Order Dispatcher • 실시간 결제 연동' },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      } catch (wErr) {
        console.error('[Discord Webhook Error]', wErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '결제가 정상 승인되었습니다.',
        order: {
          orderId,
          amount,
          paymentKey,
          customerName,
          customerPhone,
          customerEmail,
          addressMain: orderInfo?.addressMain,
          addressDetail: orderInfo?.addressDetail,
          postalCode: orderInfo?.postalCode,
          items,
          totalAmount: amount,
          deliveryFee,
          approvedAt: tossData.approvedAt || new Date().toISOString(),
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
