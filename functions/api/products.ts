export async function onRequestGet(context: any) {
  try {
    const kv = context.env?.CANO_STORE;
    let overrides: Record<string, any> = {};

    if (kv) {
      const stored = await kv.get("product_overrides", { type: "json" });
      if (stored) {
        overrides = stored;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        overrides,
        updatedAt: new Date().toISOString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
          "Pragma": "no-cache",
          "Expires": "0",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || "Error fetching products" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestPost(context: any) {
  try {
    const kv = context.env?.CANO_STORE;
    const body = await context.request.json();
    const { productId, isDelete, clearAll, ...updates } = body;

    if (!kv) {
      return new Response(
        JSON.stringify({ success: false, error: "KV storage not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let overrides: Record<string, any> = (await kv.get("product_overrides", { type: "json" })) || {};

    if (clearAll) {
      overrides = {};
    } else if (isDelete && productId) {
      delete overrides[productId];
    } else if (productId) {
      overrides[productId] = {
        ...(overrides[productId] || {}),
        ...updates,
        id: productId,
        updatedAt: new Date().toISOString(),
      };
    }

    await kv.put("product_overrides", JSON.stringify(overrides));

    return new Response(
      JSON.stringify({
        success: true,
        message: isDelete
          ? "상품이 성공적으로 삭제되었습니다."
          : "상품 상세 정보가 실시간으로 성공적으로 저장되었습니다.",
        overrides,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || "Error updating product" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
