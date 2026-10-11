import { NextRequest, NextResponse } from 'next/server';
import { sendInquiryAlert, sendErrorAlert } from '@/lib/discord';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, type, title, content, productName } = body;

    if (!name || !phone || !email || !title || !content) {
      return NextResponse.json(
        { success: false, error: '필수 입력 항목(성함, 연락처, 이메일, 제목, 내용)을 모두 작성해주세요.' },
        { status: 400 }
      );
    }

    // Discord Webhook으로 고객 문의 실시간 전송
    await sendInquiryAlert({
      name,
      phone,
      email,
      type: type || '기타',
      title,
      content,
      productName,
    });

    return NextResponse.json({
      success: true,
      message: '문의가 성공적으로 접수되었습니다.',
    });
  } catch (error: any) {
    console.error('[API /api/inquiries Error]', error);

    // 에러 발생 시 디스코드 오류 채널로 자동 보고
    await sendErrorAlert({
      location: 'POST /api/inquiries',
      errorMessage: error.message || String(error),
      stack: error.stack,
      actionHint: '고객 문의 접수 처리 중 예외가 발생했습니다.',
    });

    return NextResponse.json(
      { success: false, error: '서버 오류로 문의를 접수하지 못했습니다.' },
      { status: 500 }
    );
  }
}
