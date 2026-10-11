export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const { location, errorMessage, stack, clientInfo, actionHint, extraData } = body;

    const webhookUrl =
      context.env?.DISCORD_ERROR_WEBHOOK_URL ||
      'https://discord.com/api/webhooks/1538823826442289213/qiYi75PX2S2-X1Gi8W8cwKGsNVdoWcZ39SUBgYbPaPf2v9cNvEk4DV5gf_wVu3oX4Zqh';
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '🚨 [사이트 오류 감지] Canocano Production Error',
              color: 15158332,
              fields: [
                { name: '📍 발생 지점', value: `\`${location || 'Client Error'}\``, inline: true },
                { name: '⏱ 발생 시각', value: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }), inline: true },
                { name: '⚠️ 오류 메시지', value: `\`\`\`\n${errorMessage || 'Unknown Error'}\n\`\`\``, inline: false },
                { name: '👤 사용자 환경', value: clientInfo || 'Unknown', inline: false },
                { name: '💡 안티그래비티 조치 가이드', value: actionHint || '클라이언트 예외를 확인하세요.', inline: false },
              ],
              footer: { text: 'Canocano Sentryless Agent Observer • Cloudflare Pages' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
