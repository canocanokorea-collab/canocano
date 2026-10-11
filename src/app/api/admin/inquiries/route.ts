import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';

export interface InquiryRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  content: string;
  status: '답변대기' | '답변완료';
  createdAt: string;
}

declare global {
  var __CANO_INQUIRIES_STORE__: InquiryRecord[] | undefined;
}

if (!globalThis.__CANO_INQUIRIES_STORE__) {
  globalThis.__CANO_INQUIRIES_STORE__ = [
    {
      id: 'INQ-001',
      name: '최유나',
      phone: '010-4455-6677',
      email: 'yuna.choi@naver.com',
      type: '커스텀 제작 문의',
      content: '반려견 사진을 펜던트에 각인하고 싶은데 대형견 사진도 가능한가요?',
      status: '답변대기',
      createdAt: '2026-08-29T09:30:00.000Z',
    },
    {
      id: 'INQ-002',
      name: '정우성',
      phone: '010-1234-5678',
      email: 'ws.jung@daum.net',
      type: '배송/교환 문의',
      content: '쇼룸에 직접 방문해서 상품을 수령할 수 있나요?',
      status: '답변완료',
      createdAt: '2026-08-28T16:00:00.000Z',
    },
  ];
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      );
    }

    const inquiries = globalThis.__CANO_INQUIRIES_STORE__ || [];
    return NextResponse.json({
      success: true,
      inquiries,
      totalCount: inquiries.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || '문의 목록 조회 실패' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!verifyAdminToken(token)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id, status } = await req.json();

    const inquiries = globalThis.__CANO_INQUIRIES_STORE__ || [];
    const index = inquiries.findIndex((i) => i.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: '해당 문의를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (status) inquiries[index].status = status;

    return NextResponse.json({
      success: true,
      inquiry: inquiries[index],
      message: '문의 상태가 업데이트되었습니다.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || '문의 상태 변경 실패' },
      { status: 500 }
    );
  }
}
