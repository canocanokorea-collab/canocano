export async function onRequestGet(context: any) {
  try {
    const kv = context.env?.CANO_STORE;
    let inquiries: any[] = [];

    if (kv) {
      const stored = await kv.get('cano_inquiries_data', { type: 'json' });
      if (Array.isArray(stored)) {
        inquiries = stored;
      }
    }

    return new Response(JSON.stringify({ success: true, inquiries, totalCount: inquiries.length }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Error fetching inquiries' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestPatch(context: any) {
  try {
    const kv = context.env?.CANO_STORE;
    const body = await context.request.json();
    const { id, status } = body;

    if (!id || !status) {
      return new Response(
        JSON.stringify({ success: false, error: '문의 ID와 변경할 상태(status)가 필요합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!kv) {
      return new Response(
        JSON.stringify({ success: false, error: 'KV storage missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let inquiries: any[] = (await kv.get('cano_inquiries_data', { type: 'json' })) || [];
    if (!Array.isArray(inquiries)) inquiries = [];

    const index = inquiries.findIndex((i: any) => i.id === id);
    if (index === -1) {
      return new Response(
        JSON.stringify({ success: false, error: '해당 문의를 찾을 수 없습니다.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    inquiries[index].status = status;
    inquiries[index].updatedAt = new Date().toISOString();

    await kv.put('cano_inquiries_data', JSON.stringify(inquiries));

    return new Response(
      JSON.stringify({
        success: true,
        inquiry: inquiries[index],
        message: '문의 상태가 업데이트되었습니다.',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Error updating inquiry' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestDelete(context: any) {
  try {
    const kv = context.env?.CANO_STORE;
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!kv || !id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let inquiries: any[] = (await kv.get('cano_inquiries_data', { type: 'json' })) || [];
    if (!Array.isArray(inquiries)) inquiries = [];

    const filtered = inquiries.filter((i: any) => i.id !== id);
    await kv.put('cano_inquiries_data', JSON.stringify(filtered));

    return new Response(JSON.stringify({ success: true, message: `문의 #${id}가 삭제되었습니다.` }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Error deleting inquiry' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
