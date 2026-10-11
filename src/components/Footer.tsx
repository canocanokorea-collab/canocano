import React from 'react';
import Link from 'next/link';
import { Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white text-[#27397d] pt-12 pb-14 border-t border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Legal & Service Links */}
        <div className="flex items-center space-x-4 border-b border-brand-border pb-5 mb-8 text-xs font-bold text-[#27397d]">
          <Link href="/terms" className="hover:underline transition-colors">
            이용약관
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/privacy" className="hover:underline transition-colors">
            개인정보처리방침
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/order-lookup" className="hover:underline transition-colors text-brand-blue font-extrabold flex items-center space-x-1">
            <span>주문/배송 조회</span>
          </Link>
        </div>

        {/* 3 Columns Spanning 100% of Grid Width with Perfectly Balanced Equal Spacing */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 lg:gap-12">
          {/* Column 1: CANO CANO (Aligned to Left Grid Edge) */}
          <div className="space-y-4 shrink-0">
            <h3 className="text-[#27397d] text-sm font-bold tracking-wider uppercase font-montserrat">
              CANO CANO
            </h3>
            <div className="text-xs text-[#27397d]/80 space-y-1.5 leading-relaxed font-sans">
              <p>상호명 &nbsp; 카노카노 &nbsp; | &nbsp; 대표자 &nbsp; 이형지 &nbsp; | &nbsp; 개인정보관리책임자 &nbsp; 이형지</p>
              <p>사업장주소 &nbsp; 경기 파주시 탄현면 국원말길 38 (법흥리) 101호</p>
              <p>연락처 &nbsp; 070-7799-0516 &nbsp; | &nbsp; 사업자등록번호 &nbsp; 128-39-75100</p>
              <p>통신판매업신고번호 &nbsp; 제2016-고양일산서-0564호</p>
              <p className="pt-2 text-[11px] text-[#27397d]/60 font-mono">
                Copyright ⓒ 2026 카노카노 All rights reserved.
              </p>
            </div>
          </div>

          {/* Column 2: OFFICE & SHOWROOM (Evenly Positioned in Middle) */}
          <div className="space-y-4 shrink-0">
            <h4 className="text-[#27397d] text-sm font-bold tracking-wider uppercase font-montserrat">
              OFFICE & SHOWROOM
            </h4>
            <div className="text-xs text-[#27397d]/80 space-y-1.5 leading-relaxed font-sans">
              <p>경기도 파주시 탄현면 국원말길 38, 101호</p>
              <p className="text-xs text-[#27397d]/70">Mon - Sat 10:00 - 18:00</p>
              <p className="text-xs text-[#27397d]/70">cano_cano@naver.com</p>
            </div>
          </div>

          {/* Column 3: CONNECT (Aligned to Right Grid Edge) */}
          <div className="space-y-4 shrink-0 flex flex-col items-start">
            <h4 className="text-[#27397d] text-sm font-bold tracking-wider uppercase font-montserrat text-left">
              CONNECT
            </h4>
            <div className="flex flex-col space-y-2.5 items-start">
              <a
                href="https://blog.naver.com/cano_cano"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-sm text-[#27397d] hover:opacity-80 transition-opacity group"
              >
                <span className="w-6 h-6 rounded bg-[#a7f99e] text-[#27397d] flex items-center justify-center font-bold text-xs shadow-sm">
                  b
                </span>
                <span className="font-medium text-xs">Blog</span>
              </a>

              <a
                href="https://www.instagram.com/canocano_official"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-sm text-[#27397d] hover:opacity-80 transition-opacity group"
              >
                <span className="w-6 h-6 rounded bg-[#a7f99e] text-[#27397d] flex items-center justify-center shadow-sm">
                  <Instagram size={14} />
                </span>
                <span className="font-medium text-xs">Instagram</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
