'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ContentProtection() {
  const pathname = usePathname();

  useEffect(() => {
    // 관리자 페이지(/admin)에서는 정상적인 작업(복사/붙여넣기 등)을 위해 방지 기능 해제
    if (pathname && pathname.startsWith('/admin')) {
      return;
    }

    // 1. 마우스 우클릭 방지 (단, 텍스트 입력창은 허용)
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      e.preventDefault();
    };

    // 2. 이미지 및 요소 드래그 앤 드롭 방지 (바탕화면 끌어다 놓기 차단)
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // 3. 페이지 저장 단축키(Cmd+S / Ctrl+S) 방지
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('dragstart', handleDragStart, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [pathname]);

  return null;
}
