import { NextRequest, NextResponse } from "next/server";
import { OrderRecord } from "@/app/api/admin/orders/route";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, name, phone } = body;

    const trimmedOrderId = (orderId || "").trim();
    const trimmedName = (name || "").trim();
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "");

    if (!trimmedOrderId && (!trimmedName || !cleanPhone)) {
      return NextResponse.json(
        { success: false, error: "주문번호 또는 [주문자명 + 연락처]를 입력해주세요." },
        { status: 400 }
      );
    }

    const allOrders: OrderRecord[] = globalThis.__CANO_ORDERS_STORE__ || [];

    const matchedOrders = allOrders.filter((o) => {
      // 1. 주문번호로 검색
      if (trimmedOrderId && o.orderId.toLowerCase() === trimmedOrderId.toLowerCase()) {
        return true;
      }

      // 2. 주문자명 + 연락처로 검색
      if (trimmedName && cleanPhone) {
        const orderPhoneClean = (o.customerPhone || "").replace(/[^0-9]/g, "");
        const isNameMatch = o.customerName.trim().toLowerCase() === trimmedName.toLowerCase();
        const isPhoneMatch = orderPhoneClean.includes(cleanPhone) || cleanPhone.includes(orderPhoneClean);
        return isNameMatch && isPhoneMatch;
      }

      return false;
    });

    return NextResponse.json({
      success: true,
      orders: matchedOrders,
      count: matchedOrders.length,
    });
  } catch (err: any) {
    console.error("[Order Lookup API Error]", err);
    return NextResponse.json(
      { success: false, error: "주문 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
