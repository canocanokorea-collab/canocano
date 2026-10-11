import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, generateAdminToken } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { success: false, error: '관리자 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    const token = generateAdminToken();
    return NextResponse.json({
      success: true,
      token,
      message: '관리자 로그인 성공',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || '인증 중 오류 발생' },
      { status: 500 }
    );
  }
}
