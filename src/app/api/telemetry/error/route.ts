import { NextRequest, NextResponse } from 'next/server';
import { sendErrorAlert } from '@/lib/discord';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { location, errorMessage, stack, clientInfo, actionHint, extraData } = body;

    if (!errorMessage) {
      return NextResponse.json({ success: false, error: 'errorMessage is required' }, { status: 400 });
    }

    await sendErrorAlert({
      location: location || 'Client Exception',
      errorMessage,
      stack,
      clientInfo,
      actionHint: actionHint || '클라이언트 측에서 발생한 런타임 오류입니다.',
      extraData,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Telemetry Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
