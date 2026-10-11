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
      JSON.stringify({ success: false, error: e.message || 'Error fetching orders' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestPost(context: any) {
  try {
    const kv = context.env?.CANO_STORE;
    const body = await context.request.json();

    if (!body || !body.orderId) {
      return new Response(
        JSON.stringify({ success: false, error: '주문 정보(orderId)가 필요합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (kv) {
      let orders: any[] = (await kv.get('cano_orders_data', { type: 'json' })) || [];
      if (!Array.isArray(orders)) orders = [];

      // Check for duplicate orderId
      const existingIdx = orders.findIndex((o: any) => o.orderId === body.orderId);
      if (existingIdx !== -1) {
        orders[existingIdx] = { ...orders[existingIdx], ...body };
      } else {
        orders.unshift({
          ...body,
          createdAt: body.createdAt || new Date().toISOString(),
        });
      }

      await kv.put('cano_orders_data', JSON.stringify(orders));
    }

    return new Response(JSON.stringify({ success: true, orderId: body.orderId }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Error saving order' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
