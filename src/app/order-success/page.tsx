'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CheckCircle2, AlertTriangle, Home, ShoppingBag } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const paymentMethod = searchParams.get('paymentMethod');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const hasProcessedRef = React.useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    // 1. 포트원, 나이스페이 또는 무통장 입금의 경우 즉시 완료 처리
    if (paymentMethod === 'TRANSFER' || paymentMethod === 'NICEPAY' || paymentMethod === 'PORTONE') {
      setLoading(false);
      setSuccess(true);
      clearCart();
      const storedPending = localStorage.getItem(`order_pending_${orderId}`);
      if (storedPending) {
        setOrderData(JSON.parse(storedPending));
        localStorage.removeItem(`order_pending_${orderId}`);
      }
      return;
    }

    async function confirm() {
      if (!paymentKey || !orderId || !amount) {
        setLoading(false);
        setErrorMessage('결제 승인 정보가 올바르지 않습니다.');
        return;
      }

      // 로컬스토리지에서 보관된 주문 정보 조회
      const storedPending = localStorage.getItem(`order_pending_${orderId}`);
      const parsedOrder = storedPending ? JSON.parse(storedPending) : null;

      try {
        const res = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount, 10),
            orderInfo: parsedOrder,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setSuccess(true);
          setOrderData(data.order || parsedOrder);
          clearCart();
          localStorage.removeItem(`order_pending_${orderId}`);

          // 실제 주문 내역을 관리자 저장소에 저장
          try {
            const currentOrders = JSON.parse(localStorage.getItem('cano_admin_orders') || '[]');
            // 이미 등록된 orderId인지 체크
            if (!currentOrders.some((o: any) => o.orderId === orderId)) {
              const newRealOrder = {
                orderId,
                paymentKey,
                customerName: parsedOrder?.customerName || '고객',
                customerPhone: parsedOrder?.customerPhone || '연락처 미기재',
                customerEmail: parsedOrder?.customerEmail || '',
                addressMain: parsedOrder?.addressMain || '주소 미기재',
                addressDetail: parsedOrder?.addressDetail || '',
                postalCode: parsedOrder?.postalCode || '',
                deliveryMemo: parsedOrder?.deliveryMemo || '',
                items: parsedOrder?.items || [{ name: '카노카노 주문 상품', quantity: 1, price: parseInt(amount, 10) }],
                totalAmount: parseInt(amount, 10),
                deliveryFee: parsedOrder?.deliveryFee || 0,
                status: '결제완료',
                createdAt: new Date().toISOString(),
              };
              currentOrders.unshift(newRealOrder);
              localStorage.setItem('cano_admin_orders', JSON.stringify(currentOrders));
            }
          } catch (e) {
            console.error('Failed to sync real order to admin store', e);
          }
        } else {
          setSuccess(false);
          setErrorMessage(data.error || '결제 승인에 실패하였습니다.');
        }
      } catch (err: any) {
        console.error('Payment confirm exception:', err);
        setSuccess(false);
        setErrorMessage(err.message || '서버 통신 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    confirm();
  }, [paymentKey, orderId, amount]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-28 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#27397d] border-t-transparent rounded-full animate-spin mx-auto" />
        <h1 className="text-xl font-bold text-[#27397d]">결제 승인 처리 중...</h1>
        <p className="text-xs text-[#27397d]/70">잠시만 기다려주세요. 페이지를 닫지 마세요.</p>
      </div>
    );
  }

  if (!success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-2xl font-extrabold text-[#27397d]">결제 승인 실패</h1>
        <p className="text-sm text-red-600 font-medium bg-red-50 p-4 rounded-lg">
          {errorMessage}
        </p>
        <div className="flex justify-center space-x-3">
          <Link
            href="/checkout"
            className="px-6 py-2.5 bg-[#27397d] text-white rounded-md text-sm font-semibold hover:brightness-110"
          >
            다시 결제하기
          </Link>
          <Link
            href="/cart"
            className="px-6 py-2.5 bg-stone-100 text-[#27397d] rounded-md text-sm font-semibold hover:bg-stone-200"
          >
            장바구니로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} />
        </div>
        <span className="text-xs font-bold text-[#27397d] bg-[#a7f99e] px-3 py-1 rounded-full uppercase tracking-wider">
          Payment Completed
        </span>
        <h1 className="text-3xl font-extrabold text-[#27397d]">
          주문 및 결제가 완료되었습니다!
        </h1>
        <p className="text-sm text-[#27397d]/80">
          주문번호 <strong className="text-[#27397d] underline">{orderId}</strong>로 정상 접수되었습니다.
        </p>
      </div>

      {/* Order Receipt Card */}
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-brand-border space-y-6 shadow-sm">
        <h2 className="text-base font-bold text-[#27397d] border-b border-brand-border pb-3">
          결제 및 배송 정보
        </h2>

        <div className="space-y-3 text-sm text-[#27397d]">
          <div className="flex justify-between">
            <span className="text-[#27397d]/70">주문번호</span>
            <span className="font-semibold text-[#27397d]">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#27397d]/70">결제 금액</span>
            <span className="text-lg font-bold text-[#27397d] font-mono">
              ₩{parseInt(amount || '0', 10).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#27397d]/70">결제 승인 키</span>
            <span className="text-xs font-mono text-[#27397d]/60 truncate max-w-[240px]">
              {paymentKey}
            </span>
          </div>
          {orderData?.customerName && (
            <div className="flex justify-between">
              <span className="text-[#27397d]/70">받는 분</span>
              <span className="font-medium text-[#27397d]">
                {orderData.customerName} ({orderData.customerPhone})
              </span>
            </div>
          )}
          {orderData?.addressMain && (
            <div className="flex justify-between items-start">
              <span className="text-[#27397d]/70 shrink-0">배송지</span>
              <span className="font-medium text-[#27397d] text-right">
                {orderData.addressMain} {orderData.addressDetail || ''}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 bg-blue-50/40 rounded-lg text-xs text-[#27397d] space-y-1 border border-blue-100">
          <p className="font-bold text-[#27397d]">• 제작 및 배송 안내</p>
          <p className="text-[#27397d]/80 leading-relaxed">
            카노카노는 정성껏 완제품으로 제작하여 발송해 드립니다 (제작 기간 약 1주일 소요).
            배송 시작 시 안내 문자가 발송됩니다.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-[#a7f99e] text-[#27397d] rounded-none text-sm font-bold hover:brightness-105 transition-all flex items-center justify-center space-x-2 shadow-xs"
        >
          <Home size={16} className="text-[#27397d]" />
          <span>홈으로 돌아가기</span>
        </Link>
        <Link
          href="/shop"
          className="px-6 py-3 bg-white border-2 border-[#a7f99e] text-[#27397d] rounded-none text-sm font-bold hover:bg-[#a7f99e]/20 transition-colors flex items-center justify-center space-x-2"
        >
          <ShoppingBag size={16} className="text-[#27397d]" />
          <span>계속 쇼핑하기</span>
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-24 text-sm text-[#27397d]/50">Loading order result...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
