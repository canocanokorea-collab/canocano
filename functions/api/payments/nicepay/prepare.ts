export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const { orderId, amount, goodsName, buyerName, buyerEmail, buyerTel } = body;

    const mid = context.env?.NICEPAY_MID || 'PIcanocanm';
    const signKey =
      context.env?.NICEPAY_SIGN_KEY ||
      'lTHRv+aLU0X9ANGv9wEEAXv5iim352wBp3DzFiakQtXFGzIfELzjDL4QlcJieHNY3Wl68eqSk//MXimADCPOMw==';

    // Calculate KST Time (UTC + 9)
    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
    const ediDate =
      kst.getFullYear() +
      String(kst.getMonth() + 1).padStart(2, '0') +
      String(kst.getDate()).padStart(2, '0') +
      String(kst.getHours()).padStart(2, '0') +
      String(kst.getMinutes()).padStart(2, '0') +
      String(kst.getSeconds()).padStart(2, '0');

    // SHA-256(EdiDate + MID + Amt + SignKey)
    const amtStr = String(amount);
    const plainText = `${ediDate}${mid}${amtStr}${signKey}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signData = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const origin = new URL(context.request.url).origin;
    const returnUrl = `${origin}/api/payments/nicepay/return`;

    return new Response(
      JSON.stringify({
        success: true,
        mid,
        ediDate,
        signData,
        returnUrl,
        moid: orderId,
        goodsName: String(goodsName || '카노카노 상품'),
        amt: amtStr,
        buyerName: String(buyerName || '고객'),
        buyerEmail: String(buyerEmail || 'cano_customer@canocano.shop'),
        buyerTel: String(buyerTel || '01012345678'),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
