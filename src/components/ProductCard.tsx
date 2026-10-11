'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isSoldOut = product.status === '품절';
  const hasDiscount = product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col bg-white rounded-lg overflow-hidden border border-brand-border/60 hover:border-[#27397d]/30 transition-all duration-300 hover:shadow-md">
      <Link href={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-white">
        <Image
          src={product.mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between space-y-2">
        {/* 상품명 & 할인율/품절 뱃지 */}
        <div className="flex items-center justify-between gap-1.5">
          <Link
            href={`/product/${product.id}`}
            className="group-hover:opacity-80 transition-opacity flex-1 min-w-0"
          >
            <h3 className="text-sm font-semibold text-[#27397d] truncate">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center space-x-1 shrink-0">
            {hasDiscount && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-mono">
                {discountPercent}%
              </span>
            )}
            {isSoldOut && (
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded font-mono uppercase">
                SOLDOUT
              </span>
            )}
          </div>
        </div>

        {/* 가격 영역: 기존 가격을 세일 가격 위에 배치 */}
        <div className="flex flex-col justify-end pt-0.5">
          {hasDiscount && (
            <p className="font-mono text-xs text-[#27397d]/40 line-through leading-none mb-1">
              ₩ {product.originalPrice.toLocaleString()}
            </p>
          )}
          <p className="font-mono text-sm sm:text-base font-bold text-[#27397d] tracking-tight leading-none">
            ₩ {product.price.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
