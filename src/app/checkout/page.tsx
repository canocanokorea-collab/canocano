'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import * as PortOne from '@portone/browser-sdk/v2';
import DaumPostcode from 'react-daum-postcode';
import {
  ShieldCheck,
  AlertCircle,
  Building,
  CreditCard,
  Copy,
  Check,
  Search,
  X,
} from 'lucide-react';

type PaymentMethodType = 'CARD' | 'TRANSFER';

const PORTONE_STORE_ID =
  process.env.NEXT_PUBLIC_PORTONE_STORE_ID || 'store-2b0f7f10-10e4-4244-b395-994df5f5e562';
const PORTONE_CHANNEL_KEY =
  process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || 'channel-key-e0390461-734f-4091-a885-b9904ff01af5';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalProductPrice, deliveryFee, finalPrice, clearCart } = useCart();

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    postalCode: '',
    addressMain: '',
    addressDetail: '',
    deliveryMemo: '문 앞에 놓아주세요.',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CARD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);

  const handleCompletePostcode = (data: any) => {
    let fullAddress = data.roadAddress || data.jibunAddress || '';
    let extraAddress = '';

    if (data.addressType === 'R') {
      if (data.bname !== '') {
        extraAddress += data.bname;
      }
      if (data.buildingName !== '') {
        extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
    }

    setForm((prev) => ({
      ...prev,
      postalCode: data.zonecode,
      addressMain: fullAddress,
    }));
    setIsPostcodeOpen(false);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="text-xl font-bold text-[#27397d]">주문할 상품이 없습니다</h1>
        <p className="text-sm text-[#27397d]/70">장바구니에 상품을 먼저 담아주세요.</p>
        <button
          onClick={() => router.push('/shop')}
          className="mt-4 px-6 py-2.5 bg-[#a7f99e] text-[#27397d] font-bold rounded-none text-sm hover:brightness-105 cursor-pointer"
        >
          쇼핑하러 가기
        </button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const copyAccount = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText('638701-01-516924');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.customerName || !form.customerPhone || !form.addressMain) {
      setErrorMessage('주문자 성함, 연락처, 주소를 모두 입력해주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Unique Order ID 생성
      const orderId = `CANO_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const orderName =
        cart.length === 1
          ? cart[0].product.name
          : `${cart[0].product.name} 외 ${cart.length - 1}건`;

      // 2. Local Storage에 임시 주문 정보 보관
      const orderPayload = {
        orderId,
        orderName,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        postalCode: form.postalCode,
        addressMain: form.addressMain,
        addressDetail: form.addressDetail,
        deliveryMemo: form.deliveryMemo,
        paymentMethod,
        bankAccount: '국민은행 638701-01-516924 이형지(카노카노)',
        items: cart.map((c) => ({
          productId: c.productId,
          name: c.product.name,
          options: c.selectedOptions,
          quantity: c.quantity,
          price: c.unitPrice,
        })),
        totalAmount: finalPrice,
        deliveryFee,
        status: paymentMethod === 'TRANSFER' ? '입금대기' : 'READY',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(`order_pending_${orderId}`, JSON.stringify(orderPayload));

      // 3-A. 무통장 입금 (TRANSFER)
      if (paymentMethod === 'TRANSFER') {
        // Discord 실시간 알림 발송
        fetch(
          'https://discord.com/api/webhooks/1538823882524463114/xB_VnnYl_DEJpuCrzOTYxYrLvEcFoipRSwANNAd7TxlGuRSDrfa-lWspTEaKLZ7s4_pW',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: '🎉 **[카노카노] 신규 무통장 입금 주문이 접수되었습니다!**',
              embeds: [
                {
                  title: '🛍️ [무통장 입금 주문] 신규 주문 접수 (입금대기)',
                  color: 3447003,
                  fields: [
                    { name: '🧾 주문번호', value: `\`${orderId}\``, inline: true },
                    { name: '💳 결제수단', value: '무통장 입금 (국민 638701-01-516924)', inline: true },
                    { name: '👤 구매자', value: `${form.customerName} (${form.customerPhone})`, inline: true },
                    {
                      name: '💵 입금 예정 금액',
                      value: `**₩${finalPrice.toLocaleString()}** (배송비 ₩${deliveryFee.toLocaleString()} 포함)`,
                      inline: true,
                    },
                    { name: '📦 주문 상품', value: orderName, inline: false },
                    { name: '🏠 배송지', value: `${form.addressMain} ${form.addressDetail || ''}`, inline: false },
                    { name: '📝 배송 메모', value: form.deliveryMemo || '요청사항 없음', inline: false },
                  ],
                  footer: { text: 'CANO CANO Order Dispatcher • 무통장 입금' },
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
          }
        ).catch(() => {});

        // Save to Server KV & Local store
        try {
          fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload),
          }).catch(() => {});

          const currentOrders = JSON.parse(localStorage.getItem('cano_admin_orders') || '[]');
          currentOrders.unshift(orderPayload);
          localStorage.setItem('cano_admin_orders', JSON.stringify(currentOrders));
        } catch (e) {}

        clearCart();
        router.push(`/order-success?orderId=${orderId}&paymentMethod=TRANSFER&amount=${finalPrice}`);
        return;
      }

      // 3-B. 신용/체크카드 결제 (KG이니시스 - 포트원 V2 결제창)
      if (paymentMethod === 'CARD') {
        const response = await PortOne.requestPayment({
          storeId: PORTONE_STORE_ID,
          channelKey: PORTONE_CHANNEL_KEY,
          paymentId: orderId,
          orderName,
          totalAmount: finalPrice,
          currency: 'CURRENCY_KRW',
          payMethod: 'CARD',
          customer: {
            fullName: form.customerName,
            phoneNumber: form.customerPhone,
            email: form.customerEmail || 'cano_customer@canocano.shop',
            zipcode: form.postalCode || '',
            address: {
              addressLine1: form.addressMain,
              addressLine2: form.addressDetail || '',
            },
          },
          redirectUrl: `${window.location.origin}/order-success?orderId=${orderId}&paymentKey=${orderId}&amount=${finalPrice}&paymentMethod=PORTONE`,
        });

        // 사용자가 결제창을 닫았거나 결제 승인 오류가 발생한 경우
        if (response && response.code != null) {
          setIsProcessing(false);
          setErrorMessage(response.message || '결제가 취소되었거나 승인되지 않았습니다.');
          return;
        }

        // 결제 성공 시 디스코드 실시간 알림 발송
        fetch(
          'https://discord.com/api/webhooks/1538823882524463114/xB_VnnYl_DEJpuCrzOTYxYrLvEcFoipRSwANNAd7TxlGuRSDrfa-lWspTEaKLZ7s4_pW',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: '🎉 **[카노카노] 신규 카드 결제 주문이 완료되었습니다! (KG이니시스)**',
              embeds: [
                {
                  title: '🛍️ [카드 결제 완료] 신규 주문 승인',
                  color: 5763719,
                  fields: [
                    { name: '🧾 주문번호', value: `\`${orderId}\``, inline: true },
                    { name: '💳 결제수단', value: '신용/체크카드 (KG이니시스)', inline: true },
                    { name: '👤 구매자', value: `${form.customerName} (${form.customerPhone})`, inline: true },
                    {
                      name: '💵 결제 완료 금액',
                      value: `**₩${finalPrice.toLocaleString()}** (배송비 ₩${deliveryFee.toLocaleString()} 포함)`,
                      inline: true,
                    },
                    { name: '📦 주문 상품', value: orderName, inline: false },
                    { name: '🏠 배송지', value: `${form.addressMain} ${form.addressDetail || ''}`, inline: false },
                    { name: '📝 배송 메모', value: form.deliveryMemo || '요청사항 없음', inline: false },
                  ],
                  footer: { text: 'CANO CANO Order Dispatcher • KG이니시스 실결제' },
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
          }
        ).catch(() => {});

        const completedCardOrder = {
          ...orderPayload,
          paymentKey: response?.paymentId || orderId,
          status: '결제완료' as const,
        };

        // Save order to Server KV & Local store
        try {
          fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(completedCardOrder),
          }).catch(() => {});

          const currentOrders = JSON.parse(localStorage.getItem('cano_admin_orders') || '[]');
          currentOrders.unshift(completedCardOrder);
          localStorage.setItem('cano_admin_orders', JSON.stringify(currentOrders));
        } catch (e) {}

        clearCart();
        router.push(
          `/order-success?orderId=${orderId}&paymentKey=${response?.paymentId || orderId}&amount=${finalPrice}&paymentMethod=PORTONE`
        );
        return;
      }
    } catch (error: any) {
      console.error('[Checkout Error]', error);
      setIsProcessing(false);
      setErrorMessage(error.message || '결제 진행 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Title Header */}
      <div className="border-b border-brand-border pb-4">
        <h1 className="font-montserrat text-2xl sm:text-3xl font-medium text-[#a7f99e] tracking-wide uppercase">
          CHECKOUT
        </h1>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-700 text-sm">
          <AlertCircle size={20} className="shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Customer Information */}
          <div className="bg-white p-6 rounded-xl border border-brand-border space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-[#27397d] border-b border-brand-border pb-2">
              1. 주문자 정보
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27397d]">
                  주문자명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="홍길동"
                  required
                  className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] focus:border-[#27397d] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27397d]">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  required
                  className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] focus:border-[#27397d] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#27397d]">이메일 (주문 확인서 수신용)</label>
              <input
                type="email"
                name="customerEmail"
                value={form.customerEmail}
                onChange={handleChange}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] focus:border-[#27397d] focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Delivery Address */}
          <div className="bg-white p-6 rounded-xl border border-brand-border space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-[#27397d] border-b border-brand-border pb-2">
              2. 배송지 정보
            </h2>

            <div className="space-y-3">
              {/* Postal Code & Search Button */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27397d]">
                  우편번호 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="postalCode"
                    value={form.postalCode}
                    onChange={handleChange}
                    placeholder="12345"
                    readOnly
                    onClick={() => setIsPostcodeOpen(true)}
                    className="w-32 px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] bg-gray-50 focus:outline-none cursor-pointer font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPostcodeOpen(true)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-[#27397d] text-xs font-bold rounded-md transition-colors border border-gray-200 cursor-pointer flex items-center space-x-1.5"
                  >
                    <Search size={14} />
                    <span>도로명 주소 찾기</span>
                  </button>
                </div>
              </div>

              {/* Main Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27397d]">
                  기본 주소 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="addressMain"
                  value={form.addressMain}
                  onChange={handleChange}
                  onClick={() => {
                    if (!form.addressMain) setIsPostcodeOpen(true);
                  }}
                  placeholder="도로명 주소 (위 '도로명 주소 찾기' 버튼을 눌러 검색하세요)"
                  required
                  className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] focus:border-[#27397d] focus:outline-none"
                />
              </div>

              {/* Detail Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#27397d]">상세 주소 (선택)</label>
                <input
                  type="text"
                  name="addressDetail"
                  value={form.addressDetail}
                  onChange={handleChange}
                  placeholder="동/호수, 층수, 건물명 등 상세 정보 입력"
                  className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] focus:border-[#27397d] focus:outline-none"
                />
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-[#27397d]">배송 요청사항</label>
                <select
                  name="deliveryMemo"
                  value={form.deliveryMemo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] focus:border-[#27397d] focus:outline-none font-medium"
                >
                  <option value="문 앞에 놓아주세요.">문 앞에 놓아주세요.</option>
                  <option value="배송 전 미리 연락 바랍니다.">배송 전 미리 연락 바랍니다.</option>
                  <option value="부재 시 경비실에 맡겨주세요.">부재 시 경비실에 맡겨주세요.</option>
                  <option value="직접 수령하겠습니다.">직접 수령하겠습니다.</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Payment Method Selection */}
          <div className="bg-white p-6 rounded-xl border border-brand-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-brand-border pb-2">
              <h2 className="text-base font-bold text-[#27397d]">
                3. 결제 수단 선택
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Card */}
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-2 cursor-pointer ${
                  paymentMethod === 'CARD'
                    ? 'border-[#27397d] bg-blue-50/60 shadow-xs ring-2 ring-[#a7f99e]'
                    : 'border-brand-border bg-white hover:border-[#27397d]/40 hover:bg-blue-50/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    <CreditCard size={18} className="text-[#27397d]" />
                    <span className="text-sm font-bold text-[#27397d]">신용 / 체크카드</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#a7f99e] text-[#27397d]">
                    추천
                  </span>
                </div>
                <p className="text-xs text-[#27397d]/70 leading-tight">
                  국내 모든 신용/체크카드 지원
                </p>
              </button>

              {/* Option 2: 무통장 입금 */}
              <div
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-2 cursor-pointer ${
                  paymentMethod === 'TRANSFER'
                    ? 'border-[#27397d] bg-blue-50/60 shadow-xs ring-2 ring-[#a7f99e]'
                    : 'border-brand-border bg-white hover:border-[#27397d]/40 hover:bg-blue-50/20'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-2">
                    <Building size={18} className="text-[#27397d]" />
                    <span className="text-sm font-bold text-[#27397d]">무통장 입금</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => copyAccount(e)}
                    className="inline-flex items-center space-x-1 text-[10px] font-bold bg-[#a7f99e] text-[#27397d] px-2 py-0.5 rounded hover:brightness-105 transition-all shadow-xs shrink-0 cursor-pointer"
                    title="국민은행 계좌번호 복사"
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copied ? '복사완료!' : '계좌 복사'}</span>
                  </button>
                </div>
                <p className="text-xs text-[#27397d]/75 leading-tight">
                  국민 638701-01-516924 (카노카노)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Details Summary & Pay Button (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-xl border border-brand-border space-y-6 sticky top-28 shadow-xs">
          <h2 className="text-lg font-bold text-[#27397d] border-b border-brand-border pb-3">
            주문 상품 내역
          </h2>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between items-start text-xs text-[#27397d] py-1">
                <div>
                  <p className="font-bold text-[#27397d] line-clamp-1">{item.product.name}</p>
                  {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                    <p className="text-[#27397d]/70 mt-0.5">
                      {Object.entries(item.selectedOptions)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' / ')}{' '}
                      x {item.quantity}개
                    </p>
                  )}
                </div>
                <span className="font-semibold text-[#27397d] shrink-0 font-mono">
                  ₩{(item.unitPrice * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 pt-4 border-t border-brand-border text-sm text-[#27397d]/80">
            <div className="flex justify-between">
              <span>상품 총액</span>
              <span className="font-mono font-bold text-[#27397d]">
                ₩ {totalProductPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>배송비</span>
              <span className="font-mono text-[#27397d]">
                {deliveryFee === 0 ? '무료' : `+ ₩ ${deliveryFee.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-[#27397d] pt-3 border-t border-brand-border">
              <span>총 결제 예정 금액</span>
              <span className="font-mono text-xl text-[#27397d]">
                ₩ {finalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-[#a7f99e] text-[#27397d] py-4 px-6 rounded-none font-bold text-base hover:brightness-105 transition-all shadow-md disabled:bg-gray-400 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ShieldCheck size={20} className="text-[#27397d]" />
              <span>
                {isProcessing
                  ? '결제창을 여는 중...'
                  : paymentMethod === 'TRANSFER'
                  ? `₩ ${finalPrice.toLocaleString()} 무통장 주문 접수`
                  : `₩ ${finalPrice.toLocaleString()} 카드 결제하기`}
              </span>
            </button>
            <p className="text-center text-[11px] text-[#27397d]/60 mt-2">
              안전한 암호화 결제 시스템으로 보호됩니다.
            </p>
          </div>
        </div>
      </form>

      {/* Daum Postcode Search Modal */}
      {isPostcodeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-fadeIn">
            <div className="bg-[#27397d] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#a7f99e] flex items-center space-x-1.5">
                <Search size={16} />
                <span>우편번호 및 도로명 주소 검색</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPostcodeOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-2 bg-white">
              <DaumPostcode
                onComplete={handleCompletePostcode}
                autoClose={false}
                style={{ width: '100%', height: '460px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
