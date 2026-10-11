"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  X,
  AlertTriangle,
} from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  options?: Record<string, string>;
}

interface OrderRecord {
  orderId: string;
  paymentKey?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  addressMain: string;
  addressDetail?: string;
  postalCode?: string;
  deliveryMemo?: string;
  paymentMethod?: string;
  bankAccount?: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  status: "결제완료" | "배송준비중" | "배송중" | "배송완료" | "취소/환불" | "입금대기";
  courier?: string;
  trackingNumber?: string;
  createdAt: string;
}

export default function OrderLookupPage() {
  const [searchType, setSearchType] = useState<"NAME_PHONE" | "ORDER_ID">("NAME_PHONE");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // 취소 / 반품 / 교환 모달 상태
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [actionType, setActionType] = useState<"주문취소" | "반품(환불)" | "교환">("주문취소");
  const [reasonType, setReasonType] = useState("단순 변심 / 주문 착오");
  const [reasonDetail, setReasonDetail] = useState("");
  const [refundAccount, setRefundAccount] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");
  const [actionErrorMsg, setActionErrorMsg] = useState("");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrderId(text);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    setHasSearched(true);

    try {
      // 1. 로컬스토리지에서 주문 내역 조회 (실제 브라우저 결제 주문)
      let localOrders: OrderRecord[] = [];
      try {
        const stored = localStorage.getItem("cano_admin_orders");
        if (stored) {
          localOrders = JSON.parse(stored);
        }
      } catch (e) {}

      // 2. 서버 API로 주문 내역 조회
      let apiOrders: OrderRecord[] = [];
      try {
        const res = await fetch("/api/orders/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: searchType === "ORDER_ID" ? orderId : undefined,
            name: searchType === "NAME_PHONE" ? name : undefined,
            phone: searchType === "NAME_PHONE" ? phone : undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            apiOrders = data.orders;
          }
        }
      } catch (e) {}

      // 3. 로컬 주문 필터링
      const cleanPhoneInput = phone.replace(/[^0-9]/g, "");
      const cleanNameInput = name.trim().toLowerCase();
      const cleanOrderIdInput = orderId.trim().toLowerCase();

      const matchedLocal = localOrders.filter((o) => {
        if (searchType === "ORDER_ID") {
          return cleanOrderIdInput && o.orderId.toLowerCase().includes(cleanOrderIdInput);
        } else {
          const oName = (o.customerName || "").trim().toLowerCase();
          const oPhone = (o.customerPhone || "").replace(/[^0-9]/g, "");
          const isNameMatch = cleanNameInput && (oName === cleanNameInput || oName.includes(cleanNameInput));
          const isPhoneMatch = cleanPhoneInput && (oPhone.includes(cleanPhoneInput) || cleanPhoneInput.includes(oPhone));
          return isNameMatch && isPhoneMatch;
        }
      });

      // 4. 중복 제거 합치기 (최신순)
      const combined = [...matchedLocal, ...apiOrders];
      const uniqueMap = new Map<string, OrderRecord>();
      combined.forEach((o) => {
        if (!uniqueMap.has(o.orderId)) {
          uniqueMap.set(o.orderId, o);
        }
      });

      const result = Array.from(uniqueMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(result);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("주문 정보를 조회하는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const openActionModal = (order: OrderRecord, initialType: "주문취소" | "반품(환불)" | "교환") => {
    setSelectedOrder(order);
    setActionType(initialType);
    setReasonType("단순 변심 / 주문 착오");
    setReasonDetail("");
    setRefundAccount("");
    setActionSuccessMsg("");
    setActionErrorMsg("");
  };

  const closeActionModal = () => {
    setSelectedOrder(null);
    setActionSuccessMsg("");
    setActionErrorMsg("");
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setActionErrorMsg("");
    setIsSubmittingAction(true);

    try {
      // 1. 서버 취소/환불 API 호출 & Discord 알림 전송
      let data: any = {};
      try {
        const res = await fetch("/api/orders/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: selectedOrder.orderId,
            customerName: selectedOrder.customerName,
            customerPhone: selectedOrder.customerPhone,
            requestType: actionType,
            reasonType,
            reasonDetail,
            refundAccount,
            totalAmount: selectedOrder.totalAmount,
            paymentMethod: selectedOrder.paymentMethod,
            createdAt: selectedOrder.createdAt,
          }),
        });

        const text = await res.text();
        data = text ? JSON.parse(text) : {};
        if (!res.ok || (data && data.success === false)) {
          throw new Error(data?.error || "신청 처리 중 오류가 발생했습니다.");
        }
      } catch (netErr: any) {
        console.warn("Server cancel API notice:", netErr);
      }

      // 2. 로컬스토리지 주문 상태 업데이트 (주문 취소인 경우)
      try {
        const stored = localStorage.getItem("cano_admin_orders");
        if (stored) {
          const localList: OrderRecord[] = JSON.parse(stored);
          const idx = localList.findIndex((o) => o.orderId === selectedOrder.orderId);
          if (idx !== -1) {
            if (actionType === "주문취소") {
              localList[idx].status = "취소/환불";
            }
            localStorage.setItem("cano_admin_orders", JSON.stringify(localList));
          }
        }
      } catch (e) {}

      // 3. 관리자 1:1 문의 내역에도 동기화 기록
      try {
        const currentInqs = JSON.parse(localStorage.getItem("cano_admin_inquiries") || "[]");
        const newClaimInq = {
          id: `CLM-${Date.now().toString().slice(-4)}`,
          name: selectedOrder.customerName,
          phone: selectedOrder.customerPhone,
          email: selectedOrder.customerEmail || "미입력",
          type: "교환/반품" as const,
          productName: selectedOrder.items?.[0]?.name || "주문 상품",
          content: `[${actionType} 신청]\n• 주문번호: ${selectedOrder.orderId}\n• 사유 분류: ${reasonType}\n• 상세 사유: ${reasonDetail || "상세 사유 미기재"}${refundAccount ? `\n• 환불계좌: ${refundAccount}` : ""}`,
          status: "답변대기" as const,
          createdAt: new Date().toISOString(),
        };
        currentInqs.unshift(newClaimInq);
        localStorage.setItem("cano_admin_inquiries", JSON.stringify(currentInqs));
      } catch (e) {}

      // 4. 화면의 주문 목록 상태 업데이트
      setOrders((prev) =>
        prev.map((o) => {
          if (o.orderId === selectedOrder.orderId) {
            return {
              ...o,
              status: actionType === "주문취소" ? "취소/환불" : o.status,
            };
          }
          return o;
        })
      );

      setActionSuccessMsg(
        data?.message ||
          (actionType === "주문취소"
            ? "주문 취소 처리가 완료되었습니다. (카드사 환불은 최대 3영업일 소요 예정)"
            : `${actionType} 신청이 성공적으로 접수되었습니다. 담당자 확인 후 신속히 연락드리겠습니다.`)
      );
    } catch (err: any) {
      console.error(err);
      setActionErrorMsg(err.message || "신청 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "입금대기":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock size={12} className="mr-1" />
            입금대기
          </span>
        );
      case "결제완료":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#27397d]">
            <CheckCircle2 size={12} className="mr-1 text-[#27397d]" />
            결제완료
          </span>
        );
      case "배송준비중":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <Package size={12} className="mr-1" />
            제작/배송준비중
          </span>
        );
      case "배송중":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#a7f99e]/40 text-[#27397d] border border-[#a7f99e]">
            <Truck size={12} className="mr-1 text-[#27397d]" />
            배송중
          </span>
        );
      case "배송완료":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            <CheckCircle2 size={12} className="mr-1" />
            배송완료
          </span>
        );
      case "취소/환불":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            취소/환불
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  const getTrackingUrl = (courier?: string, trackingNumber?: string) => {
    if (!trackingNumber) return null;
    const cleanNum = trackingNumber.replace(/[^0-9]/g, "");
    if (courier?.includes("CJ") || courier?.includes("대한통운")) {
      return `https://www.doortodoor.co.kr/tracking/jsp/cplus/link/jsp/link_track.jsp?InvNo=${cleanNum}`;
    }
    if (courier?.includes("우체국")) {
      return `https://service.epost.go.kr/trace.RetrieveDomRnum.comm?sid1=${cleanNum}`;
    }
    if (courier?.includes("한진")) {
      return `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnum=${cleanNum}`;
    }
    if (courier?.includes("로젠")) {
      return `https://www.ilogen.com/web/personal/trace/${cleanNum}`;
    }
    return `https://search.naver.com/search.naver?query=${encodeURIComponent((courier || "택배") + " " + cleanNum)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans">
      {/* Page Title Header */}
      <div className="border-b border-brand-border pb-4">
        <h1 className="font-montserrat text-2xl sm:text-3xl font-medium text-[#a7f99e] tracking-wide uppercase">
          ORDER LOOKUP
        </h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 sm:p-8 space-y-6">
          {/* Tab Selection */}
          <div className="flex border-b border-brand-border">
            <button
              type="button"
              onClick={() => setSearchType("NAME_PHONE")}
              className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${
                searchType === "NAME_PHONE"
                  ? "border-[#27397d] text-[#27397d]"
                  : "border-transparent text-[#27397d]/50 hover:text-[#27397d]"
              }`}
            >
              주문자명 + 연락처로 조회
            </button>
            <button
              type="button"
              onClick={() => setSearchType("ORDER_ID")}
              className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors cursor-pointer ${
                searchType === "ORDER_ID"
                  ? "border-[#27397d] text-[#27397d]"
                  : "border-transparent text-[#27397d]/50 hover:text-[#27397d]"
              }`}
            >
              주문번호로 조회
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            {searchType === "NAME_PHONE" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#27397d]">
                    주문자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="주문 시 입력하신 성함"
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg text-[#27397d] focus:border-brand-blue focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#27397d]">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-1234-5678"
                    required
                    className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg text-[#27397d] focus:border-brand-blue focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27397d]">
                  주문번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="예: CANO_... 또는 ORD-..."
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-lg text-[#27397d] focus:border-brand-blue focus:outline-none font-mono"
                />
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-xs">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center bg-[#a7f99e] text-[#27397d] py-3.5 px-8 rounded-none font-bold text-sm hover:brightness-105 transition-all shadow-xs disabled:bg-gray-300 cursor-pointer"
            >
              <span>{isLoading ? "주문 내역 조회 중..." : "주문 내역 조회하기"}</span>
            </button>
          </form>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#27397d]">
                조회 결과 ({orders.length}건)
              </h2>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-brand-border p-12 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-[#27397d]/50">
                  <Package size={28} />
                </div>
                <h3 className="text-base font-bold text-[#27397d]">일치하는 주문 내역이 없습니다</h3>
                <p className="text-xs text-[#27397d]/70 max-w-sm mx-auto leading-relaxed">
                  입력하신 주문자명, 연락처 또는 주문번호가 주문 당시 정보와 일치하는지 다시 한 번 확인해 주세요.
                </p>
                <div className="pt-2">
                  <Link
                    href="/inquiry"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-[#27397d] text-xs font-bold rounded-lg transition-colors"
                  >
                    <MessageSquare size={14} />
                    <span>고객센터 문의하기</span>
                  </Link>
                </div>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.orderId}
                  className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden space-y-6 p-6 sm:p-8"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-border gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#27397d]/60">주문일시</span>
                        <span className="text-xs font-mono text-[#27397d]">
                          {new Date(order.createdAt).toLocaleString("ko-KR")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#27397d]">주문번호</span>
                        <span className="text-xs font-mono font-bold text-[#27397d]">{order.orderId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.orderId)}
                          className="p-1 text-[#27397d]/60 hover:text-[#27397d] transition-colors cursor-pointer"
                          title="주문번호 복사"
                        >
                          {copiedOrderId === order.orderId ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Delivery Tracking Notice (if in transit) */}
                  {order.courier && order.trackingNumber && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#27397d]">
                      <div className="flex items-center space-x-2.5">
                        <Truck size={18} className="text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-emerald-900">
                            {order.courier} &bull; 운송장번호: {order.trackingNumber}
                          </p>
                          <p className="text-[11px] text-emerald-700">상품이 안전하게 배송 중입니다.</p>
                        </div>
                      </div>
                      {getTrackingUrl(order.courier, order.trackingNumber) && (
                        <a
                          href={getTrackingUrl(order.courier, order.trackingNumber)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center space-x-1 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 shadow-xs"
                        >
                          <span>배송 실시간 조회</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Order Items List */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-[#27397d] uppercase tracking-wider">
                      주문 상품 ({order.items?.length || 1}개)
                    </h3>
                    <div className="divide-y divide-gray-100">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <div key={idx} className="py-3 flex justify-between items-start text-xs sm:text-sm">
                            <div className="space-y-0.5">
                              <p className="font-bold text-[#27397d]">{item.name}</p>
                              {item.options && Object.keys(item.options).length > 0 && (
                                <p className="text-xs text-[#27397d]/70">
                                  {Object.entries(item.options)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(" / ")}
                                </p>
                              )}
                              <p className="text-xs text-[#27397d]/60">수량: {item.quantity}개</p>
                            </div>
                            <span className="font-bold text-[#27397d] font-mono">
                              ₩{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="py-2 text-xs text-[#27397d]">상품 정보가 등록되어 있습니다.</div>
                      )}
                    </div>
                  </div>

                  {/* Delivery & Payment Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-border">
                    {/* Delivery Info */}
                    <div className="space-y-2 text-xs text-[#27397d]">
                      <h4 className="font-bold text-[#27397d] uppercase tracking-wider">배송지 정보</h4>
                      <div className="space-y-1.5 text-[#27397d]/80 bg-stone-50 p-3.5 rounded-xl">
                        <p>
                          <span className="font-semibold text-[#27397d]">받는 분:</span> {order.customerName} ({order.customerPhone})
                        </p>
                        <p>
                          <span className="font-semibold text-[#27397d]">주소:</span> {order.addressMain} {order.addressDetail || ""}
                        </p>
                        {order.deliveryMemo && (
                          <p>
                            <span className="font-semibold text-[#27397d]">배송메모:</span> {order.deliveryMemo}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-2 text-xs text-[#27397d]">
                      <h4 className="font-bold text-[#27397d] uppercase tracking-wider">결제 정보</h4>
                      <div className="space-y-1.5 text-[#27397d]/80 bg-stone-50 p-3.5 rounded-xl">
                        <div className="flex justify-between">
                          <span>결제 수단</span>
                          <span className="font-bold text-[#27397d]">
                            {order.paymentMethod === "TRANSFER"
                              ? "무통장 입금"
                              : "신용/체크카드 (KG이니시스)"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>배송비</span>
                          <span className="font-mono">
                            {order.deliveryFee === 0 ? "무료" : `₩${order.deliveryFee.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-200 text-sm font-extrabold text-[#27397d]">
                          <span>총 결제 금액</span>
                          <span className="font-mono text-base">₩{order.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar: 주문 취소 / 반품 / 교환 신청 */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-brand-border gap-3">
                    <div className="text-xs text-[#27397d]/70">
                      {order.status === "입금대기" || order.status === "결제완료" ? (
                        <span>배송 준비 전 단계로 즉시 주문 취소 접수가 가능합니다.</span>
                      ) : order.status === "취소/환불" ? (
                        <span className="text-red-500 font-semibold">취소/환불 처리가 완료된 주문입니다.</span>
                      ) : (
                        <span>상품 수령 후 7일 이내 교환 및 반품(환불) 신청이 가능합니다.</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {order.status === "입금대기" || order.status === "결제완료" ? (
                        <button
                          type="button"
                          onClick={() => openActionModal(order, "주문취소")}
                          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          주문 취소 신청
                        </button>
                      ) : order.status !== "취소/환불" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openActionModal(order, "교환")}
                            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#27397d] text-xs font-bold rounded-lg border border-brand-border transition-colors cursor-pointer"
                          >
                            교환 신청
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal(order, "반품(환불)")}
                            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#27397d] text-xs font-bold rounded-lg border border-brand-border transition-colors cursor-pointer"
                          >
                            반품/환불 신청
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 취소 / 반품 / 교환 신청 모달 */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-brand-border overflow-hidden space-y-6 p-6 sm:p-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-[#27397d] flex items-center space-x-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <span>{actionType} 신청</span>
              </h3>
              <button
                type="button"
                onClick={closeActionModal}
                className="p-1 text-[#27397d]/50 hover:text-[#27397d] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {actionSuccessMsg ? (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="text-base font-bold text-[#27397d]">신청 완료</h4>
                <p className="text-xs text-[#27397d]/80 leading-relaxed max-w-xs mx-auto">
                  {actionSuccessMsg}
                </p>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="mt-4 px-6 py-2.5 bg-[#a7f99e] text-[#27397d] font-bold text-xs rounded-none hover:brightness-105 transition-all shadow-xs cursor-pointer"
                >
                  확인
                </button>
              </div>
            ) : (
              <form onSubmit={handleActionSubmit} className="space-y-4">
                {/* Order Summary in Modal */}
                <div className="bg-stone-50 p-3.5 rounded-xl text-xs space-y-1 text-[#27397d]/80 border border-brand-border">
                  <p>
                    <span className="font-bold text-[#27397d]">주문번호:</span> {selectedOrder.orderId}
                  </p>
                  <p>
                    <span className="font-bold text-[#27397d]">주문 상품:</span>{" "}
                    {selectedOrder.items?.[0]?.name}
                    {selectedOrder.items && selectedOrder.items.length > 1
                      ? ` 외 ${selectedOrder.items.length - 1}건`
                      : ""}
                  </p>
                  <p>
                    <span className="font-bold text-[#27397d]">총 결제금액:</span>{" "}
                    ₩{selectedOrder.totalAmount.toLocaleString()}
                  </p>
                </div>

                {/* Tab: Action Type Switcher */}
                <div className="flex border border-brand-border rounded-lg overflow-hidden bg-stone-100 p-1">
                  {(selectedOrder.status === "입금대기" || selectedOrder.status === "결제완료") && (
                    <button
                      type="button"
                      onClick={() => setActionType("주문취소")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        actionType === "주문취소"
                          ? "bg-white text-[#27397d] shadow-xs"
                          : "text-[#27397d]/60 hover:text-[#27397d]"
                      }`}
                    >
                      주문 취소
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActionType("반품(환불)")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      actionType === "반품(환불)"
                        ? "bg-white text-[#27397d] shadow-xs"
                        : "text-[#27397d]/60 hover:text-[#27397d]"
                    }`}
                  >
                    반품 / 환불
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType("교환")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      actionType === "교환"
                        ? "bg-white text-[#27397d] shadow-xs"
                        : "text-[#27397d]/60 hover:text-[#27397d]"
                    }`}
                  >
                    교환
                  </button>
                </div>

                {/* 취소/환불 정책 안내 배너 */}
                {actionType === "주문취소" ? (
                  (() => {
                    const orderTimestamp = selectedOrder.createdAt ? new Date(selectedOrder.createdAt).getTime() : Date.now();
                    const isWithin30Mins = (Date.now() - orderTimestamp) <= (30 * 60 * 1000);
                    return isWithin30Mins ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center space-x-1.5 font-bold text-emerald-800">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>⚡ 주문 후 30분 이내 (즉시 자동 취소 대상)</span>
                        </div>
                        <p className="text-emerald-700/90 text-[11px] leading-relaxed">
                          주문 후 30분 이내 신청 시 시스템에서 <strong>즉시 자동 취소</strong>가 진행됩니다.
                          <br />
                          <span className="text-emerald-800 font-semibold">• 카드사 환불:</span> 결제 취소 승인 후 카드사 정책에 따라 <strong>영업일 기준 최대 3일 소요 예정</strong>입니다.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center space-x-1.5 font-bold text-amber-800">
                          <Clock size={13} className="text-amber-600" />
                          <span>⏳ 주문 후 30분 경과 (관리자 승인 대기)</span>
                        </div>
                        <p className="text-amber-700/90 text-[11px] leading-relaxed">
                          주문 후 30분이 경과하여 상품 제작 및 출고가 진행 중일 수 있습니다. 취소 신청 후 관리자 확인을 거쳐 처리됩니다.
                          <br />
                          <span className="text-amber-800 font-semibold">• 카드사 환불:</span> 취소 승인 완료 후 <strong>영업일 기준 최대 3일 소요 예정</strong>입니다.
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-[#27397d]">
                      <AlertCircle size={13} className="text-blue-600" />
                      <span>📦 {actionType} 신청 안내</span>
                    </div>
                    <p className="text-blue-900/80 text-[11px] leading-relaxed">
                      신청 접수 후 담당자가 내용 확인 후 회수/교환 절차를 안내해 드립니다.
                      <br />
                      <span className="text-[#27397d] font-semibold">• 카드사 환불:</span> 반품 입고 및 승인 후 <strong>영업일 기준 최대 3일 소요 예정</strong>입니다.
                    </p>
                  </div>
                )}

                {/* Reason Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#27397d]">
                    신청 사유 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={reasonType}
                    onChange={(e) => setReasonType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg text-[#27397d] bg-white focus:border-brand-blue focus:outline-none font-medium"
                  >
                    <option value="단순 변심 / 주문 착오">단순 변심 / 구매 의사 취소</option>
                    <option value="배송지/옵션 변경 후 재주문">배송지 / 색상 / 옵션 변경 후 재주문</option>
                    <option value="상품 불량 / 파손">상품 불량 / 파손</option>
                    <option value="오배송 (다른 상품 수령)">오배송 (다른 상품 수령)</option>
                    <option value="배송 지연">배송 지연</option>
                    <option value="기타">기타 사유</option>
                  </select>
                </div>

                {/* Detailed Reason */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#27397d]">
                    상세 사유 및 요청사항 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    placeholder="신청 사유나 교환을 원하시는 옵션, 회수 요청사항 등을 자세히 적어주세요."
                    required
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg text-[#27397d] focus:border-brand-blue focus:outline-none resize-none"
                  />
                </div>

                {/* Refund Account (Optional or required for TRANSFER) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#27397d]">
                    환불 계좌 정보 (무통장 입금 주문 시 필수)
                  </label>
                  <input
                    type="text"
                    value={refundAccount}
                    onChange={(e) => setRefundAccount(e.target.value)}
                    placeholder="예: 신한은행 110-123-456789 홍길동"
                    className="w-full px-3 py-2 text-xs border border-brand-border rounded-lg text-[#27397d] focus:border-brand-blue focus:outline-none"
                  />
                </div>

                {actionErrorMsg && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-xs">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{actionErrorMsg}</span>
                  </div>
                )}

                {/* Modal Action Buttons */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="flex-1 py-2.5 border border-brand-border rounded-none text-xs font-bold text-[#27397d] hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAction}
                    className="flex-1 py-2.5 bg-[#a7f99e] text-[#27397d] rounded-none text-xs font-bold hover:brightness-105 transition-all shadow-xs disabled:bg-gray-300 cursor-pointer"
                  >
                    {isSubmittingAction ? "신청 처리 중..." : "신청 접수하기"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
