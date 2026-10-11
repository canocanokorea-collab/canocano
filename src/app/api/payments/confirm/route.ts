import { NextRequest, NextResponse } from 'next/server';
import { sendOrderAlert } from '@/lib/discord';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentKey, orderId, amount, orderInfo } = body;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: '결제 승인 요청 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const customerName = orderInfo?.customerName || '고객';
    const customerPhone = orderInfo?.customerPhone || '연락처 미기재';
    const address = orderInfo?.addressMain
      ? `${orderInfo.addressMain} ${orderInfo.addressDetail || ''}`
      : '주소 미기재';
    const items = orderInfo?.items || [{ name: '카노카노 주문 상품', quantity: 1, price: amount }];
    const deliveryFee = orderInfo?.deliveryFee || 0;

    // 디스코드 #주문-결제-내역 채널로 알림 발송
    await sendOrderAlert({
      orderId,
      customerName,
      customerPhone,
      items,
      totalAmount: amount,
      deliveryFee,
      address,
      paymentMethod: '토스페이/카드 (승인)',
      paymentKey,
    });

    return NextResponse.json({
      success: true,
      message: '결제가 정상 승인되었습니다.',
      order: {
        orderId,
        amount,
        customerName,
        customerPhone,
        addressMain: orderInfo?.addressMain,
        addressDetail: orderInfo?.addressDetail,
        paymentKey,
        approvedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[API /api/payments/confirm Server Error]', error);

    return NextResponse.json(
      { success: false, error: error.message || '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
