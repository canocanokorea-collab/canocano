'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 text-[#27397d]">
      <div className="border-b border-brand-border pb-4">
        <h1 className="font-montserrat text-2xl sm:text-3xl font-medium text-[#a7f99e] tracking-wide uppercase">
          PRIVACY POLICY
        </h1>
        <p className="text-xs text-[#27397d]/70 mt-1">카노카노 개인정보처리방침</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-xl border border-brand-border space-y-6 text-xs sm:text-sm leading-relaxed text-[#27397d]/90 font-sans shadow-xs">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#27397d]">1. 개인정보의 수집 및 이용 목적</h2>
          <p>
            카노카노는 다음의 목적을 위해 최소한의 개인정보를 수집 및 이용합니다:<br />
            - 주문 상품의 배송 및 결제 처리, 주문 확인 내역 안내<br />
            - 고객 1:1 문의 응대 및 A/S 처리
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#27397d]">2. 수집하는 개인정보의 항목</h2>
          <p>
            - 필수항목: 주문자 성명, 연락처(휴대전화번호), 배송지 주소, 결제 정보<br />
            - 선택항목: 이메일 주소, 배송 메모
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#27397d]">3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            전자상거래 등에서의 소비자보호에 관한 법률 등 관계 법령에 따라 거래 기록을 일정 기간 보존합니다:<br />
            - 계약 또는 청약철회 등에 관한 기록: 5년<br />
            - 대금결제 및 재화 등의 공급에 관한 기록: 5년<br />
            - 소비자의 불만 또는 분쟁처리에 관한 기록: 3년
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#27397d]">4. 개인정보 보호책임자</h2>
          <p>
            - 성명: 이형지<br />
            - 연락처: 070-7799-0516<br />
            - 이메일: cano_cano@naver.com
          </p>
        </section>
      </div>

      <div className="text-center pt-4">
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-[#a7f99e] text-[#27397d] font-bold text-xs hover:brightness-105 transition-all"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
