import { NextRequest, NextResponse } from "next/server";
import { sendCancelRequestAlert, sendErrorAlert } from "@/lib/discord";
import { OrderRecord } from "@/app/api/admin/orders/route";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      customerName,
      customerPhone,
      requestType,
      reasonType,
      reasonDetail,
      refundAccount,
      totalAmount,
    } = body;

    if (!orderId || !customerName || !requestType || !reasonType) {
      return NextResponse.json(
        { success: false, error: "필수 정보(주문번호, 고객명, 신청유형, 사유)가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 서버 메모리 내 주문 상태 업데이트
    const allOrders: OrderRecord[] = globalThis.__CANO_ORDERS_STORE__ || [];
    const targetOrder = allOrders.find((o) => o.orderId.toLowerCase() === orderId.toLowerCase());
    if (targetOrder) {
      if (requestType === "주문취소") {
        targetOrder.status = "취소/환불";
      }
    }

    // Discord 실시간 알림 발송
    await sendCancelRequestAlert({
      orderId,
      customerName,
      customerPhone: customerPhone || targetOrder?.customerPhone || "",
      requestType,
      reasonType,
      reasonDetail: reasonDetail || "",
      refundAccount: refundAccount || "",
      totalAmount: totalAmount || targetOrder?.totalAmount || 0,
    });

    return NextResponse.json({
      success: true,
      message: `${requestType} 신청이 정상적으로 접수되었습니다.`,
    });
  } catch (error: any) {
    console.error("[API /api/orders/cancel Error]", error);
    await sendErrorAlert({
      location: "POST /api/orders/cancel",
      errorMessage: error.message || String(error),
      actionHint: "주문 취소/반품/교환 API 처리 중 오류 발생",
    });

    return NextResponse.json(
      { success: false, error: "요청 처리 중 오류가 발생했습니다. 고객센터로 문의해주세요." },
      { status: 500 }
    );
  }
}
