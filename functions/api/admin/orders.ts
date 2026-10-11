export async function onRequestGet(context: any) {
  try {
    const kv = context.env?.CANO_STORE;
    let orders: any[] = [];

    if (kv) {
      const stored = await kv.get('cano_orders_data', { type: 'json' });
      if (Array.isArray(stored)) {
        orders = stored;
      }
    }

    return new Response(JSON.stringify({ success: true, orders, totalCount: orders.length }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || '주문 목록 조회 실패' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestPatch(context: any) {
  try {
    const kv = context.env?.CANO_STORE;
    const body = await context.request.json();
    const { orderId, status, courier, trackingNumber } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: '주문번호(orderId)가 필요합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!kv) {
      return new Response(
        JSON.stringify({ success: false, error: 'KV 스토리지가 연결되지 않았습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let orders: any[] = (await kv.get('cano_orders_data', { type: 'json' })) || [];
    if (!Array.isArray(orders)) orders = [];

    const index = orders.findIndex((o: any) => o.orderId === orderId);
    if (index === -1) {
      return new Response(
        JSON.stringify({ success: false, error: '해당 주문을 찾을 수 없습니다.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (status !== undefined) orders[index].status = status;
    if (courier !== undefined) orders[index].courier = courier;
    if (trackingNumber !== undefined) orders[index].trackingNumber = trackingNumber;
    orders[index].updatedAt = new Date().toISOString();

    await kv.put('cano_orders_data', JSON.stringify(orders));

    return new Response(
      JSON.stringify({
        success: true,
        order: orders[index],
        message: '주문 정보가 실서버에 저장되었습니다.',
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
      JSON.stringify({ success: false, error: e.message || '주문 상태 업데이트 실패' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestDelete(context: any) {
  try {
    const kv = context.env?.CANO_STORE;
    const url = new URL(context.request.url);
    const orderId = url.searchParams.get('orderId');
    const clearAll = url.searchParams.get('clearAll') === 'true';

    if (!kv) {
      return new Response(
        JSON.stringify({ success: false, error: 'KV storage missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (clearAll) {
      await kv.put('cano_orders_data', JSON.stringify([]));
      return new Response(JSON.stringify({ success: true, message: '모든 주문이 초기화되었습니다.' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: '삭제할 orderId가 필요합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let orders: any[] = (await kv.get('cano_orders_data', { type: 'json' })) || [];
    if (!Array.isArray(orders)) orders = [];

    const filtered = orders.filter((o: any) => o.orderId !== orderId);
    await kv.put('cano_orders_data', JSON.stringify(filtered));

    return new Response(JSON.stringify({ success: true, message: `주문 #${orderId}이 삭제되었습니다.` }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || '주문 삭제 실패' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
