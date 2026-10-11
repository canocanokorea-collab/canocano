function getKSTDateString(d = new Date()): string {
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(d.getTime() + kstOffset);
  return kstDate.toISOString().slice(0, 10);
}

const DEFAULT_ANALYTICS = () => ({
  today: getKSTDateString(),
  todayUV: 0,
  todayPV: 0,
  totalPV: 0,
  todayVisitors: [] as string[],
  devices: { mobile: 0, desktop: 0 },
  referrers: {} as Record<string, number>,
  pageViews: {} as Record<string, number>,
  lastUpdated: new Date().toISOString(),
});

export async function onRequestGet(context: any) {
  try {
    const kv = context.env?.CANO_STORE;
    const today = getKSTDateString();

    let data = DEFAULT_ANALYTICS();

    if (kv) {
      const stored = await kv.get('cano_analytics_data', { type: 'json' });
      if (stored) {
        data = {
          ...data,
          ...stored,
        };
      }
    }

    // If date has rolled over to a new KST day, reset today's daily counters
    if (data.today !== today) {
      data.today = today;
      data.todayUV = 0;
      data.todayPV = 0;
      data.todayVisitors = [];
      data.lastUpdated = new Date().toISOString();
      if (kv) {
        await kv.put('cano_analytics_data', JSON.stringify(data));
      }
    }

    // Do not return todayVisitors array to keep payload lightweight
    const { todayVisitors, ...safeData } = data;

    return new Response(JSON.stringify({ success: true, analytics: safeData }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Error fetching analytics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function onRequestPost(context: any) {
  try {
    const kv = context.env?.CANO_STORE;
    if (!kv) {
      return new Response(
        JSON.stringify({ success: false, error: 'KV storage not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await context.request.json().catch(() => ({}));
    const { path, referrer, isMobile, visitorId } = body;

    // Do not count visits to /admin or /api as customer traffic
    if (path && (path.startsWith('/admin') || path.startsWith('/api'))) {
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const today = getKSTDateString();
    let data = (await kv.get('cano_analytics_data', { type: 'json' })) || DEFAULT_ANALYTICS();

    // Reset for new day
    if (data.today !== today) {
      data.today = today;
      data.todayUV = 0;
      data.todayPV = 0;
      data.todayVisitors = [];
    }

    // 1. UV check
    const vid = visitorId ? String(visitorId).slice(0, 40) : null;
    if (vid) {
      if (!Array.isArray(data.todayVisitors)) {
        data.todayVisitors = [];
      }
      if (!data.todayVisitors.includes(vid)) {
        data.todayVisitors.push(vid);
        if (data.todayVisitors.length > 5000) {
          data.todayVisitors = data.todayVisitors.slice(-4000);
        }
        data.todayUV = (data.todayUV || 0) + 1;
      }
    } else {
      data.todayUV = (data.todayUV || 0) + 1;
    }

    // 2. PV increment
    data.todayPV = (data.todayPV || 0) + 1;
    data.totalPV = (data.totalPV || 0) + 1;

    // 3. Device breakdown
    if (!data.devices) data.devices = { mobile: 0, desktop: 0 };
    if (isMobile) {
      data.devices.mobile = (data.devices.mobile || 0) + 1;
    } else {
      data.devices.desktop = (data.devices.desktop || 0) + 1;
    }

    // 4. Page path breakdown
    if (!data.pageViews) data.pageViews = {};
    const cleanPath = path && path.trim() ? path.split('?')[0] : '/';
    data.pageViews[cleanPath] = (data.pageViews[cleanPath] || 0) + 1;

    // 5. Referrer breakdown
    if (!data.referrers) data.referrers = {};
    let refKey = '직접 접속 (Direct / Bookmark)';
    if (referrer && typeof referrer === 'string') {
      try {
        const refUrl = new URL(referrer);
        const host = refUrl.hostname.toLowerCase();
        if (host.includes('naver.com')) refKey = '네이버 (Naver)';
        else if (host.includes('google.')) refKey = '구글 (Google)';
        else if (host.includes('daum.net') || host.includes('kakao.com')) refKey = '카카오/다음 (Kakao/Daum)';
        else if (host.includes('instagram.com')) refKey = '인스타그램 (Instagram)';
        else if (host.includes('facebook.com')) refKey = '페이스북 (Facebook)';
        else if (host.includes('youtube.com')) refKey = '유튜브 (YouTube)';
        else if (host.includes('canocano.shop') || host.includes('pages.dev') || host.includes('localhost')) {
          refKey = ''; // Internal navigation
        } else {
          refKey = host;
        }
      } catch {
        refKey = '기타 외부 링크';
      }
    }

    if (refKey) {
      data.referrers[refKey] = (data.referrers[refKey] || 0) + 1;
    }

    data.lastUpdated = new Date().toISOString();

    await kv.put('cano_analytics_data', JSON.stringify(data));

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, error: e.message || 'Error tracking analytics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
