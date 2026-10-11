export async function onRequestPost(context: any) {
  try {
    const kv = context.env?.CANO_STORE;
    const body = await context.request.json();
    const { orderId, name, phone } = body;

    let allOrders: any[] = [];
    if (kv) {
      const stored = await kv.get('cano_orders_data', { type: 'json' });
      if (Array.isArray(stored)) {
        allOrders = stored;
      }
    }

    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const cleanName = (name || '').trim().toLowerCase();
    const cleanOrderId = (orderId || '').trim().toLowerCase();

    const matched = allOrders.filter((o: any) => {
      if (cleanOrderId) {
        return (o.orderId || '').toLowerCase().includes(cleanOrderId);
      }
      if (cleanName && cleanPhone) {
        const oName = (o.customerName || '').trim().toLowerCase();
        const oPhone = (o.customerPhone || '').replace(/[^0-9]/g, '');
        return (oName === cleanName || oName.includes(cleanName)) && (oPhone.includes(cleanPhone) || cleanPhone.includes(oPhone));
      }
      return false;
    });

    return new Response(
      JSON.stringify({
        success: true,
        orders: matched,
        count: matched.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
