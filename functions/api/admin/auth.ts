export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const { password } = body;

    const masterPassword = context.env?.ADMIN_PASSWORD || 'cano2026!';

    if (password === masterPassword) {
      return new Response(
        JSON.stringify({
          success: true,
          token: `cano_adm_${Date.now()}_cf`,
          message: '로그인 성공',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: '비밀번호가 일치하지 않습니다.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
