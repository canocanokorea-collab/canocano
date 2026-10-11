'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] Caught error:', error, errorInfo);

    const errorMessage = error.message || String(error);
    const isChunkError =
      errorMessage.includes('Loading chunk') ||
      errorMessage.includes('ChunkLoadError') ||
      errorMessage.includes('Loading CSS chunk') ||
      errorMessage.includes('Failed to fetch dynamically imported module');

    // 신규 배포 시 구버전 캐시 불일치(ChunkLoadError) 발생 시 1회 자동 새로고침하여 최신 배포본 즉시 로드
    if (isChunkError && typeof window !== 'undefined') {
      const storageKey = 'cano_chunk_retry';
      const lastRetry = sessionStorage.getItem(storageKey);
      const now = Date.now();

      if (!lastRetry || now - parseInt(lastRetry, 10) > 10000) {
        sessionStorage.setItem(storageKey, String(now));
        window.location.reload();
        return;
      }
    }

    // 디스코드 에러 텔레메트리 전송 (구글봇 등의 일시적 크롤링 청크 에러는 알림 노이즈 방지)
    const isBot = typeof navigator !== 'undefined' && /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
    if (isChunkError && isBot) {
      return;
    }

    try {
      fetch('/api/telemetry/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: typeof window !== 'undefined' ? window.location.href : 'Client Render',
          errorMessage: error.message || String(error),
          stack: error.stack || errorInfo.componentStack,
          clientInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent}` : 'Unknown',
          actionHint: isChunkError
            ? '신규 배포 후 구버전 캐시 청크 불일치 오류입니다. 자동 새로고침 복구 기능이 작동했습니다.'
            : 'React 컴포넌트 렌더링 중 예외가 발생했습니다. 컴포넌트 props와 상태를 점검하세요.',
        }),
      }).catch((e) => console.error('Failed to send error telemetry', e));
    } catch (e) {
      console.error('Telemetry report error:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-stone-50">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">일시적인 오류가 발생했습니다</h2>
          <p className="text-sm text-gray-600 max-w-md mb-6 leading-relaxed">
            오류 내용이 실시간 관제 시스템(Discord)으로 자동 보고되었습니다.
            안티그래비티와 관리자가 확인하여 신속히 조치하겠습니다.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 bg-brand-blue text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-[#27397d]/90 transition-colors"
          >
            <RefreshCw size={16} />
            <span>페이지 새로고침</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
