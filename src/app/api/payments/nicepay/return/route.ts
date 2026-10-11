import { NextRequest, NextResponse } from 'next/server';
import { NICEPAY_CONFIG } from '@/lib/nicepay';
import { sendOrderAlert } from '@/lib/discord';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => null);
    const body = formData ? Object.fromEntries(formData) : await req.json().catch(() => ({}));

    const {
      AuthResultCode,
      AuthResultMsg,
      AuthToken,
      TID,
      MID,
      Amt,
      NextAppURL,
      Moid,
      BuyerName,
      BuyerTel,
      GoodsName,
    } = body as any;

    const origin = req.nextUrl.origin;
    const isAuthSuccess = AuthResultCode === '0000';

    if (!isAuthSuccess || !AuthToken || !TID) {
      return new NextResponse(
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

    const mid = MID || NICEPAY_CONFIG.MID;
    const signKey = NICEPAY_CONFIG.SIGN_KEY;

    const now = new Date();
    const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
    const ediDate =
      kst.getFullYear() +
      String(kst.getMonth() + 1).padStart(2, '0') +
      String(kst.getDate()).padStart(2, '0') +
      String(kst.getHours()).padStart(2, '0') +
      String(kst.getMinutes()).padStart(2, '0') +
      String(kst.getSeconds()).padStart(2, '0');

    // SHA256(AuthToken + MID + Amt + EdiDate + SignKey)
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
    } catch (e) {
      console.error(e);
    }

    const cardName = approveData.CardName || '신용카드';
    const appNo = approveData.AppNo || '승인완료';
    const finalAmount = parseInt(approveData.Amt || Amt || '0', 10);

    // Discord Alert
    await sendOrderAlert({
      orderId: Moid,
      customerName: BuyerName || '고객',
      customerPhone: BuyerTel || '연락처 미기재',
      items: [{ name: GoodsName || '카노카노 상품', quantity: 1, price: finalAmount }],
      totalAmount: finalAmount,
      deliveryFee: 0,
      address: '배송지 정보 확인 필요',
      paymentMethod: `나이스페이 ${cardName} (승인: ${appNo})`,
      paymentKey: TID,
    });

    const successUrl = `${origin}/order-success?orderId=${Moid}&paymentKey=${TID}&amount=${finalAmount}&paymentMethod=NICEPAY`;
    return new NextResponse(
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
    return new NextResponse(`Server Error: ${error.message}`, { status: 500 });
  }
}
