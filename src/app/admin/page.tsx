'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProducts } from '@/lib/useProducts';
import { Product } from '@/types';
import { getRealAnalytics, RealAnalyticsData } from '@/components/VisitorTracker';
import {
  Lock,
  Eye,
  EyeOff,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Package,
  MessageSquare,
  BarChart3,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  X,
  Download,
  Filter,
  RefreshCw,
  Sparkles,
  Smartphone,
  Monitor,
  Inbox,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  options?: Record<string, string>;
}

interface OrderRecord {
  orderId: string;
  paymentKey?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  addressMain: string;
  addressDetail?: string;
  postalCode?: string;
  deliveryMemo?: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  status: '결제완료' | '배송준비중' | '배송중' | '배송완료' | '취소/환불';
  courier?: string;
  trackingNumber?: string;
  createdAt: string;
}

interface InquiryRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  productName?: string;
  content: string;
  status: '답변대기' | '답변완료';
  createdAt: string;
}

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [token, setToken] = useState<string>('');

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'inquiries' | 'analytics'>('overview');

  // Real Analytics State
  const [analytics, setAnalytics] = useState<RealAnalyticsData>({
    today: new Date().toISOString().slice(0, 10),
    todayUV: 0,
    todayPV: 0,
    totalPV: 0,
    devices: { mobile: 0, desktop: 0 },
    referrers: {},
    pageViews: {},
    lastUpdated: new Date().toISOString(),
  });

  // Orders State (100% Real)
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [editingTracking, setEditingTracking] = useState<{ orderId: string; courier: string; trackingNumber: string } | null>(null);

  // Products State (Real-Time Cloudflare KV Sync)
  const { products: productsList, updateProduct, deleteProduct } = useProducts();
  const [editingProductDetail, setEditingProductDetail] = useState<Product | null>(null);

  // Helper to calculate next available product numeric ID
  const getNextProductId = () => {
    const numericIds = productsList
      .map((p) => parseInt(p.id, 10))
      .filter((n) => !isNaN(n));
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    return (maxId + 1).toString();
  };

  // Inquiries State (100% Real)
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);

  // Load Real Data on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('cano_admin_token') || sessionStorage.getItem('cano_admin_token');
    if (savedToken && savedToken.startsWith('cano_adm_')) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }

    loadRealData();
  }, []);

  const FAKE_ORDER_IDS = ['ORD-20260829-001', 'ORD-20260828-002', 'ORD-20260827-003'];
  const FAKE_INQUIRY_IDS = ['INQ-001', 'INQ-002'];

  const loadRealData = async () => {
    // 1. Real Visitor Analytics from Cloudflare KV (KST)
    try {
      const res = await fetch('/api/analytics', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analytics) {
          setAnalytics(data.analytics);
          localStorage.setItem('cano_real_analytics', JSON.stringify(data.analytics));
        }
      } else {
        const fallback = getRealAnalytics();
        setAnalytics(fallback);
      }
    } catch {
      const fallback = getRealAnalytics();
      setAnalytics(fallback);
    }

    // 2. Real Orders from Cloudflare KV
    try {
      const res = await fetch('/api/admin/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
          localStorage.setItem('cano_admin_orders', JSON.stringify(data.orders));
        }
      } else {
        const savedOrders = localStorage.getItem('cano_admin_orders');
        if (savedOrders) {
          try {
            setOrders(JSON.parse(savedOrders));
          } catch {}
        }
      }
    } catch {
      const savedOrders = localStorage.getItem('cano_admin_orders');
      if (savedOrders) {
        try {
          setOrders(JSON.parse(savedOrders));
        } catch {}
      }
    }

    // 3. Real Inquiries from Cloudflare KV
    try {
      const res = await fetch('/api/admin/inquiries', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.inquiries)) {
          setInquiries(data.inquiries);
          localStorage.setItem('cano_admin_inquiries', JSON.stringify(data.inquiries));
        }
      } else {
        const savedInquiries = localStorage.getItem('cano_admin_inquiries');
        if (savedInquiries) {
          try {
            setInquiries(JSON.parse(savedInquiries));
          } catch {}
        }
      }
    } catch {
      const savedInquiries = localStorage.getItem('cano_admin_inquiries');
      if (savedInquiries) {
        try {
          setInquiries(JSON.parse(savedInquiries));
        } catch {}
      }
    }
  };

  // Clear all cached test data manually
  const handleClearTestData = async () => {
    if (!window.confirm('모든 주문 데이터를 초기화하시겠습니까?')) return;
    try {
      await fetch('/api/admin/orders?clearAll=true', { method: 'DELETE' });
    } catch {}
    localStorage.removeItem('cano_admin_orders');
    localStorage.removeItem('cano_admin_inquiries');
    setOrders([]);
    setInquiries([]);
    showToast('모든 주문 데이터가 초기화되었습니다. 현재 실제 주문 0건입니다.', 'info');
  };

  // Save changes to localStorage & server
  const saveOrders = (newOrders: OrderRecord[]) => {
    setOrders(newOrders);
    localStorage.setItem('cano_admin_orders', JSON.stringify(newOrders));
  };

  const saveInquiries = (newInquiries: InquiryRecord[]) => {
    setInquiries(newInquiries);
    localStorage.setItem('cano_admin_inquiries', JSON.stringify(newInquiries));
  };

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoadingAuth(true);

    setTimeout(() => {
      if (passwordInput === 'cano2026!') {
        const generatedToken = `cano_adm_${Date.now()}_auth`;
        sessionStorage.setItem('cano_admin_token', generatedToken);
        localStorage.setItem('cano_admin_token', generatedToken);
        setToken(generatedToken);
        setIsAuthenticated(true);
        setPasswordInput('');
        loadRealData();
      } else {
        setAuthError('관리자 비밀번호가 올바르지 않습니다.');
      }
      setIsLoadingAuth(false);
    }, 250);
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem('cano_admin_token');
    localStorage.removeItem('cano_admin_token');
    setToken('');
    setIsAuthenticated(false);
  };

  // Update order status
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderRecord['status'],
    courier?: string,
    trackingNumber?: string
  ) => {
    const updated = orders.map((o) =>
      o.orderId === orderId
        ? {
            ...o,
            status: newStatus,
            courier: courier !== undefined ? courier : o.courier,
            trackingNumber: trackingNumber !== undefined ? trackingNumber : o.trackingNumber,
          }
        : o
    );
    saveOrders(updated);
    if (selectedOrder && selectedOrder.orderId === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              courier: courier !== undefined ? courier : prev.courier,
              trackingNumber: trackingNumber !== undefined ? trackingNumber : prev.trackingNumber,
            }
          : null
      );
    }

    // Sync to Cloudflare KV
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus, courier, trackingNumber }),
      });
      if (res.ok) {
        showToast(`✅ 주문 #${orderId} 상태가 '${newStatus}'(으)로 실서버에 저장되었습니다.`);
      } else {
        showToast('⚠️ 실서버 저장 중 오류가 발생했습니다.', 'error');
      }
    } catch {
      showToast('⚠️ 네트워크 연결을 확인해주세요.', 'error');
    }
  };

  // Toggle Inquiry Status
  const handleToggleInquiry = async (id: string, currentStatus: '답변대기' | '답변완료') => {
    const newStatus: '답변대기' | '답변완료' = currentStatus === '답변대기' ? '답변완료' : '답변대기';
    const updated = inquiries.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq));
    saveInquiries(updated);

    try {
      await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      showToast(`✅ 문의 #${id} 상태가 '${newStatus}'로 변경되었습니다.`);
    } catch {
      showToast('⚠️ 문의 상태 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  // 1. Toggle Product Status (판매중 <-> 품절)
  const handleToggleProductStatus = async (productId: string, currentStatus: string) => {
    const nextStatus = currentStatus === '판매중' ? '품절' : '판매중';
    showToast(`⏳ '${nextStatus}'(으)로 서버 저장 중...`, 'info');
    const ok = await updateProduct(productId, { status: nextStatus });
    if (ok) {
      showToast(`✅ [${nextStatus}] 상태로 실시간 반영 완료!`);
    } else {
      showToast(`⚠️ 저장 중 오류가 발생했습니다.`, 'error');
    }
  };

  // 2. Toggle Product Display (노출중 <-> 숨김)
  const handleToggleProductDisplay = async (productId: string, currentDisplayed?: boolean) => {
    const isCurrentlyVisible = currentDisplayed !== false;
    const nextDisplayed = !isCurrentlyVisible;
    showToast(`⏳ [${nextDisplayed ? '노출' : '숨김'}] 상태로 서버 저장 중...`, 'info');
    const ok = await updateProduct(productId, { isDisplayed: nextDisplayed });
    if (ok) {
      showToast(`✅ [${nextDisplayed ? '쇼핑몰에 정상 노출' : '쇼핑몰에서 완전히 숨김'}] 처리 완료!`);
    } else {
      showToast(`⚠️ 저장 중 오류가 발생했습니다.`, 'error');
    }
  };

  // 3. Update Product Price (가격 수정)
  const handleUpdateProductPrice = async (productId: string, currentPrice: number) => {
    const input = window.prompt('변경할 상품 가격을 입력하세요 (원):', currentPrice.toString());
    if (input === null) return;
    const newPrice = parseInt(input.replace(/[^0-9]/g, ''), 10);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('올바른 금액을 입력해 주세요.');
      return;
    }
    showToast(`⏳ 가격 ${newPrice.toLocaleString()}원으로 서버 저장 중...`, 'info');
    const ok = await updateProduct(productId, { price: newPrice });
    if (ok) {
      showToast(`✅ 가격이 ${newPrice.toLocaleString()}원으로 실시간 반영 완료!`);
    } else {
      showToast(`⚠️ 가격 저장 중 오류가 발생했습니다.`, 'error');
    }
  };

  // 4. Image File Upload & Auto-Compress Helper (Maintains exact aspect ratio, Crisp WebP/JPEG, Max 1200px)
  const handleImageFileUpload = (
    file: File,
    callback: (dataUrl: string) => void,
    maxDimension = 1200
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Proportional scaling without distortion or accidental cropping
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as compressed WebP (or fallback to JPEG) to avoid multi-megabyte payloads
          let compressedDataUrl = '';
          try {
            compressedDataUrl = canvas.toDataURL('image/webp', 0.82);
            if (!compressedDataUrl.startsWith('data:image/webp')) {
              compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            }
          } catch {
            compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          }
          callback(compressedDataUrl);
        } else {
          callback(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 5. Open Product Detail Modal (Auto-Extract Existing Images from detailHtml)
  const handleOpenEditProduct = (product: Product) => {
    const clone = JSON.parse(JSON.stringify(product));
    if (!clone.detailBodyImages || clone.detailBodyImages.length === 0) {
      const imgRegex = /<img[^>]+src=["\x27]([^"\x27]+)["\x27]/gi;
      const images: string[] = [];
      let match;
      while ((match = imgRegex.exec(clone.detailHtml || '')) !== null) {
        images.push(match[1]);
      }
      clone.detailBodyImages = images;
    }
    setEditingProductDetail(clone);
  };

  // 6. Duplicate Product (상품 복사 기능)
  const handleDuplicateProduct = (product: Product) => {
    const newId = getNextProductId();
    const clone: Product = JSON.parse(JSON.stringify(product));

    if (!clone.detailBodyImages || clone.detailBodyImages.length === 0) {
      const imgRegex = /<img[^>]+src=["\x27]([^"\x27]+)["\x27]/gi;
      const images: string[] = [];
      let match;
      while ((match = imgRegex.exec(clone.detailHtml || '')) !== null) {
        images.push(match[1]);
      }
      clone.detailBodyImages = images;
    }

    clone.id = newId;
    clone.name = `${product.name} (복사본)`;
    clone.isDisplayed = false; // Draft mode by default for safety
    clone.status = '판매중';
    clone.createdAt = new Date().toISOString();

    setEditingProductDetail(clone);
    showToast(`📋 상품이 복제되었습니다! (새 ID: #${newId}) 사진/내용 수정 후 [실시간 저장]을 눌러주세요.`, 'info');
  };

  // 7. Add Brand New Product (새 상품 직접 등록)
  const handleAddNewProduct = () => {
    const newId = getNextProductId();
    const newProduct: Product = {
      id: newId,
      name: '새 상품',
      category: '테이블/식탁',
      categoryId: 'furniture',
      price: 100000,
      originalPrice: 0,
      status: '판매중',
      isDisplayed: false, // Default hidden draft
      mainImage: '',
      detailImages: [],
      detailBodyImages: [],
      detailNoticeText: '• 핸드메이드 주문 제작 상품으로 영업일 기준 약 5~10일 소요됩니다.\n• 천연 원목 특성상 나뭇결과 옹이의 위치가 제품마다 다를 수 있습니다.',
      detailHtml: '',
      options: [
        { name: '종류', values: ['기본형'] },
      ],
      delivery: {
        type: '화물택배',
        fee: 0,
        freeThreshold: 50000,
      },
      createdAt: new Date().toISOString(),
    };

    setEditingProductDetail(newProduct);
    showToast(`➕ 새 상품 등록 창이 열렸습니다. (새 ID: #${newId})`, 'info');
  };

  // 8. Delete Product (직접 추가된 상품 삭제)
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (
      window.confirm(
        `'${productName}' (ID: #${productId}) 상품을 정말로 삭제하시겠습니까?\n\n삭제 후에는 쇼핑몰 및 관리자 목록에서 즉시 제거됩니다.`
      )
    ) {
      showToast('⏳ 상품 삭제 중...', 'info');
      const ok = await deleteProduct(productId);
      if (ok) {
        showToast(`🗑️ '${productName}' 상품이 삭제되었습니다.`);
      } else {
        showToast('⚠️ 삭제 중 오류가 발생했습니다.', 'error');
      }
    }
  };

  // Export Orders CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert('다운로드할 실제 주문 내역이 없습니다.');
      return;
    }
    const headers = ['주문번호,주문일시,주문자,연락처,상품정보,결제금액,배송상태,배송지,운송장번호'];
    const rows = orders.map((o) => {
      const itemsStr = o.items.map((i) => `${i.name}(${i.quantity}개)`).join(' | ');
      return `"${o.orderId}","${new Date(o.createdAt).toLocaleString('ko-KR')}","${o.customerName}","${o.customerPhone}","${itemsStr}","${o.totalAmount}","${o.status}","${o.addressMain} ${o.addressDetail || ''}","${o.courier || ''} ${o.trackingNumber || ''}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CANOCANO_Real_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.orderId.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.includes(orderSearch) ||
      o.customerPhone.includes(orderSearch) ||
      o.items.some((i) => i.name.includes(orderSearch));
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  // Calculate Real stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === '배송준비중' || o.status === '결제완료').length;
  const shippingOrders = orders.filter((o) => o.status === '배송중').length;
  const completedOrders = orders.filter((o) => o.status === '배송완료').length;

  const totalDeviceViews = (analytics.devices.mobile || 0) + (analytics.devices.desktop || 0);
  const mobilePercent = totalDeviceViews > 0 ? Math.round(((analytics.devices.mobile || 0) / totalDeviceViews) * 100) : 0;
  const desktopPercent = totalDeviceViews > 0 ? 100 - mobilePercent : 0;

  // -------------------------------------------------------------
  // 1. LOGIN SCREEN (When not authenticated)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-[#fbfbf9]">
        <div className="w-full max-w-md bg-white border border-[#27397d]/15 shadow-xl rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#27397d] text-[#a7f99e] rounded-2xl shadow-md mb-2">
              <Lock size={28} />
            </div>
            <h1 className="font-montserrat text-2xl font-bold text-[#27397d] tracking-wide">
              CANO CANO ADMIN
            </h1>
            <p className="text-xs text-[#27397d]/70 font-medium">
              카노카노 쇼핑몰 실시간 관리자 대시보드
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#27397d] mb-1.5">
                관리자 마스터 비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27397d] text-sm text-[#27397d]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#27397d] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="flex items-center space-x-1.5 text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-lg">
                <AlertCircle size={14} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoadingAuth}
              className="w-full bg-[#27397d] text-[#a7f99e] py-3.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isLoadingAuth ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <span>관리자 로그인</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100 text-center">
            <Link
              href="/"
              className="text-xs text-[#27397d]/60 hover:text-[#27397d] font-medium transition-colors"
            >
              ← 쇼핑몰 메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATED ADMIN DASHBOARD (100% Real-Time Data)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* Top Header Bar */}
      <header className="bg-[#27397d] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="font-montserrat font-bold text-xl tracking-wider text-[#a7f99e] hover:brightness-110">
              CANO CANO
            </Link>
            <span className="text-xs bg-emerald-500/20 text-[#a7f99e] border border-[#a7f99e]/40 px-2.5 py-0.5 rounded-full font-mono flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#a7f99e] animate-pulse"></span>
              <span>LIVE REAL-TIME</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs text-white/80 hover:text-[#a7f99e] transition-colors"
            >
              <span>쇼핑몰 바로가기</span>
              <ExternalLink size={13} />
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <LogOut size={14} />
              <span>로그아웃</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-4 border-t border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold flex items-center space-x-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#a7f99e] text-[#a7f99e]'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <LayoutDashboard size={16} />
            <span>종합 대시보드</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold flex items-center space-x-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#a7f99e] text-[#a7f99e]'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <Package size={16} />
            <span>실제 주문/배송 관리</span>
            {orders.length > 0 && (
              <span className="bg-[#a7f99e] text-[#27397d] text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {orders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold flex items-center space-x-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'products'
                ? 'border-[#a7f99e] text-[#a7f99e]'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <ShoppingBag size={16} />
            <span>상품/재고 관리</span>
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold flex items-center space-x-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'inquiries'
                ? 'border-[#a7f99e] text-[#a7f99e]'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <MessageSquare size={16} />
            <span>1:1 고객 문의</span>
            {inquiries.filter((i) => i.status === '답변대기').length > 0 && (
              <span className="bg-red-400 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {inquiries.filter((i) => i.status === '답변대기').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold flex items-center space-x-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-[#a7f99e] text-[#a7f99e]'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            <BarChart3 size={16} />
            <span>실시간 방문자 통계</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ============================================================== */}
        {/* TAB 1: REAL-TIME OVERVIEW */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Stat Cards (100% Real-Time Stats) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Real Today Visitors */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-bold text-[#27397d]/70">오늘 실제 방문자 (UV)</span>
                  <span className="p-2 bg-blue-50 text-[#27397d] rounded-xl"><BarChart3 size={18} /></span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#27397d]">
                  {analytics.todayUV}명
                </div>
                <p className="text-[11px] text-emerald-600 font-bold flex items-center">
                  ● 실제 실시간 접속자 집계 중
                </p>
              </div>

              {/* Card 2: Real Today Pageviews */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-bold text-[#27397d]/70">오늘 실제 페이지뷰 (PV)</span>
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Sparkles size={18} /></span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#27397d]">
                  {analytics.todayPV}회
                </div>
                <p className="text-[11px] text-[#27397d]/60 font-medium">
                  누적 총 뷰: {analytics.totalPV}회
                </p>
              </div>

              {/* Card 3: Real Total Revenue */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-bold text-[#27397d]/70">실제 결제 완료 매출</span>
                  <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><ShoppingBag size={18} /></span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#27397d]">
                  {totalRevenue.toLocaleString()}원
                </div>
                <p className="text-[11px] text-[#27397d]/70 font-medium">
                  실제 주문: {orders.length}건
                </p>
              </div>

              {/* Card 4: Real Shipping Pending */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-bold text-[#27397d]/70">배송 대기 주문</span>
                  <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Truck size={18} /></span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#27397d]">{pendingOrders}건</span>
                  <span className="text-xs text-amber-600 font-bold">배송준비/결제</span>
                </div>
                <p className="text-[11px] text-[#27397d]/60 font-medium">
                  배송중 {shippingOrders}건 / 완료 {completedOrders}건
                </p>
              </div>
            </div>

            {/* Quick External Tools Cards */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#27397d] flex items-center space-x-2">
                <ShieldCheck size={16} />
                <span>공식 외부 관제 & 실시간 통계 바로가기</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                  href="https://dash.cloudflare.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#27397d] hover:bg-stone-50 transition-all group"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-[#27397d] group-hover:text-blue-600">
                      Cloudflare 웹로그 분석
                    </div>
                    <div className="text-xs text-gray-500">Cloudflare 서버 실시간 트래픽/국가/IP 로그</div>
                  </div>
                  <ExternalLink size={16} className="text-gray-400 group-hover:text-[#27397d]" />
                </a>

                <a
                  href="https://admin.tosspayments.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#27397d] hover:bg-stone-50 transition-all group"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-[#27397d] group-hover:text-blue-600">
                      토스페이먼츠 상점 관리자
                    </div>
                    <div className="text-xs text-gray-500">실시간 카드 승인/정산 내역 확인</div>
                  </div>
                  <ExternalLink size={16} className="text-gray-400 group-hover:text-[#27397d]" />
                </a>

                <a
                  href="https://discord.com/app"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#27397d] hover:bg-stone-50 transition-all group"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-[#27397d] group-hover:text-indigo-600">
                      디스코드 관제실 알림
                    </div>
                    <div className="text-xs text-gray-500">#orders, #inquiries 실시간 푸시</div>
                  </div>
                  <ExternalLink size={16} className="text-gray-400 group-hover:text-[#27397d]" />
                </a>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#27397d] flex items-center space-x-2">
                  <Clock size={16} />
                  <span>실제 접수된 최근 주문</span>
                </h2>
                {orders.length > 0 && (
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[#27397d] hover:underline"
                  >
                    전체 주문 보기 →
                  </button>
                )}
              </div>

              {orders.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-[#fbfbf9] rounded-xl border border-dashed border-gray-200">
                  <Inbox size={32} className="mx-auto text-gray-300" />
                  <p className="text-xs font-bold text-[#27397d]/70">
                    아직 접수된 실제 주문이 없습니다.
                  </p>
                  <p className="text-[11px] text-gray-400">
                    고객이 쇼핑몰에서 결제를 완료하면 이곳에 즉시 실시간으로 등록됩니다.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#27397d]">
                    <thead className="bg-[#f8f9fa] border-y border-gray-200 text-gray-500 font-bold uppercase">
                      <tr>
                        <th className="py-3 px-4">주문일시</th>
                        <th className="py-3 px-4">주문번호</th>
                        <th className="py-3 px-4">주문자</th>
                        <th className="py-3 px-4">주문상품</th>
                        <th className="py-3 px-4">결제금액</th>
                        <th className="py-3 px-4">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.orderId} className="hover:bg-stone-50 transition-colors">
                          <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold">{order.orderId}</td>
                          <td className="py-3 px-4">{order.customerName}</td>
                          <td className="py-3 px-4 max-w-xs truncate">
                            {order.items.map((i) => i.name).join(', ')}
                          </td>
                          <td className="py-3 px-4 font-bold whitespace-nowrap">
                            {order.totalAmount.toLocaleString()}원
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                order.status === '배송준비중'
                                  ? 'bg-amber-100 text-amber-800'
                                  : order.status === '배송중'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === '배송완료'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ORDER & SHIPPING MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-[#27397d]">실제 주문 및 배송 관리</h1>
                <p className="text-xs text-[#27397d]/70">
                  고객이 실제로 결제한 주문 목록을 확인하고 운송장 번호를 등록합니다.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleClearTestData}
                  className="inline-flex items-center space-x-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="브라우저에 남아있을 수 있는 이전 테스트 데이터를 완전히 비웁니다."
                >
                  <span>🗑️ 테스트 데이터 비우기</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center space-x-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-[#27397d] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Download size={14} />
                  <span>CSV 엑셀 다운로드</span>
                </button>
                <button
                  onClick={loadRealData}
                  className="inline-flex items-center space-x-1 bg-[#27397d] text-[#a7f99e] px-3.5 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-xs cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>실시간 새로고침</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="주문자명, 주문번호, 연락처, 상품명 검색"
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs text-[#27397d] focus:outline-none focus:ring-2 focus:ring-[#27397d]"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                {['all', '결제완료', '배송준비중', '배송중', '배송완료', '취소/환불'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      orderStatusFilter === st
                        ? 'bg-[#27397d] text-[#a7f99e]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st === 'all' ? '전체 상태' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#27397d]">
                  <thead className="bg-[#f8f9fa] border-b border-gray-200 text-gray-500 font-bold uppercase">
                    <tr>
                      <th className="py-3.5 px-4">주문번호 / 일시</th>
                      <th className="py-3.5 px-4">주문자 정보</th>
                      <th className="py-3.5 px-4">주문 상품 & 수량</th>
                      <th className="py-3.5 px-4">결제금액</th>
                      <th className="py-3.5 px-4">배송상태</th>
                      <th className="py-3.5 px-4">운송장 정보</th>
                      <th className="py-3.5 px-4 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-gray-400 space-y-2">
                          <Inbox size={28} className="mx-auto text-gray-300" />
                          <div className="font-bold text-[#27397d]/60">실제 주문 내역이 없습니다.</div>
                          <div className="text-[11px] text-gray-400">
                            고객이 쇼핑몰에서 결제를 진행하면 실시간으로 이곳에 등록됩니다.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.orderId} className="hover:bg-stone-50 transition-colors">
                          {/* Order ID & Date */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-sm text-[#27397d]">{order.orderId}</div>
                            <div className="text-[11px] text-gray-400">
                              {new Date(order.createdAt).toLocaleString('ko-KR')}
                            </div>
                          </td>

                          {/* Customer Info */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="font-bold text-[#27397d]">{order.customerName}</div>
                            <div className="text-gray-500">{order.customerPhone}</div>
                            <div className="text-[10px] text-gray-400">{order.customerEmail || ''}</div>
                          </td>

                          {/* Items */}
                          <td className="py-4 px-4 max-w-xs">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="space-y-0.5 mb-1.5 last:mb-0">
                                <div className="font-bold text-[#27397d]">
                                  {item.name} <span className="text-blue-600 font-black">× {item.quantity}</span>
                                </div>
                                {item.options && (
                                  <div className="text-[10px] text-gray-500 bg-gray-50 p-1 rounded">
                                    {Object.entries(item.options).map(([k, v]) => (
                                      <div key={k}>{k}: {v}</div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </td>

                          {/* Total Amount */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="font-bold text-sm text-[#27397d]">
                              {order.totalAmount.toLocaleString()}원
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {order.deliveryFee > 0 ? `배송비 +${order.deliveryFee.toLocaleString()}원` : '무료배송'}
                            </div>
                          </td>

                          {/* Status Selector */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(order.orderId, e.target.value as OrderRecord['status'])
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none cursor-pointer ${
                                order.status === '배송준비중'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : order.status === '배송중'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : order.status === '배송완료'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-gray-50 text-gray-800 border-gray-300'
                              }`}
                            >
                              <option value="결제완료">결제완료</option>
                              <option value="배송준비중">배송준비중</option>
                              <option value="배송중">배송중</option>
                              <option value="배송완료">배송완료</option>
                              <option value="취소/환불">취소/환불</option>
                            </select>
                          </td>

                          {/* Courier & Tracking */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {order.trackingNumber ? (
                              <div className="space-y-0.5">
                                <span className="text-[11px] font-bold text-gray-600">{order.courier || 'CJ대한통운'}</span>
                                <div className="font-mono text-xs font-bold text-[#27397d]">
                                  {order.trackingNumber}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setEditingTracking({
                                    orderId: order.orderId,
                                    courier: order.courier || 'CJ대한통운',
                                    trackingNumber: '',
                                  })
                                }
                                className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                              >
                                + 송장번호 입력
                              </button>
                            )}
                          </td>

                          {/* Detail Button */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-[#27397d] hover:text-[#a7f99e] text-[#27397d] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              상세보기
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PRODUCTS & INVENTORY */}
        {/* ============================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & New Product Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-[#27397d]">상품 및 재고 관리</h1>
                  <span className="bg-[#27397d] text-[#a7f99e] text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                    총 {productsList.length}개 상품
                  </span>
                </div>
                <p className="text-xs text-[#27397d]/70">
                  스마트폰/PC 어디서나 원클릭으로 판매/노출/가격 변경 및 <strong>[📋 복사]</strong> 버튼으로 새 상품을 10초 만에 쉽게 추가할 수 있습니다.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddNewProduct}
                className="bg-[#27397d] text-[#a7f99e] hover:brightness-110 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
              >
                <span className="text-base">➕</span>
                <span>새 상품 직접 등록</span>
              </button>
            </div>

            {/* Helpful Guide Callout */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3 text-xs text-[#27397d]">
              <Sparkles size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <span className="font-bold text-emerald-900 block">💡 집이나 모바일에서 10초 만에 새 상품 추가하는 꿀팁</span>
                <span>
                  기존에 등록된 비슷한 상품의 <strong>[📋 복사]</strong> 버튼을 누르면 대표 사진, 옵션, 배송비가 그대로 복제되어 열립니다.
                  새로운 사진과 상품명만 바꿔서 <strong>[실시간 저장하기]</strong>를 누르면 즉시 쇼핑몰에 새 상품이 등록됩니다!
                  (복사 시 실수 방지를 위해 처음에는 <strong>[숨김]</strong> 상태로 생성되니 안심하고 편집하세요.)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {productsList.map((product) => {
                const isHidden = product.isDisplayed === false;
                const isSoldOut = product.status === '품절';
                const isCustomProduct = parseInt(product.id, 10) >= 30;

                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-2xl border transition-all flex flex-col justify-between shadow-xs hover:shadow-md overflow-hidden ${
                      isHidden
                        ? 'border-dashed border-gray-300 bg-gray-50/60 opacity-90'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="p-4 flex space-x-3.5">
                      {/* Thumbnail */}
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                        {product.mainImage ? (
                          <Image
                            src={product.mainImage}
                            alt={product.name}
                            fill
                            unoptimized
                            className={`object-cover ${isSoldOut ? 'opacity-60 grayscale' : ''}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">
                            사진 없음
                          </div>
                        )}
                        {isSoldOut && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-white uppercase bg-black/80 px-1 py-0.5 rounded">
                              SOLDOUT
                            </span>
                          </div>
                        )}
                        {isHidden && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                            숨김
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="text-[10px] font-bold text-gray-500 font-mono bg-gray-100 px-1.5 py-0.2 rounded">
                            #{product.id}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">
                            {product.category || '가구/소품'}
                          </span>
                          {isCustomProduct && (
                            <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded">
                              ✨ 직접 추가됨
                            </span>
                          )}
                          {isHidden ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              🙈 숨김
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              👁️ 노출중
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-sm text-[#27397d] truncate" title={product.name}>
                          {product.name}
                        </h3>

                        <div className="flex items-center space-x-2 pt-0.5">
                          <span className="font-bold text-sm text-[#27397d] font-mono">
                            {product.price.toLocaleString()}원
                          </span>
                          <button
                            onClick={() => handleUpdateProductPrice(product.id, product.price)}
                            className="text-[10px] text-gray-400 hover:text-[#27397d] underline font-bold"
                          >
                            수정
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="bg-[#f8f9fa] px-3 py-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        {/* Status toggle button */}
                        <button
                          onClick={() => handleToggleProductStatus(product.id, product.status)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            product.status === '판매중'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {product.status === '판매중' ? '🟢 판매중' : '🔴 품절'}
                        </button>

                        {/* Display toggle button */}
                        <button
                          onClick={() => handleToggleProductDisplay(product.id, product.isDisplayed)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                            isHidden
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {isHidden ? '🙈 숨김 해제' : '👁️ 숨기기'}
                        </button>
                      </div>

                      <div className="flex items-center space-x-1">
                        {/* DUPLICATE BUTTON */}
                        <button
                          onClick={() => handleDuplicateProduct(product)}
                          title="이 상품을 복사하여 새 상품 만들기"
                          className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold py-1 px-2 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <span>📋 복사</span>
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => handleOpenEditProduct(product)}
                          className="text-xs bg-gray-100 hover:bg-[#27397d] hover:text-[#a7f99e] text-[#27397d] font-bold py-1 px-2 rounded-lg transition-colors cursor-pointer"
                        >
                          ✏️ 수정
                        </button>

                        {/* DELETE BUTTON (For custom/newly created products) */}
                        {isCustomProduct && (
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            title="상품 삭제"
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1 px-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            🗑️
                          </button>
                        )}

                        <Link
                          href={`/product/${product.id}`}
                          target="_blank"
                          className="text-xs text-gray-500 hover:text-[#27397d] font-bold flex items-center space-x-0.5 py-1 px-1"
                          title="상세페이지 바로가기"
                        >
                          <span>보기</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: 1:1 CUSTOMER INQUIRIES */}
        {/* ============================================================== */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-xl font-bold text-[#27397d]">1:1 고객 문의 관리</h1>
              <p className="text-xs text-[#27397d]/70">
                고객이 실제로 접수한 1:1 문의 내역입니다.
              </p>
            </div>

            {inquiries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
                <Inbox size={32} className="mx-auto text-gray-300" />
                <p className="text-xs font-bold text-[#27397d]/70">
                  아직 접수된 실제 1:1 고객 문의가 없습니다.
                </p>
                <p className="text-[11px] text-gray-400">
                  고객이 상단 '문의하기' 메뉴를 통해 문의를 남기면 이곳과 디스코드에 실시간으로 등록됩니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                        <span className="font-bold text-sm text-[#27397d]">{inq.name}</span>
                        <span className="text-xs text-gray-500">{inq.phone}</span>
                        <span className="text-xs text-gray-400">{inq.email}</span>
                        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                          {inq.type}
                        </span>
                        {inq.productName && inq.productName !== '일반 문의' && (
                          <span className="text-xs bg-[#a7f99e]/40 text-[#27397d] border border-[#a7f99e] px-2.5 py-0.5 rounded-full font-bold">
                            📦 {inq.productName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-gray-400">
                          {new Date(inq.createdAt).toLocaleString('ko-KR')}
                        </span>
                        <button
                          onClick={() => handleToggleInquiry(inq.id, inq.status)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            inq.status === '답변완료'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inq.status}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#27397d]/90 whitespace-pre-wrap font-sans">
                      {inq.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: REAL VISITOR ANALYTICS */}
        {/* ============================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-[#27397d]">실시간 방문자 및 트래픽 통계</h1>
                <p className="text-xs text-[#27397d]/70">
                  사이트에 접속한 실제 방문자 수와 페이지뷰, 유입 경로 실시간 통계입니다.
                </p>
              </div>
              <button
                onClick={loadRealData}
                className="self-start inline-flex items-center space-x-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-[#27397d] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>통계 새로고침</span>
              </button>
            </div>

            {/* Quick Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-1">
                <div className="text-xs font-bold text-gray-500">오늘 실제 방문자 (UV)</div>
                <div className="text-2xl font-black text-[#27397d]">{analytics.todayUV}명</div>
                <div className="text-[11px] text-gray-400">당일 중복 제거 순 방문자</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-1">
                <div className="text-xs font-bold text-gray-500">오늘 실제 페이지뷰 (PV)</div>
                <div className="text-2xl font-black text-[#27397d]">{analytics.todayPV}회</div>
                <div className="text-[11px] text-gray-400">당일 전체 페이지 열람 수</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-1">
                <div className="text-xs font-bold text-gray-500">누적 총 페이지뷰</div>
                <div className="text-2xl font-black text-[#27397d]">{analytics.totalPV}회</div>
                <div className="text-[11px] text-gray-400">사이트 개설 이후 누적</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Device Ratio */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-[#27397d] flex items-center space-x-2">
                  <Smartphone size={16} />
                  <span>접속 기기 비율 (Device Breakdown)</span>
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#27397d] mb-1">
                      <span className="flex items-center space-x-1"><Smartphone size={14} /> <span>모바일 (Mobile)</span></span>
                      <span>{mobilePercent}% ({analytics.devices.mobile || 0}회)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-[#27397d] h-full rounded-full" style={{ width: `${mobilePercent}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#27397d] mb-1">
                      <span className="flex items-center space-x-1"><Monitor size={14} /> <span>데스크톱 PC</span></span>
                      <span>{desktopPercent}% ({analytics.devices.desktop || 0}회)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-[#a7f99e] h-full rounded-full" style={{ width: `${desktopPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referrer Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-[#27397d] flex items-center space-x-2">
                  <TrendingUp size={16} />
                  <span>실제 유입 경로 (Traffic Referrers)</span>
                </h2>
                {Object.keys(analytics.referrers).length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400">
                    아직 기록된 유입 경로가 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2 text-xs text-[#27397d]">
                    {Object.entries(analytics.referrers).map(([refKey, count]) => (
                      <div key={refKey} className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50">
                        <span className="font-bold">{refKey}</span>
                        <span className="font-mono font-bold text-blue-700">{count}회</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pageviews by Path */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 lg:col-span-2">
                <h2 className="text-sm font-bold text-[#27397d] flex items-center space-x-2">
                  <BarChart3 size={16} />
                  <span>가장 많이 방문한 페이지 (Top Visited Pages)</span>
                </h2>
                {Object.keys(analytics.pageViews).length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400">
                    아직 기록된 페이지뷰가 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-[#27397d]">
                    {Object.entries(analytics.pageViews)
                      .sort(([, a], [, b]) => b - a)
                      .map(([pagePath, count]) => (
                        <div key={pagePath} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-[#f8f9fa]">
                          <span className="font-mono font-bold truncate max-w-[180px]">{pagePath}</span>
                          <span className="font-bold text-emerald-600 shrink-0">{count}회</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* ORDER DETAIL MODAL */}
      {/* ============================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-[#27397d] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#a7f99e]">주문 상세 정보</h3>
                <p className="text-xs text-white/80 font-mono">{selectedOrder.orderId}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#27397d]">
              {/* Customer Info */}
              <div className="bg-[#f8f9fa] p-4 rounded-xl space-y-2 border border-gray-100">
                <h4 className="font-bold text-sm text-[#27397d]">주문자 및 배송지</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-gray-400">주문자:</span> <span className="font-bold">{selectedOrder.customerName}</span></div>
                  <div><span className="text-gray-400">연락처:</span> <span className="font-bold">{selectedOrder.customerPhone}</span></div>
                  {selectedOrder.customerEmail && (
                    <div className="col-span-2"><span className="text-gray-400">이메일:</span> {selectedOrder.customerEmail}</div>
                  )}
                  <div className="col-span-2">
                    <span className="text-gray-400">배송 주소:</span>{' '}
                    <span className="font-bold">{selectedOrder.addressMain} {selectedOrder.addressDetail || ''}</span>
                    {selectedOrder.postalCode && <span className="text-gray-400"> ({selectedOrder.postalCode})</span>}
                  </div>
                  {selectedOrder.deliveryMemo && (
                    <div className="col-span-2 text-amber-700 bg-amber-50 p-2 rounded">
                      <span className="font-bold">배송 메모:</span> {selectedOrder.deliveryMemo}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Detail */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-[#27397d]">주문 상품 목록</h4>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 border border-gray-200 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-sm">{item.name}</span>
                      <span>{item.price.toLocaleString()}원 × {item.quantity}개</span>
                    </div>
                    {item.options && (
                      <div className="text-[11px] bg-stone-50 p-2 rounded space-y-1 text-gray-600">
                        {Object.entries(item.options).map(([key, val]) => (
                          <div key={key}><span className="font-bold">{key}:</span> {val}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Payment Summary */}
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center text-sm font-bold">
                <span>최종 결제 금액</span>
                <span className="text-lg text-[#27397d] font-black">
                  {selectedOrder.totalAmount.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-[#27397d] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:brightness-110 transition-all cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TRACKING NUMBER MODAL */}
      {/* ============================================================== */}
      {editingTracking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-[#27397d]">운송장 번호 등록</h3>
              <button onClick={() => setEditingTracking(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">택배사</label>
                <select
                  value={editingTracking.courier}
                  onChange={(e) => setEditingTracking({ ...editingTracking, courier: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27397d]"
                >
                  <option value="CJ대한통운">CJ대한통운</option>
                  <option value="우체국택배">우체국택배</option>
                  <option value="한진택배">한진택배</option>
                  <option value="롯데택배">롯데택배</option>
                  <option value="로젠택배">로젠택배</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">운송장 번호</label>
                <input
                  type="text"
                  value={editingTracking.trackingNumber}
                  onChange={(e) => setEditingTracking({ ...editingTracking, trackingNumber: e.target.value })}
                  placeholder="숫자만 입력하세요"
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27397d]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingTracking(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={() => {
                  handleUpdateOrderStatus(
                    editingTracking.orderId,
                    '배송중',
                    editingTracking.courier,
                    editingTracking.trackingNumber
                  );
                  setEditingTracking(null);
                }}
                className="bg-[#27397d] text-[#a7f99e] px-4 py-2 rounded-xl text-xs font-bold hover:brightness-110"
              >
                등록 & 배송중 전환
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PRODUCT DETAIL EDIT MODAL */}
      {/* ============================================================== */}
      {editingProductDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 animate-fadeIn flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#27397d] text-white p-4 sm:p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <Sparkles size={18} className="text-[#a7f99e]" />
                <h3 className="font-bold text-base text-white">
                  {parseInt(editingProductDetail.id, 10) >= 30
                    ? `📋 상품 등록 및 복사 (ID: #${editingProductDetail.id})`
                    : `✏️ 상품 상세정보 실시간 수정 (ID: #${editingProductDetail.id})`}
                </h3>
              </div>
              <button
                onClick={() => setEditingProductDetail(null)}
                className="text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                showToast('⏳ 변경사항을 서버에 저장 중...', 'info');
                const ok = await updateProduct(editingProductDetail.id, editingProductDetail);
                if (ok) {
                  showToast(`✅ '${editingProductDetail.name}' 상품이 1초 만에 실시간 반영되었습니다!`);
                  setEditingProductDetail(null);
                } else {
                  showToast('⚠️ 저장 중 오류가 발생했습니다.', 'error');
                }
              }}
              className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs"
            >
              {/* 1. Basic Info & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">상품명</label>
                  <input
                    type="text"
                    value={editingProductDetail.name}
                    onChange={(e) =>
                      setEditingProductDetail({ ...editingProductDetail, name: e.target.value })
                    }
                    placeholder="예: 스타 젬 목걸이, 삼각 우드 하우스"
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27397d] font-bold text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">카테고리 선택</label>
                  <input
                    type="text"
                    value={editingProductDetail.category}
                    onChange={(e) =>
                      setEditingProductDetail({ ...editingProductDetail, category: e.target.value })
                    }
                    placeholder="예: 테이블/식탁, 원목 하우스, 캣타워, ACC"
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27397d]"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {['테이블/식탁', '원목 하우스', '캣타워', '악세사리/리필', 'ACC'].map((catName) => (
                      <button
                        key={catName}
                        type="button"
                        onClick={() =>
                          setEditingProductDetail({ ...editingProductDetail, category: catName })
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          editingProductDetail.category === catName
                            ? 'bg-[#27397d] text-[#a7f99e]'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {catName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 1-A. Display & Status Toggle */}
              <div className="p-3 bg-stone-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-700 block text-xs">쇼핑몰 공개 및 판매 설정</span>
                  <span className="text-[11px] text-gray-500">
                    {editingProductDetail.isDisplayed !== false
                      ? '🟢 현재 쇼핑몰에 바로 노출됩니다.'
                      : '🙈 현재 비공개(숨김) 상태입니다.'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingProductDetail({
                        ...editingProductDetail,
                        isDisplayed: !(editingProductDetail.isDisplayed !== false),
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all shadow-2xs ${
                      editingProductDetail.isDisplayed !== false
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {editingProductDetail.isDisplayed !== false ? '👁️ 공개(노출중)' : '🙈 비공개(숨김)'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingProductDetail({
                        ...editingProductDetail,
                        status: editingProductDetail.status === '판매중' ? '품절' : '판매중',
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all shadow-2xs ${
                      editingProductDetail.status === '판매중'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {editingProductDetail.status === '판매중' ? '🟢 판매중' : '🔴 품절'}
                  </button>
                </div>
              </div>

              {/* 1-B. IMAGE MANAGEMENT (대표 이미지 및 추가 상세 사진) */}
              <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h4 className="font-bold text-[#27397d] flex items-center space-x-1.5 text-xs">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>상품 사진 관리 (대표 썸네일 & 추가 사진)</span>
                  </h4>
                </div>

                {/* Main Thumbnail */}
                <div className="space-y-2">
                  <label className="font-bold text-gray-700 block text-xs">
                    🌟 대표 썸네일 이미지
                  </label>
                  <div className="flex items-start space-x-3">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0">
                      {editingProductDetail.mainImage ? (
                        <Image
                          src={editingProductDetail.mainImage}
                          alt="Main Preview"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                          사진 없음
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="inline-flex items-center justify-center px-3.5 py-2 bg-[#27397d] text-[#a7f99e] rounded-xl text-xs font-bold cursor-pointer hover:brightness-110 transition-all shadow-xs">
                        <span>📷 폰 앨범 / 파일에서 대표 사진 변경</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageFileUpload(file, (dataUrl) => {
                                setEditingProductDetail({
                                  ...editingProductDetail,
                                  mainImage: dataUrl,
                                });
                                showToast('📸 대표 사진이 선택되었습니다!');
                              });
                            }
                          }}
                        />
                      </label>

                      <input
                        type="text"
                        value={editingProductDetail.mainImage || ''}
                        onChange={(e) =>
                          setEditingProductDetail({
                            ...editingProductDetail,
                            mainImage: e.target.value,
                          })
                        }
                        placeholder="또는 이미지 URL 직접 입력 (https://...)"
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Detail Images Gallery */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gray-700 text-xs">
                      🖼️ 추가 상세 이미지 ({editingProductDetail.detailImages?.length || 0}장)
                    </label>
                    <label className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">
                      <span>+ 새 사진 추가 (파일 선택)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            files.forEach((file) => {
                              handleImageFileUpload(file, (dataUrl) => {
                                const current = editingProductDetail.detailImages || [];
                                setEditingProductDetail((prev) =>
                                  prev
                                    ? { ...prev, detailImages: [...(prev.detailImages || []), dataUrl] }
                                    : null
                                );
                              });
                            });
                            showToast(`📸 ${files.length}장의 사진이 추가되었습니다!`);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {editingProductDetail.detailImages && editingProductDetail.detailImages.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                      {editingProductDetail.detailImages.map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="relative aspect-square rounded-lg overflow-hidden bg-white border border-gray-200 group"
                        >
                          <Image
                            src={imgUrl}
                            alt={`Detail ${imgIdx + 1}`}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = (editingProductDetail.detailImages || []).filter(
                                (_, idx) => idx !== imgIdx
                              );
                              setEditingProductDetail({
                                ...editingProductDetail,
                                detailImages: filtered,
                              });
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700"
                            title="사진 삭제"
                          >
                            <X size={12} />
                          </button>
                          <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 py-0.2 rounded font-mono">
                            #{imgIdx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400">등록된 추가 상세 사진이 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 2. Price & Original Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">판매 가격 (원)</label>
                  <input
                    type="number"
                    value={editingProductDetail.price}
                    onChange={(e) =>
                      setEditingProductDetail({
                        ...editingProductDetail,
                        price: parseInt(e.target.value || '0', 10),
                      })
                    }
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27397d] font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">할인 전 정가 (원, 미할인 시 0)</label>
                  <input
                    type="number"
                    value={editingProductDetail.originalPrice || 0}
                    onChange={(e) =>
                      setEditingProductDetail({
                        ...editingProductDetail,
                        originalPrice: parseInt(e.target.value || '0', 10),
                      })
                    }
                    className="w-full p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27397d] font-mono"
                  />
                </div>
              </div>

              {/* 3. Delivery info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-stone-50 rounded-xl border border-gray-200">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">기본 배송비 (원)</label>
                  <input
                    type="number"
                    value={editingProductDetail.delivery?.fee || 0}
                    onChange={(e) =>
                      setEditingProductDetail({
                        ...editingProductDetail,
                        delivery: {
                          type: editingProductDetail.delivery?.type || '택배배송',
                          fee: parseInt(e.target.value || '0', 10),
                          freeThreshold: editingProductDetail.delivery?.freeThreshold || 50000,
                        },
                      })
                    }
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">무료배송 기준 금액 (원)</label>
                  <input
                    type="number"
                    value={editingProductDetail.delivery?.freeThreshold || 50000}
                    onChange={(e) =>
                      setEditingProductDetail({
                        ...editingProductDetail,
                        delivery: {
                          type: editingProductDetail.delivery?.type || '택배배송',
                          fee: editingProductDetail.delivery?.fee || 0,
                          freeThreshold: parseInt(e.target.value || '0', 10),
                        },
                      })
                    }
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              {/* 4. Options Editor */}
              <div className="space-y-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-[#27397d]">구매 옵션 목록</label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentOpts = editingProductDetail.options || [];
                      setEditingProductDetail({
                        ...editingProductDetail,
                        options: [...currentOpts, { name: '옵션명', values: ['옵션1', '옵션2'] }],
                      });
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    + 새 옵션 추가
                  </button>
                </div>

                {editingProductDetail.options && editingProductDetail.options.length > 0 ? (
                  <div className="space-y-2">
                    {editingProductDetail.options.map((opt, optIdx) => (
                      <div key={optIdx} className="p-2.5 bg-white rounded-lg border border-gray-200 space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={opt.name}
                            placeholder="옵션명 (예: 종류, 색상)"
                            onChange={(e) => {
                              const newOpts = [...(editingProductDetail.options || [])];
                              newOpts[optIdx].name = e.target.value;
                              setEditingProductDetail({ ...editingProductDetail, options: newOpts });
                            }}
                            className="p-1.5 border border-gray-300 rounded text-xs font-bold w-1/3"
                          />
                          <input
                            type="text"
                            value={opt.values.join(', ')}
                            placeholder="옵션값들 (쉼표로 구분: 예: 화이트, 핑크)"
                            onChange={(e) => {
                              const newOpts = [...(editingProductDetail.options || [])];
                              newOpts[optIdx].values = e.target.value
                                .split(',')
                                .map((v) => v.trim())
                                .filter(Boolean);
                              setEditingProductDetail({ ...editingProductDetail, options: newOpts });
                            }}
                            className="p-1.5 border border-gray-300 rounded text-xs flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = (editingProductDetail.options || []).filter(
                                (_, idx) => idx !== optIdx
                              );
                              setEditingProductDetail({ ...editingProductDetail, options: newOpts });
                            }}
                            className="text-red-500 font-bold px-2 py-1 hover:bg-red-50 rounded"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400">등록된 옵션이 없습니다. (단일 상품)</p>
                )}
              </div>

              {/* 5. Description Text */}
              <div className="space-y-1">
                <label className="font-bold text-gray-700">상품 간단 설명 (요약)</label>
                <textarea
                  rows={2}
                  value={editingProductDetail.description || ''}
                  onChange={(e) =>
                    setEditingProductDetail({
                      ...editingProductDetail,
                      description: e.target.value,
                    })
                  }
                  placeholder="상품 목록이나 상단에 표시될 간단한 설명 문구"
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27397d] text-xs"
                />
              </div>

              {/* 6. DETAIL BODY IMAGES (본문 통이미지 파일 업로드) */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-200/80 pb-2">
                  <div>
                    <h4 className="font-bold text-[#27397d] flex items-center space-x-1.5 text-xs">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span>상세페이지 본문 통이미지 (파일 업로드)</span>
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      HTML 코드 작성 없이 폰 앨범의 상세 설명 사진들을 올리면 상세페이지에 순서대로 예쁘게 표시됩니다.
                    </p>
                  </div>

                  <label className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#27397d] text-[#a7f99e] rounded-xl text-xs font-bold cursor-pointer hover:brightness-110 shadow-xs">
                    <span>+ 본문 사진 추가</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          files.forEach((file) => {
                            handleImageFileUpload(file, (dataUrl) => {
                              setEditingProductDetail((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      detailBodyImages: [
                                        ...(prev.detailBodyImages || []),
                                        dataUrl,
                                      ],
                                    }
                                  : null
                              );
                            });
                          });
                          showToast(`📸 ${files.length}장의 본문 이미지가 추가되었습니다!`);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Body Images List */}
                {editingProductDetail.detailBodyImages &&
                editingProductDetail.detailBodyImages.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {editingProductDetail.detailBodyImages.map((imgUrl, imgIdx) => {
                      const totalCount = (editingProductDetail.detailBodyImages || []).length;
                      return (
                        <div
                          key={`body-img-${imgIdx}-${imgUrl.slice(-15)}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border-2 border-emerald-100 shadow-2xs gap-3 transition-all"
                        >
                          {/* Thumbnail & Info */}
                          <div className="flex items-center space-x-3 min-w-0">
                            <span className="font-mono text-sm font-black text-emerald-900 bg-emerald-100 border border-emerald-300 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs">
                              {imgIdx + 1}
                            </span>
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                              <Image
                                src={imgUrl}
                                alt={`Body image ${imgIdx + 1}`}
                                fill
                                unoptimized
                                className="object-contain"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-[#27397d] block truncate">
                                상세 본문 이미지 ({imgIdx + 1}번째 / 총 {totalCount}장)
                              </span>
                              <div className="flex items-center space-x-1 mt-1">
                                <label className="text-[10px] text-gray-500 font-bold">순서 변경:</label>
                                <select
                                  value={imgIdx}
                                  onChange={(e) => {
                                    const targetIdx = parseInt(e.target.value, 10);
                                    if (targetIdx !== imgIdx && editingProductDetail.detailBodyImages) {
                                      const list = [...editingProductDetail.detailBodyImages];
                                      const [item] = list.splice(imgIdx, 1);
                                      list.splice(targetIdx, 0, item);
                                      setEditingProductDetail({ ...editingProductDetail, detailBodyImages: list });
                                      showToast(`✅ ${imgIdx + 1}번 사진을 ${targetIdx + 1}번 위치로 이동했습니다.`);
                                    }
                                  }}
                                  className="text-xs bg-emerald-50 border border-emerald-300 rounded px-1.5 py-0.5 font-bold text-emerald-800"
                                >
                                  {Array.from({ length: totalCount }, (_, i) => (
                                    <option key={i} value={i}>
                                      {i + 1}번째로 이동
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto flex-wrap gap-y-1">
                            {/* Move Up Button */}
                            {imgIdx > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingProductDetail.detailBodyImages) {
                                    const list = [...editingProductDetail.detailBodyImages];
                                    const temp = list[imgIdx - 1];
                                    list[imgIdx - 1] = list[imgIdx];
                                    list[imgIdx] = temp;
                                    setEditingProductDetail({ ...editingProductDetail, detailBodyImages: list });
                                    showToast(`⬆️ ${imgIdx + 1}번 사진을 위로 이동했습니다.`);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-gray-100 hover:bg-[#27397d] hover:text-[#a7f99e] text-[#27397d] rounded-lg text-xs font-bold transition-colors cursor-pointer border border-gray-300 flex items-center space-x-0.5"
                                title="한 칸 위로"
                              >
                                <span>▲ 위로</span>
                              </button>
                            )}

                            {/* Move Down Button */}
                            {imgIdx < totalCount - 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (editingProductDetail.detailBodyImages) {
                                    const list = [...editingProductDetail.detailBodyImages];
                                    const temp = list[imgIdx + 1];
                                    list[imgIdx + 1] = list[imgIdx];
                                    list[imgIdx] = temp;
                                    setEditingProductDetail({ ...editingProductDetail, detailBodyImages: list });
                                    showToast(`⬇️ ${imgIdx + 1}번 사진을 아래로 이동했습니다.`);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-gray-100 hover:bg-[#27397d] hover:text-[#a7f99e] text-[#27397d] rounded-lg text-xs font-bold transition-colors cursor-pointer border border-gray-300 flex items-center space-x-0.5"
                                title="한 칸 아래로"
                              >
                                <span>▼ 아래로</span>
                              </button>
                            )}

                            {/* 1:1 사진 바꾸기 (교체) */}
                            <label className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1 border border-blue-200">
                              <span>📷 교체</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageFileUpload(file, (dataUrl) => {
                                      const list = [...(editingProductDetail.detailBodyImages || [])];
                                      list[imgIdx] = dataUrl;
                                      setEditingProductDetail({ ...editingProductDetail, detailBodyImages: list });
                                      showToast(`📸 본문 이미지 #${imgIdx + 1}이(가) 새 사진으로 교체되었습니다!`);
                                    });
                                  }
                                }}
                              />
                            </label>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const list = (editingProductDetail.detailBodyImages || []).filter(
                                  (_, idx) => idx !== imgIdx
                                );
                                setEditingProductDetail({ ...editingProductDetail, detailBodyImages: list });
                                showToast(`❌ 본문 이미지 #${imgIdx + 1}을(를) 삭제했습니다.`);
                              }}
                              className="px-2 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-bold text-xs border border-red-200 cursor-pointer"
                              title="삭제"
                            >
                              삭제 🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 py-1">
                    등록된 본문 사진이 없습니다. (위 버튼을 눌러 사진을 추가해 보세요)
                  </p>
                )}
              </div>

              {/* 7. NOTICE TEXT (안내문 및 주의사항 일반 텍스트) */}
              <div className="space-y-1">
                <label className="font-bold text-gray-700">
                  📋 상세페이지 하단 안내문 & 취급 주의사항 (일반 글자로 작성)
                </label>
                <textarea
                  rows={3}
                  value={editingProductDetail.detailNoticeText || ''}
                  onChange={(e) =>
                    setEditingProductDetail({
                      ...editingProductDetail,
                      detailNoticeText: e.target.value,
                    })
                  }
                  placeholder="예:
• 취급 주의: 원목 특성상 직사광선이나 고온 다습한 환경을 피해주세요.
• 핸드메이드 특성상 미세한 옹이나 결 차이가 있을 수 있습니다."
                  className="w-full p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27397d] text-xs leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingProductDetail(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-[#27397d] text-[#a7f99e] px-6 py-2.5 rounded-xl font-bold hover:brightness-110 shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>💾 실시간 저장하기 (즉시 반영)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-sm font-bold border ${
              toast.type === 'error'
                ? 'bg-red-600 text-white border-red-700'
                : toast.type === 'info'
                ? 'bg-[#27397d] text-[#a7f99e] border-[#a7f99e]/40'
                : 'bg-emerald-600 text-white border-emerald-700'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={18} className="shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

