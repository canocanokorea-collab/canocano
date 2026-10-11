'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Trash2, ArrowRight, ShoppingBag, Truck } from 'lucide-react';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItemCount,
    totalProductPrice,
    deliveryFee,
    finalPrice,
  } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 bg-blue-50 text-[#27397d] rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag size={36} />
        </div>
        <h1 className="text-2xl font-extrabold text-[#27397d]">장바구니가 비어 있습니다</h1>
        <div className="pt-2">
          <Link
            href="/shop"
            className="inline-flex items-center space-x-2 bg-[#a7f99e] text-[#27397d] px-8 py-3.5 rounded-none font-bold text-sm hover:brightness-105 transition-all shadow-xs"
          >
            <span>상품 보러가기</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Title Header (Montserrat Font & Signature Lime Green, Left-Aligned like SHOP & ABOUT) */}
      <div className="border-b border-brand-border pb-4">
        <h1 className="font-montserrat text-2xl sm:text-3xl font-medium text-[#a7f99e] tracking-wide uppercase">
          BAG
        </h1>
      </div>

      {/* Sub Header below gray line */}
      <div className="pt-1">
        <p className="text-sm text-[#27397d]/70">
          선택하신 상품 {totalItemCount}개가 담겨 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 sm:p-6 rounded-xl border border-brand-border gap-4"
            >
              {/* Product Image & Info */}
              <div className="flex items-center space-x-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-brand-border">
                  <Image
                    src={item.product.mainImage}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <Link
                    href={`/product/${item.productId}`}
                    className="text-base font-bold text-[#27397d] hover:opacity-80 transition-opacity"
                  >
                    {item.product.name}
                  </Link>
                  {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                    <p className="text-xs text-[#27397d]/70 mt-1">
                      옵션:{' '}
                      {Object.entries(item.selectedOptions)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' / ')}
                    </p>
                  )}
                  <p className="font-mono text-sm font-bold text-[#27397d] mt-1.5">
                    ₩ {item.unitPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Quantity and Subtotal Controls */}
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-6">
                {/* Quantity Buttons */}
                <div className="flex items-center border border-brand-border rounded-md bg-stone-50">
                  <button
                    type="button"
                    onClick={() => updateQuantity(idx, item.quantity - 1)}
                    className="px-2.5 py-1 text-sm font-bold text-[#27397d] hover:bg-gray-200 rounded-l-md cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono px-3 py-1 text-xs font-semibold text-[#27397d]">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(idx, item.quantity + 1)}
                    className="px-2.5 py-1 text-sm font-bold text-[#27397d] hover:bg-gray-200 rounded-r-md cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <p className="font-mono text-sm font-extrabold text-[#27397d]">
                    ₩ {(item.unitPrice * item.quantity).toLocaleString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(idx)}
                  className="p-1 text-[#27397d]/40 hover:text-red-500 transition-colors cursor-pointer"
                  aria-label="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-brand-border space-y-6 sticky top-28">
          <h2 className="text-lg font-bold text-[#27397d] border-b border-brand-border pb-3">
            주문 금액 요약
          </h2>

          <div className="space-y-3 text-sm text-[#27397d]/80">
            <div className="flex justify-between">
              <span>총 상품 금액</span>
              <span className="font-mono font-semibold text-[#27397d]">
                ₩ {totalProductPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>배송비</span>
              <span className="font-mono font-semibold text-[#27397d]">
                {deliveryFee === 0 ? (
                  <span className="text-[#27397d] font-bold">무료배송</span>
                ) : (
                  `₩ ${deliveryFee.toLocaleString()}`
                )}
              </span>
            </div>
            {totalProductPrice < 50000 && deliveryFee > 0 && (
              <p className="text-[11px] text-[#27397d] bg-blue-50/50 p-2 rounded flex items-center space-x-1 border border-blue-100">
                <Truck size={12} className="text-[#27397d]" />
                <span>
                  ₩ {(50000 - totalProductPrice).toLocaleString()}원 더 담으시면 무료배송!
                </span>
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-brand-border flex justify-between items-baseline">
            <span className="text-base font-bold text-[#27397d]">최종 결제 예상 금액</span>
            <span className="font-mono text-2xl font-extrabold text-[#27397d]">
              ₩ {finalPrice.toLocaleString()}
            </span>
          </div>

          <Link
            href="/checkout"
            className="w-full bg-[#a7f99e] text-[#27397d] py-3.5 px-6 rounded-none font-bold text-sm hover:brightness-105 transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>주문서 작성 및 결제하기</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
