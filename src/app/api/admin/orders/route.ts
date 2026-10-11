import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';

export interface OrderRecord {
  orderId: string;
  paymentKey?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  addressMain: string;
  addressDetail?: string;
  postalCode?: string;
  deliveryMemo?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    options?: Record<string, string>;
  }>;
  totalAmount: number;
  deliveryFee: number;
  status: '결제완료' | '배송준비중' | '배송중' | '배송완료' | '취소/환불';
  courier?: string;
  trackingNumber?: string;
  createdAt: string;
}

// In-memory persistent order store for runtime
declare global {
  var __CANO_ORDERS_STORE__: OrderRecord[] | undefined;
}

if (!globalThis.__CANO_ORDERS_STORE__) {
  globalThis.__CANO_ORDERS_STORE__ = [
    {
      orderId: 'ORD-20260829-001',
      customerName: '김민지',
      customerPhone: '010-8765-4321',
      customerEmail: 'minji.kim@gmail.com',
      addressMain: '서울특별시 강남구 테헤란로 152',
      addressDetail: '강남파이낸스센터 12층',
      postalCode: '06236',
      deliveryMemo: '문 앞에 놓아주세요 (부재 시 연락)',
      items: [
        {
          name: '타원 핑크코드 펜던트',
          quantity: 1,
          price: 189000,
          options: {
            '중앙 보석': '루비',
            '서브 보석': '스피넬다크, 레드, 자수정, 샴페인 등 8구',
            '각인 문구': 'COCO ♥ 010-8765-4321',
          },
        },
      ],
      totalAmount: 189000,
      deliveryFee: 0,
      status: '배송준비중',
      courier: 'CJ대한통운',
      trackingNumber: '',
      createdAt: '2026-08-29T10:15:00.000Z',
    },
    {
      orderId: 'ORD-20260828-002',
      customerName: '이준혁',
      customerPhone: '010-3344-5566',
      customerEmail: 'junhyuk@naver.com',
      addressMain: '경기도 성남시 분당구 판교역로 235',
      addressDetail: 'H스퀘어 N동 801호',
      postalCode: '13494',
      deliveryMemo: '경비실에 맡겨주세요',
      items: [
        {
          name: '베베블 우드 테이블 2size (2구/내추럴)',
          quantity: 1,
          price: 22000,
          options: {
            '종류': '2구',
            '색상': '내추럴',
          },
        },
      ],
      totalAmount: 25000,
      deliveryFee: 3000,
      status: '배송중',
      courier: '우체국택배',
      trackingNumber: '68923019284',
      createdAt: '2026-08-28T14:22:00.000Z',
    },
    {
      orderId: 'ORD-20260827-003',
      customerName: '박서연',
      customerPhone: '010-9988-7766',
      customerEmail: 'seoyeon_p@kakao.com',
      addressMain: '부산광역시 해운대구 센텀중앙로 78',
      addressDetail: '센텀그린타워 1502호',
      postalCode: '48058',
      deliveryMemo: '배송 전 연락 부탁드립니다',
      items: [
        {
          name: '아치 캣타워 해먹 (월넛)',
          quantity: 1,
          price: 145000,
          options: {
            '색상': '월넛',
          },
        },
      ],
      totalAmount: 145000,
      deliveryFee: 0,
      status: '배송완료',
      courier: 'CJ대한통운',
      trackingNumber: '55432098123',
      createdAt: '2026-08-27T09:40:00.000Z',
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

    const orders = globalThis.__CANO_ORDERS_STORE__ || [];
    return NextResponse.json({
      success: true,
      orders,
      totalCount: orders.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || '주문 목록 조회 실패' },
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

    const { orderId, status, courier, trackingNumber } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: '주문번호가 필요합니다.' },
        { status: 400 }
      );
    }

    const orders = globalThis.__CANO_ORDERS_STORE__ || [];
    const index = orders.findIndex((o) => o.orderId === orderId);

    if (index === -1) {
      return NextResponse.json(
        { success: false, error: '해당 주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (status) orders[index].status = status;
    if (courier !== undefined) orders[index].courier = courier;
    if (trackingNumber !== undefined) orders[index].trackingNumber = trackingNumber;

    return NextResponse.json({
      success: true,
      order: orders[index],
      message: '주문 상태가 업데이트되었습니다.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || '주문 상태 변경 실패' },
      { status: 500 }
    );
  }
}
