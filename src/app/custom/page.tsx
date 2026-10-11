'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function CustomPublicPage() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Title Header (Montserrat Font & Signature Lime Green, Left-Aligned like SHOP) */}
      <div className="border-b border-brand-border pb-4">
        <h1 className="font-montserrat text-2xl sm:text-3xl font-medium text-[#a7f99e] tracking-wide uppercase">
          CUSTOM
        </h1>
      </div>

      <div className="py-16 text-center space-y-6 max-w-lg mx-auto">
        <div className="space-y-2">
          <p className="text-base sm:text-lg text-[#27397d] font-bold">
            카노카노 커스텀 제작 서비스 준비 중입니다.
          </p>
          <p className="text-xs sm:text-sm text-[#27397d]/60 font-light tracking-wide">
            조금만 기다려 주세요.
          </p>
        </div>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center bg-[#a7f99e] text-[#27397d] px-8 py-3 rounded-none font-bold text-sm hover:brightness-105 transition-all shadow-sm cursor-pointer"
          >
            뒤로가기
          </button>
        </div>
      </div>
    </div>
  );
}
