'use client';

import React, { useState } from 'react';

interface ArchiveItem {
  id: string;
  name: string;
  year: string;
  category: 'furniture' | 'accessory';
  image: string;
}

const ARCHIVE_ITEMS: ArchiveItem[] = [
  // 2026 Accessory Collection (악세서리)
  {
    id: '33',
    name: '플라워 참',
    year: '2026',
    category: 'accessory',
    image: '/images/products/flower-charm-thumb-pink-v11.png',
  },
  {
    id: '32',
    name: '유닛 젬 목걸이',
    year: '2026',
    category: 'accessory',
    image: '/images/products/unit-gem-necklace-thumb-pink-v17.png',
  },
  {
    id: '31',
    name: '라운드 젬 목걸이',
    year: '2026',
    category: 'accessory',
    image: '/images/products/round-gem-necklace-thumb-pink-v6.png',
  },
  {
    id: '30',
    name: '드롭 젬 목걸이',
    year: '2026',
    category: 'accessory',
    image: '/images/products/drop-gem-necklace-thumb-olive-v6.png',
  },
  {
    id: '29',
    name: '스타 젬 목걸이',
    year: '2026',
    category: 'accessory',
    image: '/images/products/star-gem-necklace-thumb-yellow-v6.png',
  },
  {
    id: '28',
    name: '오벌 젬 목걸이',
    year: '2026',
    category: 'accessory',
    image: '/images/products/oval-gem-necklace-thumb-pastel-v7.png',
  },
  {
    id: '27',
    name: '하트 젬 목걸이',
    year: '2026',
    category: 'accessory',
    image: '/images/products/heart-gem-necklace-thumb-deep-v6.png',
  },

  // Furniture & Objects (가구/소품)
  {
    id: 'archive_tree_cattower_2026',
    name: '트리 캣타워',
    year: '2026',
    category: 'furniture',
    image: '/images/archive_tree_cattower_2026.png',
  },
  {
    id: 'archive_oval_cattower_black_2025',
    name: '오벌 캣타워 블랙',
    year: '2025',
    category: 'furniture',
    image: '/images/archive_oval_cattower_black.png',
  },
  {
    id: '10',
    name: '오벌 캣타워',
    year: '2024',
    category: 'furniture',
    image: 'https://cdn.imweb.me/thumbnail/20260128/aad1df75b1e47.jpg',
  },
  {
    id: 'archive_triangle_house_2024',
    name: '삼각 우드 하우스 ver.2',
    year: '2024',
    category: 'furniture',
    image: '/images/archive_triangle_house.jpg',
  },
  {
    id: '12',
    name: '파티션 캣타워',
    year: '2024',
    category: 'furniture',
    image: 'https://cdn.imweb.me/thumbnail/20260129/b12656189138e.jpg',
  },
  {
    id: '11',
    name: '조인 캣타워',
    year: '2022',
    category: 'furniture',
    image: 'https://cdn.imweb.me/thumbnail/20260129/2718d587bfc27.jpg',
  },
  {
    id: '18',
    name: '삼각 우드 하우스',
    year: '2021',
    category: 'furniture',
    image: 'https://cdn.imweb.me/thumbnail/20260128/9e9f851d62e78.jpg',
  },
  {
    id: '15',
    name: '베베블 코너 캣타워',
    year: '2021',
    category: 'furniture',
    image: 'https://cdn.imweb.me/thumbnail/20260129/ae52b6bcc86bb.png',
  },
  {
    id: '26',
    name: '베베블 우드 테이블',
    year: '2021',
    category: 'furniture',
    image: 'https://cdn.imweb.me/thumbnail/20260203/aef552aa2322f.jpg',
  },
  {
    id: '22',
    name: '아치 캣타워',
    year: '2020',
    category: 'furniture',
    image: 'https://cdn.imweb.me/thumbnail/20260128/ca77ce24b01bc.jpg',
  },
  {
    id: '17',
    name: '실린더 우드 테이블',
    year: '2020',
    category: 'furniture',
    image: 'https://cdn.imweb.me/thumbnail/20260128/ced3c865031fc.jpg',
  },
  {
    id: 'archive_triangle_wood_step_2020',
    name: '삼각 우드 스텝',
    year: '2020',
    category: 'furniture',
    image: '/images/archive_triangle_wood_step_2020.png',
  },
  {
    id: 'archive_corner_house_2020',
    name: '코너 하우스',
    year: '2020',
    category: 'furniture',
    image: '/images/archive_corner_house_2020.png',
  },
  {
    id: '23',
    name: '크로스 우드 테이블',
    year: '2019',
    category: 'furniture',
    image: 'https://cdn.imweb.me/thumbnail/20260130/5319e48e077f8.jpg',
  },
  {
    id: 'archive_triangle_tent_house_2019',
    name: '삼각 텐트 하우스',
    year: '2019',
    category: 'furniture',
    image: '/images/archive_triangle_tent_house_2019.png',
  },
  {
    id: 'archive_milkbowl_wood_table_2016',
    name: '밀크볼 우드 테이블',
    year: '2016',
    category: 'furniture',
    image: '/images/archive_milkbowl_wood_table_2016.png?v=2',
  },
  {
    id: 'archive_smile_nosework_mat_2016',
    name: '스마일 노즈워크 매트',
    year: '2016',
    category: 'furniture',
    image: '/images/archive_smile_nosework_mat_2016.png',
  },
];

