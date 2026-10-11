'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export interface RealAnalyticsData {
  today: string;
  todayUV: number;
  todayPV: number;
  totalPV: number;
  devices: {
    mobile: number;
    desktop: number;
  };
  referrers: Record<string, number>;
  pageViews: Record<string, number>;
  lastUpdated: string;
}

export function getTodayDateString(): string {
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(Date.now() + kstOffset);
  return kstDate.toISOString().slice(0, 10);
}

export async function fetchServerAnalytics(): Promise<RealAnalyticsData | null> {
  try {
    const res = await fetch('/api/analytics', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.analytics) {
        return data.analytics;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch server analytics:', e);
  }
  return null;
}

export function getRealAnalytics(): RealAnalyticsData {
  const today = getTodayDateString();
  const defaultData: RealAnalyticsData = {
    today,
    todayUV: 0,
    todayPV: 0,
    totalPV: 0,
    devices: { mobile: 0, desktop: 0 },
    referrers: {},
    pageViews: {},
    lastUpdated: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return defaultData;

  const stored = localStorage.getItem('cano_real_analytics');
  if (!stored) return defaultData;

  try {
    const parsed: RealAnalyticsData = JSON.parse(stored);
    if (parsed.today !== today) {
      parsed.today = today;
      parsed.todayUV = 0;
      parsed.todayPV = 0;
      localStorage.setItem('cano_real_analytics', JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return defaultData;
  }
}

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let vid = localStorage.getItem('cano_vid');
  if (!vid) {
    vid = 'vid_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('cano_vid', vid);
  }
  return vid;
}

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Do not track admin page or API routes as customer traffic
    if (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/api'))) return;

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const visitorId = getOrCreateVisitorId();
    const referrer = document.referrer || '';
    const cleanPath = pathname || '/';

    // 1. Send real telemetry to Cloudflare KV server endpoint
    try {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: cleanPath,
          referrer,
          isMobile,
          visitorId,
        }),
      }).catch(() => {});
    } catch {}

    // 2. Local fallback update for offline/instant feedback
    const today = getTodayDateString();
    let stats = getRealAnalytics();
    const vidKey = `cano_visited_${today}`;
    const isNewToday = !localStorage.getItem(vidKey);

    if (isNewToday) {
      localStorage.setItem(vidKey, '1');
      stats.todayUV = (stats.todayUV || 0) + 1;
    }

    stats.todayPV = (stats.todayPV || 0) + 1;
    stats.totalPV = (stats.totalPV || 0) + 1;

    if (!stats.devices) stats.devices = { mobile: 0, desktop: 0 };
    if (isMobile) {
      stats.devices.mobile = (stats.devices.mobile || 0) + 1;
    } else {
      stats.devices.desktop = (stats.devices.desktop || 0) + 1;
    }

    if (!stats.pageViews) stats.pageViews = {};
    stats.pageViews[cleanPath] = (stats.pageViews[cleanPath] || 0) + 1;

    stats.lastUpdated = new Date().toISOString();
    try {
      localStorage.setItem('cano_real_analytics', JSON.stringify(stats));
    } catch {}
  }, [pathname]);

  return null;
}
