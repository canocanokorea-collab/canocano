function formatPhone(phone: string) {
  const clean = (phone || '').replace(/[^0-9]/g, '');
  if (clean.length === 11) return clean.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  if (clean.length === 10) return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  return phone;
}

export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const {
      orderId,
      customerName,
      customerPhone,
      requestType,
      reasonType,
      reasonDetail,
      refundAccount,
      totalAmount,
      paymentMethod,
      createdAt,
    } = body;

    if (!orderId || !customerName || !requestType || !reasonType) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 정보(주문번호, 고객명, 신청유형, 사유)가 누락되었습니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 30분 이내 여부 계산
    const orderTimestamp = createdAt ? new Date(createdAt).getTime() : Date.now();
    const isWithin30Mins = (Date.now() - orderTimestamp) <= (30 * 60 * 1000);
    const isAutoCancel = requestType === '주문취소' && isWithin30Mins;

    // 포트원 결제 자동 취소 시도
    let pgCancelled = false;
    let pgError = '';
    const portoneApiSecret = context.env?.PORTONE_API_SECRET || '';

    if (isAutoCancel && (paymentMethod === 'CARD' || paymentMethod === 'PORTONE') && portoneApiSecret) {
      try {
        const cancelRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(orderId)}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `PortOne ${portoneApiSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: reasonDetail || '주문 후 30분 이내 고객 자동 취소',
          }),
        });

        if (cancelRes.ok) {
          pgCancelled = true;
        } else {
          const errData = await cancelRes.json().catch(() => ({}));
          pgError = errData?.message || '';
        }
      } catch (e: any) {
        pgError = e?.message || '';
      }
    }

    // KV 실서버 주문 상태 동기화
    if (context.env?.CANO_STORE) {
      try {
        const kv = context.env.CANO_STORE;
        let orders: any[] = (await kv.get('cano_orders_data', { type: 'json' })) || [];
        if (Array.isArray(orders)) {
          const idx = orders.findIndex((o: any) => o.orderId === orderId);
          if (idx !== -1) {
            orders[idx].status = isAutoCancel ? '취소/환불' : orders[idx].status;
            orders[idx].cancelRequest = {
              requestType,
              reasonType,
              reasonDetail,
              refundAccount,
              requestedAt: new Date().toISOString(),
              isAutoCancel,
            };
            await kv.put('cano_orders_data', JSON.stringify(orders));
          }
        }
      } catch (kvErr) {
        console.warn('KV order status update error:', kvErr);
      }
    }

    const webhookUrl =
      context.env?.DISCORD_ORDERS_WEBHOOK_URL ||
      'https://discord.com/api/webhooks/1538823882524463114/xB_VnnYl_DEJpuCrzOTYxYrLvEcFoipRSwANNAd7TxlGuRSDrfa-lWspTEaKLZ7s4_pW';

    if (webhookUrl) {
      const formattedPhone = formatPhone(customerPhone);
      const fields = [
        { name: '🧾 주문번호', value: `\`${orderId}\``, inline: true },
        {
          name: '📌 처리 구분',
          value: isAutoCancel ? '⚡ **30분 이내 즉시 자동 취소**' : `⚠️ **${requestType} 신청 (30분 경과/관리자 승인 필요)**`,
          inline: true,
        },
        { name: '👤 구매자 정보', value: `${customerName} (${formattedPhone})`, inline: true },
        { name: '📋 사유 분류', value: reasonType, inline: true },
        {
          name: '💵 주문 금액',
          value: totalAmount ? `₩${Number(totalAmount).toLocaleString()}` : '확인 필요',
          inline: true,
        },
        {
          name: '💳 결제 수단',
          value: paymentMethod === 'CARD' || paymentMethod === 'PORTONE' ? '신용/체크카드 (KG이니시스)' : '무통장 입금',
          inline: true,
        },
        {
          name: '💬 상세 사유 및 요청사항',
          value: reasonDetail || '상세 사유 미기재',
          inline: false,
        },
      ];

      if (refundAccount) {
        fields.push({
          name: '🏦 환불 계좌 정보',
          value: refundAccount,
          inline: false,
        });
      }

      const embedTitle = isAutoCancel
        ? '⚡ [자동 취소 완료] 주문 후 30분 이내 즉시 취소'
        : `🚨 [${requestType} 신청] 고객 주문 처리 요청 (관리자 확인 필요)`;

      const embedColor = isAutoCancel ? 3066993 : (requestType === '주문취소' ? 15158332 : 15844367);

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: embedTitle,
              color: embedColor,
              fields,
              footer: { text: 'CANO CANO (canocano.shop) • 실시간 주문/클레임 알림 (카드사 환불은 최대 3영업일 소요 예정)' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    const responseMsg = isAutoCancel
      ? '주문 후 30분 이내 요청으로 즉시 자동 취소 처리되었습니다. (카드사 환불은 카드사 정책에 따라 최대 3영업일 소요 예정입니다)'
      : '주문 후 30분이 경과하여 상품 제작/출고가 진행 중일 수 있어 관리자 확인 후 취소 처리가 진행됩니다. (승인 시 카드사 환불은 최대 3영업일 소요 예정)';

    return new Response(
      JSON.stringify({
        success: true,
        isAutoCancel,
        message: responseMsg,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