export default function AboutPage() {
  const [selectedCategory, setSelectedCategory] = useState<'furniture' | 'accessory'>('furniture');

  const filteredItems = ARCHIVE_ITEMS.filter((item) => item.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 sm:space-y-20">
      {/* 1. Page Title Header: ABOUT */}
      <div className="space-y-8">
        <div className="border-b border-brand-border pb-4">
          <h1 className="font-montserrat text-2xl sm:text-3xl font-medium text-[#a7f99e] tracking-wide uppercase">
            ABOUT
          </h1>
        </div>

        {/* Brand Story Content Area */}
        <div className="max-w-4xl mx-auto space-y-12 pt-2">
          {/* Brand Hero Photo (CANO CANO Cookies) */}
          <div className="relative w-full overflow-hidden shadow-sm">
            <img
              src="/images/about_brand_cookies.jpg"
              alt="CANO CANO Brand"
              className="w-full h-auto object-cover block mx-auto"
            />
          </div>

          {/* Brand Story Text & Green Circle Logo */}
          <div className="space-y-6 pt-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#27397d] tracking-tight">
              우리의 삶이 노래가 된다면,
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="flex-1 min-w-0 text-xs sm:text-sm md:text-[15px] text-[#27397d] leading-relaxed sm:leading-loose font-medium break-keep">
                <p>
                  카노카노는 반려동물을 생각하는 마음으로 2016년에 시작된 <br />
                  디자인 스튜디오입니다. <br />
                  CANO는 라틴어로 [노래하다]라는 뜻을 가집니다. <br />
                  찾아주시는 모든 분들의 삶 속에 따뜻한 노래처럼 오랜시간 <br />
                  머물기를 소망합니다.
                </p>
              </div>

              <div className="shrink-0 flex justify-end">
                <img
                  src="/images/cano_logo_green_circle.png"
                  alt="CANO CANO"
                  className="w-16 sm:w-20 h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Page Section Header: ARCHIVE (Balanced Top Margin & Exact Same Size/Position as ABOUT) */}
      <div className="space-y-8 pt-10 sm:pt-28">
        <div className="border-b border-brand-border pb-4">
          <h2 className="font-montserrat text-2xl sm:text-3xl font-medium text-[#a7f99e] tracking-wide uppercase">
            ARCHIVE
          </h2>
        </div>

        {/* Archive Content Area (Constrained to max-w-4xl mx-auto to match ABOUT photo width) */}
        <div className="max-w-4xl mx-auto space-y-8 pt-2">
          {/* Category Buttons: 가구/소품, 악세서리 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedCategory('furniture')}
              className={`px-4 py-2 text-xs font-semibold tracking-wider transition-all rounded-none ${
                selectedCategory === 'furniture'
                  ? 'bg-[#a7f99e] text-[#27397d] font-bold shadow-xs'
                  : 'bg-white text-[#27397d] border border-gray-200 hover:bg-[#a7f99e]/20'
              }`}
            >
              가구/소품
            </button>
            <button
              onClick={() => setSelectedCategory('accessory')}
              className={`px-4 py-2 text-xs font-semibold tracking-wider transition-all rounded-none ${
                selectedCategory === 'accessory'
                  ? 'bg-[#a7f99e] text-[#27397d] font-bold shadow-xs'
                  : 'bg-white text-[#27397d] border border-gray-200 hover:bg-[#a7f99e]/20'
              }`}
            >
              악세서리
            </button>
          </div>

          {/* Product Grid (Latest Year First, Sharp Corners, Exact Alignment with ABOUT Photo) */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
              {filteredItems.map((item) => (
                <div key={item.id} className="select-none space-y-2.5">
                  <div className={`relative w-full rounded-none overflow-hidden bg-white border border-brand-border/40 ${
                    item.category === 'accessory' ? 'aspect-[3/4]' : 'aspect-square'
                  }`}>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-none"
                    />
                  </div>
                  <div className="space-y-0.5 pt-1 text-right">
                    <div className="text-[11px] font-mono font-bold text-[#27397d]/60 tracking-wider">
                      {item.year}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-[#27397d] leading-snug line-clamp-1">
                      {item.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center text-sm text-[#27397d]/60 font-sans border border-dashed border-brand-border/80">
              등록된 아카이브 작품을 준비 중입니다.
            </div>
          )}
        </div>
      </div>

      {/* 3. Stockists & Showroom Info (Balanced top spacing) */}
      <div className="pt-16 sm:pt-20 pb-8 max-w-4xl mx-auto">
        <div className="bg-stone-50/60 p-6 sm:p-8 border border-brand-border flex flex-col md:flex-row justify-between items-start gap-8 font-sans">
          {/* 1. Online Stockists (Left Aligned) */}
          <div className="space-y-3">
            <h3 className="font-montserrat text-sm font-bold tracking-wider text-[#27397d] uppercase">
              ONLINE STOCKISTS
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center bg-white px-3.5 py-1.5 border border-brand-border font-medium text-xs text-[#27397d] shadow-2xs">
                오늘의집
              </span>
              <span className="inline-flex items-center bg-white px-3.5 py-1.5 border border-brand-border font-medium text-xs text-[#27397d] shadow-2xs">
                말론샵
              </span>
            </div>
          </div>

          {/* 2. Offline Showroom (Right Aligned to edge) */}
          <div className="space-y-3 md:text-right">
            <h3 className="font-montserrat text-sm font-bold tracking-wider text-[#27397d] uppercase">
              OFFLINE SHOWROOM
            </h3>
            <div className="mt-3 text-xs text-[#27397d]/80 space-y-1.5">
              <p>경기도 파주시 탄현면 국원말길 38, 101호 카노카노</p>
              <p>운영시간: Mon - Sat 10:00 - 18:00 (일/공휴일 휴무)</p>
              <p>이메일: cano_cano@naver.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
