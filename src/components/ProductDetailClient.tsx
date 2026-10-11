'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/lib/useProducts';
import {
  ShoppingBag,
  ArrowRight,
  Check,
  Truck,
  Sparkles,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product: initialProduct }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { products, isLoaded } = useProducts();

  // 최신 실시간 수정 상품 정보 반영
  const currentProduct = products.find((p) => p.id === initialProduct.id);
  const product = currentProduct || initialProduct;

  // Selected Options state: { "종류": "2구", "색상": "내추럴" }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.options && product.options.length > 0) {
      product.options.forEach((opt) => {
        if (opt.values && opt.values.length > 0) {
          initial[opt.name] = opt.values[0];
        }
      });
    }
    return initial;
  });

  // Sync options when dynamic product loads
  useEffect(() => {
    if (product.options && product.options.length > 0) {
      setSelectedOptions((prev) => {
        const updated = { ...prev };
        product.options.forEach((opt) => {
          if (opt.values && opt.values.length > 0 && !updated[opt.name]) {
            updated[opt.name] = opt.values[0];
          }
        });
        return updated;
      });
    }
  }, [product]);

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [addedToast, setAddedToast] = useState<boolean>(false);
  const [customEngravingText, setCustomEngravingText] = useState<string>('');

  // If product not found after KV lookup
  if (isLoaded && !currentProduct && initialProduct.name === '상품 로딩 중...') {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
        <div className="text-4xl">📦</div>
        <h2 className="text-xl font-bold text-[#27397d]">등록되지 않은 상품입니다</h2>
        <p className="text-xs text-gray-500">
          존재하지 않거나 삭제된 상품입니다. 주소를 다시 확인해 주세요.
        </p>
        <Link
          href="/shop"
          className="inline-block px-5 py-2.5 bg-[#27397d] text-[#a7f99e] rounded-xl font-bold text-xs hover:brightness-110 transition-all shadow-md"
        >
          쇼핑몰 상품 목록으로 이동
        </Link>
      </div>
    );
  }

  // All product images array
  const allImages = [product.mainImage, ...(product.detailImages || [])].filter(Boolean);

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  // 각인 옵션 선택 여부 감지
  const isEngravingSelected = Object.entries(selectedOptions).some(
    ([key, val]) => (key.includes('각인') || val.includes('각인 추가')) && val !== '각인 없음'
  );

  const getPreparedOptions = () => {
    const finalOptions = { ...selectedOptions };
    if (isEngravingSelected) {
      if (!customEngravingText.trim()) {
        alert('각인 문구를 입력해 주세요.');
        return null;
      }
      finalOptions['각인 문구'] = customEngravingText.trim();
    } else {
      delete finalOptions['각인 문구'];
    }
    return finalOptions;
  };

  const handleAddToCart = () => {
    const finalOptions = getPreparedOptions();
    if (!finalOptions) return;
    addToCart(product, finalOptions, quantity);
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
    }, 4000);
  };

  const handleBuyNow = () => {
    const finalOptions = getPreparedOptions();
    if (!finalOptions) return;
    addToCart(product, finalOptions, quantity);
    router.push('/checkout');
  };

  const isSoldOut = product.status === '품절';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Product Main Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Images Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[3/4] max-w-lg mx-auto w-full rounded-2xl overflow-hidden bg-white border border-brand-border flex items-center justify-center">
            <Image
              src={allImages[selectedImageIndex] || product.mainImage}
              alt={product.name}
              fill
              unoptimized
              className="object-cover"
              priority
            />
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex space-x-3 overflow-x-auto pb-2 justify-center">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-16 h-20 sm:w-18 sm:h-24 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-white ${
                    selectedImageIndex === idx
                      ? 'border-[#27397d] ring-2 ring-[#a7f99e]'
                      : 'border-brand-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`Thumb ${idx}`} fill unoptimized className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Actions */}
        <div className="lg:col-span-5 space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-brand-border shadow-xs">
          <div>
            <span className="text-xs font-bold text-[#27397d] uppercase tracking-wider">
              {product.category}
            </span>
            <div className="flex items-center space-x-2.5 mt-1 flex-wrap gap-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#27397d] tracking-tight">
                {product.name}
              </h1>
              {isSoldOut && (
                <span className="text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded font-mono uppercase tracking-wider">
                  SOLDOUT
                </span>
              )}
            </div>
            <div className="flex items-baseline space-x-3 mt-3">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#27397d]">
                ₩ {product.price.toLocaleString()}
              </span>
              {product.originalPrice > product.price && (
                <>
                  <span className="font-mono text-sm sm:text-base text-[#27397d]/40 line-through">
                    ₩ {product.originalPrice.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="p-4 bg-stone-50 rounded-xl space-y-1.5 text-xs text-[#27397d]/80 border border-brand-border">
            <div className="flex items-center space-x-2">
              <Truck size={15} className="text-[#27397d] shrink-0" />
              <span className="font-medium text-[#27397d]">
                배송비: {product.delivery.fee === 0 ? '무료배송' : `${product.delivery.fee.toLocaleString()}원 (${product.delivery.freeThreshold.toLocaleString()}원 이상 무료배송)`}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles size={15} className="text-amber-500 shrink-0" />
              <span className="text-[#27397d]">주문 후 제작 상품 (제작 기간 약 1주일 소요, 완제품 발송)</span>
            </div>
          </div>

          {/* Options Selector */}
          {product.options && product.options.length > 0 && (
            <div className="space-y-4 pt-2">
              {product.options.map((opt) => (
                <div key={opt.name} className="space-y-1.5">
                  <label className="text-xs font-bold text-[#27397d] uppercase tracking-wider">
                    {opt.name}
                  </label>
                  <select
                    value={selectedOptions[opt.name] || ''}
                    onChange={(e) => handleOptionChange(opt.name, e.target.value)}
                    disabled={isSoldOut}
                    className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-md text-sm text-[#27397d] focus:outline-none focus:border-[#27397d] font-medium disabled:bg-gray-100"
                  >
                    {opt.values.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Custom Engraving Text Input Field */}
              {isEngravingSelected && (
                <div className="space-y-2 p-4 bg-stone-50 border border-brand-border rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#27397d] flex items-center space-x-1.5">
                      <Sparkles size={14} className="text-[#27397d]" />
                      <span>각인 문구 입력 (Custom Text)</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {customEngravingText.length}/20자
                    </span>
                  </div>
                  <input
                    type="text"
                    value={customEngravingText}
                    onChange={(e) => setCustomEngravingText(e.target.value)}
                    placeholder="예: 이름 및 연락처 (초코 010-1234-5678)"
                    maxLength={20}
                    disabled={isSoldOut}
                    className="w-full px-3.5 py-2.5 bg-white border border-brand-border rounded-md text-sm text-[#27397d] placeholder:text-gray-400 focus:outline-none focus:border-[#27397d] focus:ring-1 focus:ring-[#27397d] font-medium"
                  />
                  <p className="text-[11px] text-[#27397d]/75 leading-relaxed">
                    * 주문 시 기재해주신 문구로 1:1 맞춤 각인 제작됩니다.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* If In Stock: Show Quantity, Price & Buy/Cart Buttons */}
          {!isSoldOut ? (
            <div className="space-y-4 pt-2 border-t border-brand-border">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-[#27397d] uppercase">수량 (Quantity)</span>
                <div className="flex items-center border border-brand-border rounded-md bg-stone-50">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-sm font-bold text-[#27397d] hover:bg-gray-200 rounded-l-md disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-sm font-bold font-mono text-[#27397d]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1.5 text-sm font-bold text-[#27397d] hover:bg-gray-200 rounded-r-md cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-xs font-bold text-[#27397d] uppercase">총 상품 금액</span>
                <span className="font-mono text-xl font-extrabold text-[#27397d]">
                  ₩ {(product.price * quantity).toLocaleString()}
                </span>
              </div>

              {/* Active Buy & Cart Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full bg-[#a7f99e] text-[#27397d] py-3.5 px-6 rounded-none font-bold text-sm hover:brightness-105 transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>바로 구매하기</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full bg-white text-[#27397d] border-2 border-[#a7f99e] py-3 px-6 rounded-none font-bold text-sm hover:bg-[#a7f99e]/20 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  <span>장바구니 담기</span>
                </button>
              </div>
            </div>
          ) : (
            /* If Sold Out: Show Clean Inquiry Action */
            <div className="space-y-3 pt-4 border-t border-brand-border">
              <Link
                href={`/inquiry?productName=${encodeURIComponent(product.name)}&productId=${product.id}`}
                className="w-full flex items-center justify-center space-x-2 py-4 bg-[#27397d] hover:bg-[#1f2d63] text-white font-bold text-sm sm:text-base rounded-md transition-all shadow-sm"
              >
                <MessageSquare size={18} />
                <span>제작 및 구매 문의하기</span>
              </Link>
              <p className="text-center text-xs text-[#27397d]/70">
                현재 주문 제작 방식으로 상담 및 주문을 진행하고 있습니다.
              </p>
            </div>
          )}

          {/* Toast Notification */}
          {addedToast && (
            <div className="p-3 bg-[#a7f99e]/30 border border-[#a7f99e] rounded-md text-[#27397d] text-xs font-medium flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-1.5">
                <Check size={14} className="text-[#27397d]" />
                <span className="font-semibold text-[#27397d]">장바구니에 상품을 담았습니다.</span>
              </div>
              <Link href="/cart" className="font-bold underline text-[#27397d]">
                장바구니 이동
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Description Section */}
      <div className="pt-12 border-t border-brand-border">
        <div className="w-full max-w-2xl mx-auto bg-white p-0 rounded-none border-0 overflow-hidden">
          {product.detailBodyImages && product.detailBodyImages.length > 0 ? (
            <div className="w-full flex flex-col items-center space-y-[38px] bg-white">
              {product.detailBodyImages.map((img, idx) => (
                <div key={idx} className="w-full bg-white">
                  <img
                    src={img}
                    alt={`상세 설명 이미지 ${idx + 1}`}
                    className="w-full h-auto object-contain block mx-auto rounded-none bg-white"
                    style={{ width: '100%', maxWidth: '100%', display: 'block', backgroundColor: '#ffffff' }}
                    loading="eager"
                    decoding="async"
                  />
                </div>
              ))}
              {product.detailNoticeText && (
                <div className="w-full p-6 bg-stone-50 rounded-2xl border border-brand-border text-xs text-[#27397d]/90 whitespace-pre-line leading-relaxed text-left space-y-2 my-6">
                  <div className="font-bold text-sm text-[#27397d] flex items-center space-x-1.5">
                    <Sparkles size={16} className="text-[#27397d]" />
                    <span>상품 상세 안내 & 취급 주의사항</span>
                  </div>
                  <div>{product.detailNoticeText}</div>
                </div>
              )}
            </div>
          ) : product.detailHtml ? (
            <div
              className="prose-product w-full max-w-none text-center"
              dangerouslySetInnerHTML={{ __html: product.detailHtml }}
            />
          ) : (
            <div className="space-y-6 text-center text-[#27397d]">
              <p className="text-base leading-relaxed">
                카노카노의 <strong>{product.name}</strong>은 최고급 친환경 자작나무 원목으로
                정성껏 제작된 핸드메이드 반려동물 가구입니다.
              </p>
              {product.detailImages &&
                product.detailImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-4/3 w-full max-w-2xl mx-auto rounded-none overflow-hidden my-4"
                  >
                    <Image src={img} alt={`Detail ${idx + 1}`} fill className="object-cover" />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Exchange & Refund Policy Section (교환/환불/배송 규정 안내) */}
      <div className="pt-12 border-t border-brand-border space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-[#27397d]">
            배송 및 교환/환불 안내
          </h2>
        </div>

        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-xl border border-brand-border space-y-8 text-xs sm:text-sm text-[#27397d]/90 leading-relaxed font-sans shadow-xs">
          {/* 1. Delivery */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-[#27397d] flex items-center space-x-2 border-b border-brand-border pb-2">
              <Truck size={18} className="text-[#27397d]" />
              <span>배송 안내</span>
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#27397d]/80">
              <li>
                <strong>배송 방법:</strong> 일반택배
              </li>
              <li>
                <strong>배송 비용:</strong>{' '}
                {product.delivery.fee === 0
                  ? '무료배송'
                  : `기본 ${product.delivery.fee.toLocaleString()}원 (${product.delivery.freeThreshold.toLocaleString()}원 이상 구매 시 무료)`}{' '}
                (제주/도서산간 지역 추가 운임 발생 가능)
              </li>
              <li>
                <strong>제작 및 배송 기간:</strong> 주문 접수 후 약 2~3일 소요됩니다.
              </li>
            </ul>
          </div>

          {/* 2. Exchange & Refund Policy */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-[#27397d] flex items-center space-x-2 border-b border-brand-border pb-2">
              <ShieldCheck size={18} className="text-[#27397d]" />
              <span>교환 및 환불(반품) 규정</span>
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#27397d]/80">
              <li>
                <strong>신청 기간:</strong> 상품 수령일로부터 7일 이내에 고객센터 또는 1:1 문의를 통해 교환/반품 접수가 가능합니다.
              </li>
              <li>
                <strong>상품 하자/오배송의 경우:</strong> 배송비 전액을 카노카노가 부담하여 무상 교환 또는 전액 환불해 드립니다.
              </li>
              <li>
                <strong>고객 단순 변심의 경우:</strong> 왕복 배송비는 고객님 부담이며, 반품 확인 후 결제 금액이 환불됩니다.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
