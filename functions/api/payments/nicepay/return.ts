export async function onRequest(context: any) {
  try {
    const url = new URL(context.request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const rawText = await context.request.text().catch(() => '');
    let bodyParams: Record<string, string> = {};

    if (rawText) {
      try {
        const u = new URLSearchParams(rawText);
        for (const [k, v] of u.entries()) {
          bodyParams[k] = v;
        }
      } catch (e) {}

      if (Object.keys(bodyParams).length === 0) {
        try {
          bodyParams = JSON.parse(rawText);
        } catch (e) {}
      }
    }

    const params: Record<string, string> = { ...searchParams, ...bodyParams };

    const {
      AuthResultCode,
      AuthResultMsg,
      AuthToken,
      TID,
      MID,
      Amt,
      NextAppURL,
      NetCancelURL,
      Moid,
      BuyerName,
      BuyerTel,
      GoodsName,
    } = params;

    const origin = url.origin;
    const isAuthSuccess = AuthResultCode === '0000';

    // 에러 웹훅 전송
    const errorWebhook =
      context.env?.DISCORD_ERROR_WEBHOOK_URL ||
      'https://discord.com/api/webhooks/1538823826442289213/qiYi75PX2S2-X1Gi8W8cwKGsNVdoWcZ39SUBgYbPaPf2v9cNvEk4DV5gf_wVu3oX4Zqh';

    if (!isAuthSuccess || !AuthToken || !TID) {
      await fetch(errorWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `⚠️ **[나이스페이 인증 응답 수신]**\n- 결과코드: \`${AuthResultCode || 'N/A'}\`\n- 결과메시지: \`${AuthResultMsg || 'N/A'}\`\n- TID: \`${TID || 'N/A'}\`\n- 수신데이터: \`\`\`json\n${JSON.stringify(params, null, 2)}\n\`\`\``,
        }),
      }).catch(() => {});

      return new Response(
        `<!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>결제 실패</title></head>
        <body>
          <script>
            alert("나이스페이 인증 실패: ${AuthResultMsg || '인증이 완료되지 않았습니다.'}");
            window.location.href = "${origin}/checkout?fail=true";
          </script>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // 2단계: 나이스페이 최종 승인 (Server-to-Server Approve API 호출)
    const mid = MID || context.env?.NICEPAY_MID || 'PIcanocanm';
    const signKey =
      context.env?.NICEPAY_SIGN_KEY ||
      'lTHRv+aLU0X9ANGv9wEEAXv5iim352wBp3DzFiakQtXFGzIfELzjDL4QlcJieHNY3Wl68eqSk//MXimADCPOMw==';

    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
    const ediDate =
      kst.getFullYear() +
      String(kst.getMonth() + 1).padStart(2, '0') +
      String(kst.getDate()).padStart(2, '0') +
      String(kst.getHours()).padStart(2, '0') +
      String(kst.getMinutes()).padStart(2, '0') +
      String(kst.getSeconds()).padStart(2, '0');

    // 승인 서명 공식: Hex(SHA256(AuthToken + MID + Amt + EdiDate + SignKey))
    const plain = `${AuthToken}${mid}${Amt}${ediDate}${signKey}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const approveSignData = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const targetApproveUrl = NextAppURL || 'https://webapi.nicepay.co.kr/webapi/pay_process.jsp';

    const approveParams = new URLSearchParams();
    approveParams.append('TID', TID);
    approveParams.append('AuthToken', AuthToken);
    approveParams.append('MID', mid);
    approveParams.append('Amt', Amt);
    approveParams.append('EdiDate', ediDate);
    approveParams.append('SignData', approveSignData);
    approveParams.append('CharSet', 'utf-8');

    let approveData: any = {};
    try {
      const approveRes = await fetch(targetApproveUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        body: approveParams.toString(),
      });

      const approveText = await approveRes.text();
      try {
        approveData = JSON.parse(approveText);
      } catch (e) {
        const search = new URLSearchParams(approveText);
        approveData = Object.fromEntries(search.entries());
      }
    } catch (approveErr) {
      console.error('[NicePay Approve Error]', approveErr);
    }

    const cardName = approveData.CardName || approveData.fn_cd || '신용카드';
    const appNo = approveData.AppNo || approveData.AuthCode || '승인완료';
    const finalAmount = parseInt(approveData.Amt || Amt || '0', 10);

    // 3. 디스코드 실시간 주문/결제 알림 발송
    const ordersWebhook =
      context.env?.DISCORD_ORDERS_WEBHOOK_URL ||
      'https://discord.com/api/webhooks/1538823882524463114/xB_VnnYl_DEJpuCrzOTYxYrLvEcFoipRSwANNAd7TxlGuRSDrfa-lWspTEaKLZ7s4_pW';

    if (ordersWebhook) {
      try {
        await fetch(ordersWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '🎉 **[카노카노] 나이스페이 실시간 카드 결제가 승인 완료되었습니다!**',
            embeds: [
              {
                title: '🛍️ [나이스페이 실 결제 완료] 신규 주문 접수',
                color: 3066993, // Green
                fields: [
                  { name: '🧾 주문번호', value: `\`${Moid}\``, inline: true },
                  { name: '💳 결제수단', value: `나이스페이 ${cardName} (승인번호: ${appNo})`, inline: true },
                  { name: '👤 구매자', value: `${BuyerName || '고객'} (${BuyerTel || '연락처'})`, inline: true },
                  {
                    name: '💵 결제 승인 금액',
                    value: `**₩${finalAmount.toLocaleString()}** (카드사 승인 완료)`,
                    inline: true,
                  },
                  { name: '📦 주문 상품', value: GoodsName || '카노카노 상품', inline: false },
                  { name: '🔑 거래번호(TID)', value: `\`${TID}\``, inline: false },
                ],
                footer: { text: 'CANO CANO NICEPAY Server • 실시간 카드 승인' },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      } catch (err) {
        console.error('[Discord Alert Error]', err);
      }
    }

    // 4. 주문 완료 페이지로 리다이렉트
    const successUrl = `${origin}/order-success?orderId=${Moid}&paymentKey=${TID}&amount=${finalAmount}&paymentMethod=NICEPAY`;
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>결제 승인 완료</title></head>
      <body>
        <script>
          window.location.href = "${successUrl}";
        </script>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error: any) {
    return new Response(`Server Error: ${error.message}`, { status: 500 });
  }
}
