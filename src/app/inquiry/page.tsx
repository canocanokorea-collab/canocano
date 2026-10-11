'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageSquare, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import productsData from '@/data/products.json';

function InquiryForm() {
  const searchParams = useSearchParams();
  const initialProductName = searchParams.get('productName') || '';

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    type: '배송/제작' as const,
    productName: initialProductName,
    title: initialProductName ? `[${initialProductName}] 제작 및 구매 문의` : '',
    content: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // URL 파라미터가 변경되거나 로드될 때 자동 동기화
  useEffect(() => {
    const pName = searchParams.get('productName');
    if (pName) {
      setForm(prev => ({
        ...prev,
        productName: pName,
        title: prev.title || `[${pName}] 제작 및 구매 문의`,
      }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // 상품명을 드롭다운에서 선택했을 때 제목이 비어있으면 자동으로 채워주기
      if (name === 'productName' && value && (!prev.title || prev.title.startsWith('['))) {
        updated.title = `[${value}] 제작 및 구매 문의`;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSubmitted(true);
        // 실제 고객 문의를 관리자 저장소에 실시간 저장
        try {
          const currentInqs = JSON.parse(localStorage.getItem('cano_admin_inquiries') || '[]');
          const newRealInq = {
            id: `INQ-${Date.now().toString().slice(-4)}`,
            name: form.name,
            phone: form.phone,
            email: form.email,
            type: form.type,
            productName: form.productName || '일반 문의',
            content: `${form.productName ? `[문의상품: ${form.productName}]\n` : ''}${form.title ? `[${form.title}]\n` : ''}${form.content}`,
            status: '답변대기' as const,
            createdAt: new Date().toISOString(),
          };
          currentInqs.unshift(newRealInq);
          localStorage.setItem('cano_admin_inquiries', JSON.stringify(currentInqs));
        } catch (e) {
          console.error('Failed to sync real inquiry to admin store', e);
        }
      } else {
        setErrorMessage(data.error || '문의 접수 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      console.error('Inquiry submit exception:', err);
      setErrorMessage('서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-16 h-16 bg-[#a7f99e] text-[#27397d] rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="text-2xl font-extrabold text-[#27397d]">문의가 정상 접수되었습니다!</h1>
        <p className="text-sm text-[#27397d]/90 leading-relaxed max-w-md mx-auto">
          작성해주신 문의 사항이 카노카노 담당자에게 실시간으로 전달되었습니다.
          확인 후 기재해주신 연락처/이메일로 신속히 답변드리겠습니다.
        </p>
        <button
          onClick={() => {
            setIsSubmitted(false);
            setForm({
              name: '',
              phone: '',
              email: '',
              type: '배송/제작',
              productName: '',
              title: '',
              content: '',
            });
          }}
          className="px-6 py-2.5 bg-[#a7f99e] text-[#27397d] rounded-none text-sm font-bold hover:brightness-105 transition-all shadow-sm"
        >
          새로운 문의 작성하기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl border border-brand-border space-y-6">
      <div className="border-b border-brand-border pb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-[#27397d] flex items-center space-x-2">
          <MessageSquare size={18} />
          <span>1:1 문의 내용 작성</span>
        </h2>
        {form.productName && (
          <span className="text-xs font-semibold bg-[#27397d]/10 text-[#27397d] px-2.5 py-1 rounded-full flex items-center space-x-1">
            <Package size={13} />
            <span>문의 상품: {form.productName}</span>
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 상품 선택 필드 (일반 문의로 직접 접속했을 때만 표시) */}
        {!initialProductName && (
          <div className="space-y-1 bg-[#f8fafc] p-3.5 rounded-lg border border-brand-border/60">
            <label className="text-xs font-bold text-[#27397d] flex items-center space-x-1">
              <Package size={14} className="text-[#27397d]" />
              <span>문의 대상 상품 선택 (선택 사항)</span>
            </label>
            <select
              name="productName"
              value={form.productName}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] bg-white focus:border-brand-blue focus:outline-none font-medium"
            >
              <option value="">-- 상품을 선택해주세요 (일반/전체 문의는 선택 안함) --</option>
              {productsData
                .filter(p => p.category === 'ACC')
                .map(p => (
                  <option key={p.id} value={p.name}>
                    [ACC] {p.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27397d]">
              성함 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="홍길동"
              required
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] focus:border-brand-blue focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27397d]">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
              required
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] focus:border-brand-blue focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27397d]">
              이메일 (답변 수신용) <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="customer@example.com"
              required
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] focus:border-brand-blue focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#27397d]">문의 유형</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] focus:border-brand-blue focus:outline-none font-medium"
            >
              <option value="배송/제작">배송 / 제작 기간 문의</option>
              <option value="상품문의">상품 상세 / 사이즈 / 색상 문의</option>
              <option value="교환/반품">교환 / 반품 / AS 문의</option>
              <option value="쇼룸방문">쇼룸 방문 예약 / 위치 문의</option>
              <option value="기타">기타 문의</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-[#27397d]">
            문의 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="문의 제목을 입력해주세요"
            required
            className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] focus:border-brand-blue focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-[#27397d]">
            문의 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="content"
            rows={6}
            value={form.content}
            onChange={handleChange}
            placeholder="궁금하신 내용(색상, 사이즈, 주문 수량 등)을 자유롭게 작성해주세요."
            required
            className="w-full px-3 py-2 text-sm border border-brand-border rounded-md text-[#27397d] focus:border-brand-blue focus:outline-none resize-y"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center bg-[#a7f99e] text-[#27397d] py-3.5 px-8 rounded-none font-bold text-sm hover:brightness-105 transition-all shadow-xs disabled:bg-gray-300 cursor-pointer"
        >
          <span>{isSubmitting ? '문의 접수 중...' : '문의 접수하기'}</span>
        </button>
      </form>
    </div>
  );
}

export default function InquiryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Title Header */}
      <div className="border-b border-brand-border pb-4">
        <h1 className="font-montserrat text-2xl sm:text-3xl font-medium text-[#a7f99e] tracking-wide uppercase">
          CUSTOMER SUPPORT
        </h1>
      </div>

      <Suspense fallback={<div className="py-12 text-center text-[#27397d] font-bold">로딩 중...</div>}>
        <InquiryForm />
      </Suspense>
    </div>
  );
}
