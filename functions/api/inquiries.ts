function formatPhone(phone: string) {
  const clean = (phone || '').replace(/[^0-9]/g, '');
  if (clean.length === 11) return clean.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  if (clean.length === 10) return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  return phone;
}

export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const { name, phone, email, type, title, content, productName } = body;

    if (!name || !phone || !email || !title || !content) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 항목(성함, 연락처, 이메일, 제목, 내용)을 입력해주세요.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const inqId = `INQ-${Date.now().toString().slice(-6)}`;
    const newInquiry = {
      id: inqId,
      name,
      phone: formatPhone(phone),
      email,
      type: type || '배송/제작',
      title,
      productName: productName || '일반 문의',
      content,
      status: '답변대기',
      createdAt: new Date().toISOString(),
    };

    // 1. Cloudflare KV 저장
    const kv = context.env?.CANO_STORE;
    if (kv) {
      try {
        let inquiries: any[] = (await kv.get('cano_inquiries_data', { type: 'json' })) || [];
        if (!Array.isArray(inquiries)) inquiries = [];
        inquiries.unshift(newInquiry);
        await kv.put('cano_inquiries_data', JSON.stringify(inquiries));
      } catch (kvErr) {
        console.warn('Failed to save inquiry to KV:', kvErr);
      }
    }

    // 2. Discord Webhook 전송
    const webhookUrl =
      context.env?.DISCORD_INQUIRIES_WEBHOOK_URL ||
      'https://discord.com/api/webhooks/1538823941169090620/Esvo5NXyU4wam5M46h2LZOWjFXIo9x_YgE-kq_sadw_r0CiNx6VHoW2Hopp3lL3o1gxy';
    if (webhookUrl) {
      const formattedPhone = formatPhone(phone);
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '[새로운 고객 문의]',
              color: 0x27397D,
              fields: [
                {
                  name: '1. 문의 대상 상품',
                  value: productName || '일반 문의',
                  inline: false,
                },
                {
                  name: '2. 작성자',
                  value: `${name} (${formattedPhone})`,
                  inline: true,
                },
                {
                  name: '3. 이메일',
                  value: email,
                  inline: true,
                },
                {
                  name: '4. 문의 유형',
                  value: type || '배송/제작',
                  inline: true,
                },
                {
                  name: '5. 제목',
                  value: title,
                  inline: false,
                },
                {
                  name: '6. 문의 내용',
                  value: content,
                  inline: false,
                },
              ],
              footer: { text: 'CANO CANO (canocano.shop)' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      }).catch(() => {});
    }

    return new Response(
      JSON.stringify({ success: true, message: '문의가 정상 접수되었습니다.', id: inqId }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message || 'Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
