'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/lib/useProducts';
import { Product } from '@/types';
import { Search } from 'lucide-react';

function ShopContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'ALL';
  const isPreview = searchParams.get('preview') === 'true' || initialCategory === 'ACC';

  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');

  const { products } = useProducts();

  // 노출 중인 상품들의 카테고리를 동적으로 구성
  const categories = useMemo(() => {
    const displayedCats = Array.from(
      new Set(products.filter((p) => p.isDisplayed !== false).map((p) => p.category))
    ).filter(Boolean);

    const catList = [{ id: 'ALL', name: '전체 (ALL)' }];
    displayedCats.forEach((cat) => {
      catList.push({
        id: cat,
        name: cat === 'ACC' ? 'ACC (악세서리)' : cat,
      });
    });
    return catList;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 숨김 상품은 목록에서 제외
      if (p.isDisplayed === false) {
        return false;
      }
      // 카테고리 매칭
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }
      // 검색어 매칭
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchCat = p.category.toLowerCase().includes(query);
        if (!matchName && !matchCat) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return parseInt(b.id, 10) - parseInt(a.id, 10);
    });
  }, [products, selectedCategory, search, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Title Header (Montserrat Font & Lime Green Color) */}
      <div className="border-b border-brand-border pb-4">
        <h1 className="font-montserrat text-2xl sm:text-3xl font-medium text-[#a7f99e] tracking-wide uppercase">
          SHOP
        </h1>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
        {/* Category Tabs (Square & Signature Green) */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-none text-xs font-semibold tracking-wider transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#a7f99e] text-[#27397d] shadow-sm font-bold'
                  : 'bg-white text-[#27397d] border border-gray-200 hover:bg-[#a7f99e]/20 hover:border-[#a7f99e]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort & Search */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-48">
            <input
              type="text"
              placeholder="상품 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-brand-border rounded-md text-[#27397d] focus:outline-none focus:border-[#27397d]"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-[#27397d]/50" />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-white border border-brand-border rounded-md text-[#27397d] focus:outline-none focus:border-[#27397d] font-medium"
          >
            <option value="recent">등록순</option>
            <option value="price_asc">낮은 가격순</option>
            <option value="price_desc">높은 가격순</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-brand-border">
          <p className="text-gray-500 text-sm">해당 조건에 맞는 상품이 없습니다.</p>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSearch('');
            }}
            className="mt-4 text-xs font-semibold text-brand-blue underline"
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-sm text-gray-400">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}
