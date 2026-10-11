'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import {
  Upload,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  Heart,
  ZoomIn,
  Move,
} from 'lucide-react';

// Real Gemstone Data with actual high-res gemstone photograph assets
interface GemstoneData {
  id: string;
  name: string;
  image: string;
  glow: string;
}

const REAL_GEMSTONES: GemstoneData[] = [
  {
    id: 'dark_blue',
    name: '스피넬다크',
    image: '/images/custom/gems/gem_v18_dark_blue.png',
    glow: 'rgba(0, 35, 102, 0.6)',
  },
  {
    id: 'red',
    name: '레드',
    image: '/images/custom/gems/gem_v18_red.png',
    glow: 'rgba(180, 0, 0, 0.6)',
  },
  {
    id: 'ruby',
    name: '루비',
    image: '/images/custom/gems/gem_v18_ruby.png',
    glow: 'rgba(230, 25, 75, 0.6)',
  },
  {
    id: 'topaz',
    name: '스피넬토파즈',
    image: '/images/custom/gems/gem_v18_topaz.png',
    glow: 'rgba(70, 150, 240, 0.6)',
  },
  {
    id: 'green',
    name: '그린',
    image: '/images/custom/gems/gem_v18_green.png',
    glow: 'rgba(46, 204, 113, 0.6)',
  },
  {
    id: 'aqua',
    name: '아쿠아라이트',
    image: '/images/custom/gems/gem_v18_aqua.png',
    glow: 'rgba(100, 200, 255, 0.6)',
  },
  {
    id: 'black',
    name: '블랙',
    image: '/images/custom/gems/gem_v18_black.png',
    glow: 'rgba(44, 62, 80, 0.6)',
  },
  {
    id: 'champagne',
    name: '샴페인',
    image: '/images/custom/gems/gem_v18_champagne.png',
    glow: 'rgba(218, 165, 32, 0.6)',
  },
  {
    id: 'olive',
    name: '올리브',
    image: '/images/custom/gems/gem_v18_olive.png',
    glow: 'rgba(128, 128, 0, 0.6)',
  },
  {
    id: 'peridot',
    name: '페리돗라이트',
    image: '/images/custom/gems/gem_v18_peridot.png',
    glow: 'rgba(180, 220, 70, 0.6)',
  },
  {
    id: 'amethyst',
    name: '자수정',
    image: '/images/custom/gems/gem_v18_amethyst.png',
    glow: 'rgba(138, 43, 226, 0.6)',
  },
  {
    id: 'lavender',
    name: '라벤더',
    image: '/images/custom/gems/gem_v18_lavender.png',
    glow: 'rgba(200, 160, 240, 0.6)',
  },
  {
    id: 'tourmaline',
    name: '트루말린',
    image: '/images/custom/gems/gem_v18_tourmaline.png',
    glow: 'rgba(139, 69, 19, 0.6)',
  },
  {
    id: 'pink',
    name: '핑크',
    image: '/images/custom/gems/gem_v18_pink.png',
    glow: 'rgba(255, 105, 180, 0.6)',
  },
  {
    id: 'yellow',
    name: '옐로우',
    image: '/images/custom/gems/gem_v18_yellow.png',
    glow: 'rgba(241, 196, 15, 0.6)',
  },
  {
    id: 'white',
    name: '화이트',
    image: '/images/custom/gems/gem_v18_white.png',
    glow: 'rgba(230, 230, 250, 0.8)',
  },
];

// Necklace Thumbnails Data
const NECKLACE_TYPES = [
  { id: 'oval_cord', name: '타원 핑크코드 펜던트', image: '/images/custom/thumb_1.jpg' },
  { id: 'oval_metal', name: '타원 메탈코드 펜던트', image: '/images/custom/thumb_2.jpg' },
  { id: 'heart_cord', name: '하트 핑크코드 펜던트', image: '/images/custom/thumb_3.jpg' },
  { id: 'classic_cord', name: '클래식 실버 펜던트', image: '/images/custom/thumb_4.jpg' },
];

// Exact 8 Surrounding Gem Positions on Oval Metal Pendant
const SUB_GEM_POSITIONS = [
  { id: 'gem_0', label: '1번 보석 (상단)', top: '50.5%', left: '50%' },
  { id: 'gem_1', label: '2번 보석 (우상단)', top: '55.5%', left: '67%' },
  { id: 'gem_2', label: '3번 보석 (우측)', top: '63.5%', left: '71%' },
  { id: 'gem_3', label: '4번 보석 (우하단)', top: '72%', left: '67%' },
  { id: 'gem_4', label: '5번 보석 (하단)', top: '77%', left: '50%' },
  { id: 'gem_5', label: '6번 보석 (좌하단)', top: '72%', left: '33%' },
  { id: 'gem_6', label: '7번 보석 (좌측)', top: '63.5%', left: '29%' },
  { id: 'gem_7', label: '8번 보석 (좌상단)', top: '55.5%', left: '33%' },
];

export default function CustomPreviewPage() {
  const router = useRouter();
  const { addToCart } = useCart();

  // Current Step: 1 = Jewelry Customizer, 2 = AI Pet Simulation, 3 = Order & Checkout
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Selected Necklace Type
  const [selectedNecklace, setSelectedNecklace] = useState(NECKLACE_TYPES[0]);

  // Center Heart Gem & 8 Sub Gems State (Using Real Gem IDs)
  const [centerGem, setCenterGem] = useState<string>('ruby');
  const [subGems, setSubGems] = useState<{ [key: string]: string }>({
    gem_0: 'ruby',
    gem_1: 'champagne',
    gem_2: 'lavender',
    gem_3: 'amethyst',
    gem_4: 'ruby',
    gem_5: 'yellow',
    gem_6: 'ruby',
    gem_7: 'amethyst',
  });

  // Active Selected Gem Slot for Color Palette Click
  const [activeSlot, setActiveSlot] = useState<string>('center');

  // Step 2: Uploaded Pet Image & Pendant Overlay Positioning
  const [userPetImage, setUserPetImage] = useState<string | null>(null);
  const [pendantScale, setPendantScale] = useState<number>(1);
  const [pendantPosition, setPendantPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Quantity
  const [quantity, setQuantity] = useState<number>(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const pricePerItem = 17000;
  const totalPrice = pricePerItem * quantity;

  // Handle gemstone click from palette
  const handleSelectColor = (gemId: string) => {
    if (activeSlot === 'center') {
      setCenterGem(gemId);
    } else {
      setSubGems((prev) => ({
        ...prev,
        [activeSlot]: gemId,
      }));
    }
  };

  // Quick reset to default colors
  const handleResetColors = () => {
    setCenterGem('ruby');
    setSubGems({
      gem_0: 'ruby',
      gem_1: 'champagne',
      gem_2: 'lavender',
      gem_3: 'amethyst',
      gem_4: 'ruby',
      gem_5: 'yellow',
      gem_6: 'ruby',
      gem_7: 'amethyst',
    });
    setActiveSlot('center');
  };

  // Photo Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUserPetImage(event.target.result as string);
          setPendantPosition({ x: 0, y: 0 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate readable summary of custom selections
  const getCustomSummary = () => {
    const centerName = REAL_GEMSTONES.find((g) => g.id === centerGem)?.name || '루비';
    const subNames = SUB_GEM_POSITIONS.map(
      (s) => REAL_GEMSTONES.find((g) => g.id === (subGems[s.id] || 'ruby'))?.name || '루비'
    );
    return `${selectedNecklace.name} (중앙: ${centerName} 하트, 커스텀 실물 보석 8구)`;
  };

  // Add to Cart
  const handleAddToCart = () => {
    const customProduct = {
      id: 'custom_jewelry_necklace',
      name: `카노카노 커스텀 목걸이 (${selectedNecklace.name})`,
      category: 'CUSTOM',
      categoryId: 'custom',
      price: pricePerItem,
      originalPrice: pricePerItem,
      status: '판매중' as const,
      isDisplayed: true,
      mainImage: '/images/custom/pendant_main.jpg',
      detailImages: ['/images/custom/pendant_main.jpg'],
      options: [
        { name: '목걸이 종류', values: [selectedNecklace.name] },
        { name: '중앙 보석', values: [REAL_GEMSTONES.find((g) => g.id === centerGem)?.name || '루비'] },
        { name: '커스텀 조합', values: [getCustomSummary()] },
      ],
      delivery: {
        type: '무료배송',
        fee: 0,
        freeThreshold: 0,
      },
      detailHtml: '<p>1:1 맞춤 커스텀 제작 펜던트 목걸이</p>',
      createdAt: new Date().toISOString(),
    };

    addToCart(
      customProduct,
      {
        '목걸이 종류': selectedNecklace.name,
        '중앙 보석': REAL_GEMSTONES.find((g) => g.id === centerGem)?.name || '루비',
        '커스텀 조합': getCustomSummary(),
      },
      quantity
    );

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 3000);
  };

  // Buy Now (Direct Checkout)
  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  const centerGemData = REAL_GEMSTONES.find((g) => g.id === centerGem) || REAL_GEMSTONES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* 1. Header with Signature Green Montserrat Title & Preview Badge */}
      <div className="border-b border-brand-border pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-montserrat text-2xl sm:text-3xl font-medium text-[#a7f99e] tracking-wide uppercase">
              CUSTOM
            </h1>
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[11px] font-bold rounded-full border border-amber-300">
              🔒 프라이빗 테스트 모드 (실물 보석 연동)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#27397d]/75 mt-1 font-sans">
            실제 천연/합성석 원석 사진을 직접 클릭해 하나뿐인 펜던트를 완성하고, 내 반려동물에게 시뮬레이션해보세요.
          </p>
        </div>

        {/* Step Indicator Tabs */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 bg-stone-100/80 p-1 rounded-lg text-xs font-bold shrink-0">
          <button
            onClick={() => setCurrentStep(1)}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              currentStep === 1
                ? 'bg-[#27397d] text-white shadow-xs'
                : 'text-[#27397d]/70 hover:text-[#27397d]'
            }`}
          >
            1. 목걸이 & 보석 커스텀
          </button>
          <span className="text-[#27397d]/30">›</span>
          <button
            onClick={() => setCurrentStep(2)}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              currentStep === 2
                ? 'bg-[#27397d] text-white shadow-xs'
                : 'text-[#27397d]/70 hover:text-[#27397d]'
            }`}
          >
            2. 반려동물 AI 착용 합성
          </button>
          <span className="text-[#27397d]/30">›</span>
          <button
            onClick={() => setCurrentStep(3)}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              currentStep === 3
                ? 'bg-[#27397d] text-white shadow-xs'
                : 'text-[#27397d]/70 hover:text-[#27397d]'
            }`}
          >
            3. 주문 & 결제
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: JEWELRY & REAL GEMSTONE CUSTOMIZER */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Title & Subtitle */}
          <div className="flex items-baseline space-x-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#27397d] tracking-tight">
              AI합성
            </h2>
            <div className="text-xs sm:text-sm text-[#27397d]/80 leading-relaxed font-sans">
              <p>보석을 클릭하며 색상을 변경 할 수 있어요</p>
              <p className="text-[11px] sm:text-xs text-[#27397d]/60">하나뿐인 펜던트를 만들어 보세요</p>
            </div>
          </div>

          {/* 3-Column Customizer Layout (Left: Thumbs / Center: Main Pendant / Right: Real Gem Palette) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-white p-6 sm:p-8 rounded-2xl border border-brand-border shadow-xs">
            {/* Left: Necklace Type Thumbnails (2 cols) */}
            <div className="lg:col-span-2 flex lg:flex-col gap-3 justify-center lg:justify-start overflow-x-auto pb-2 lg:pb-0">
              {NECKLACE_TYPES.map((type) => {
                const isSelected = selectedNecklace.id === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedNecklace(type)}
                    className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 transition-all p-1 bg-stone-50 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'border-[#27397d] ring-2 ring-[#a7f99e] shadow-sm scale-105'
                        : 'border-brand-border hover:border-[#27397d]/50 opacity-70 hover:opacity-100'
                    }`}
                    title={type.name}
                  >
                    <div className="w-full h-full relative rounded-lg overflow-hidden bg-stone-200">
                      <Image
                        src={type.image}
                        alt={type.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-[#27397d] text-[#a7f99e] rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Center: Main Pendant Viewer with Real Gemstone Overlays (6 cols) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[4/5] bg-stone-100/60 rounded-2xl p-4 flex items-center justify-center border border-stone-200 shadow-inner overflow-hidden select-none">
                {/* Main Pendant Image */}
                <div className="relative w-[85%] h-[90%] flex items-center justify-center">
                  <Image
                    src="/images/custom/pendant_main.jpg"
                    alt="Custom Pendant Main"
                    fill
                    priority
                    className="object-contain drop-shadow-lg"
                  />

                  {/* Interactive Center Heart Gem Overlay (Real Gem Photograph) */}
                  <button
                    type="button"
                    onClick={() => setActiveSlot('center')}
                    className={`absolute z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      activeSlot === 'center'
                        ? 'ring-3 ring-[#a7f99e] ring-offset-2 ring-offset-white scale-110 shadow-lg'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      top: '63%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                    title="중앙 하트 보석 선택"
                  >
                    <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/90 shadow-md">
                      <Image
                        src={centerGemData.image}
                        alt={centerGemData.name}
                        fill
                        className="object-cover scale-105"
                      />
                    </div>
                  </button>

                  {/* 8 Interactive Surrounding Gems Overlay (Real Gem Photographs) */}
                  {SUB_GEM_POSITIONS.map((slot) => {
                    const currentGemId = subGems[slot.id] || 'ruby';
                    const gemData =
                      REAL_GEMSTONES.find((g) => g.id === currentGemId) || REAL_GEMSTONES[0];
                    const isSelected = activeSlot === slot.id;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setActiveSlot(slot.id)}
                        className={`absolute z-10 w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-[#a7f99e] ring-offset-2 ring-offset-white scale-125 z-30 shadow-md'
                            : 'hover:scale-110'
                        }`}
                        style={{
                          top: slot.top,
                          left: slot.left,
                          transform: 'translate(-50%, -50%)',
                        }}
                        title={slot.label}
                      >
                        <div className="relative w-full h-full rounded-full overflow-hidden border border-white/80 shadow-xs">
                          <Image
                            src={gemData.image}
                            alt={gemData.name}
                            fill
                            className="object-cover scale-105"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Gem Instruction Hint */}
                <div className="absolute bottom-3 left-4 right-4 bg-white/95 backdrop-blur-xs py-1.5 px-3 rounded-full text-center text-[11px] font-bold text-[#27397d] border border-brand-border shadow-xs">
                  {activeSlot === 'center'
                    ? '💎 중앙 보석 선택 중 ➔ 오른쪽 실제 원석을 클릭하세요'
                    : `✨ ${
                        SUB_GEM_POSITIONS.find((s) => s.id === activeSlot)?.label || '보석'
                      } 선택 중 ➔ 오른쪽 실제 원석을 클릭하세요`}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleResetColors}
                className="mt-3 inline-flex items-center space-x-1.5 text-xs text-[#27397d]/70 hover:text-[#27397d] transition-colors cursor-pointer font-medium"
              >
                <RotateCcw size={13} />
                <span>기본 보석 조합으로 초기화</span>
              </button>
            </div>

            {/* Right: Real Gemstone Photo Palette (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="border-b border-brand-border pb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#27397d]">실제 보석 원석 선택</h3>
                <span className="text-[11px] text-[#27397d]/60 font-mono">
                  {REAL_GEMSTONES.length} STONES
                </span>
              </div>

              <p className="text-xs text-[#27397d]/75">
                실제 세팅될 라운드컷 보석 원석을 선택해주세요.
              </p>

              {/* 2-Column Real Gemstones Grid with Real Photos (Exact Match to Screenshot) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 max-h-[390px] overflow-y-auto pr-1">
                {REAL_GEMSTONES.map((gem) => {
                  const currentActiveGemId =
                    activeSlot === 'center' ? centerGem : subGems[activeSlot];
                  const isCurrentActiveColor = currentActiveGemId === gem.id;

                  return (
                    <button
                      key={gem.id}
                      type="button"
                      onClick={() => handleSelectColor(gem.id)}
                      className={`flex items-center space-x-2.5 p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isCurrentActiveColor
                          ? 'border-2 border-[#52c41a] bg-white shadow-xs'
                          : 'border border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {/* Real Gem Photo Thumbnail (100% Full Circular Bleed, No Gaps) */}
                      <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-gray-200 shrink-0 bg-white flex items-center justify-center shadow-2xs">
                        <img
                          src={gem.image}
                          alt={gem.name}
                          className="w-full h-full object-cover scale-110 select-none pointer-events-none rounded-full"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#27397d] flex-1 truncate">
                        {gem.name}
                      </span>
                      {isCurrentActiveColor && (
                        <Check size={16} className="text-[#27397d] shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Step 1 Next Button (Lime Green with Sparkles) */}
              <div className="pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-[#a7f99e] text-[#27397d] py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base hover:brightness-105 transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>다음단계 &gt;&gt;</span>
                  <Sparkles size={16} className="text-[#27397d]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: AI PET PHOTO SYNTHESIS SIMULATOR */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Title & Upload Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-baseline space-x-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#27397d] tracking-tight">
                AI합성
              </h2>
              <p className="text-xs sm:text-sm text-[#27397d]/80 font-sans">
                +버튼을 눌러서 사진을 업로드하면 합성된 모습을 볼 수 있어요
              </p>
            </div>

            {/* + Photo Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-2 bg-[#a7f99e] text-[#27397d] px-5 py-2.5 rounded-none font-bold text-xs sm:text-sm hover:brightness-105 transition-all shadow-sm cursor-pointer"
              >
                <Upload size={16} />
                <span>+ 사진 업로드</span>
              </button>
            </div>
          </div>

          {/* 2-Column Simulator Layout (Left: Big Pet Preview / Right: Upload Guidelines) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-white p-6 sm:p-8 rounded-2xl border border-brand-border shadow-xs">
            {/* Left: Main Pet Wearing Simulation Preview (8 cols) */}
            <div className="lg:col-span-8 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-full max-w-[480px] aspect-[4/5] bg-stone-100 rounded-2xl overflow-hidden border border-stone-200 shadow-md flex items-center justify-center select-none">
                {/* Background Pet Image (Uploaded or Default Brown Poodle) */}
                <Image
                  src={userPetImage || '/images/custom/model_dog.jpg'}
                  alt="Pet Preview Model"
                  fill
                  className="object-cover"
                />

                {/* Custom Overlay Pendant on Pet's Neck */}
                <div
                  className="absolute z-20 cursor-move transition-transform"
                  style={{
                    top: `calc(82% + ${pendantPosition.y}px)`,
                    left: `calc(50% + ${pendantPosition.x}px)`,
                    transform: `translate(-50%, -50%) scale(${pendantScale})`,
                  }}
                >
                  <div className="relative w-12 h-14 sm:w-14 sm:h-16 filter drop-shadow-xl">
                    <div
                      className="w-full h-full rounded-2xl flex items-center justify-center shadow-lg border border-white/40"
                      style={{
                        background: 'linear-gradient(145deg, #e6e6e6, #b0b0b0)',
                      }}
                    >
                      {/* Real Gemstone photo overlay on pet preview */}
                      <div className="relative w-4 h-4 rounded-full overflow-hidden border border-white/80 shadow-md">
                        <Image
                          src={centerGemData.image}
                          alt={centerGemData.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Image Badge */}
                <div className="absolute top-4 left-4 bg-white/85 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-bold text-[#27397d] border border-brand-border shadow-xs">
                  {userPetImage ? '🐶 내 반려동물 사진 적용됨' : '✨ 기본 모델(푸들) 착용 모습'}
                </div>
              </div>

              {/* Pendant Position & Scale Fine-Tuning Controls */}
              <div className="w-full max-w-[480px] bg-stone-50 p-4 rounded-xl border border-brand-border flex flex-wrap items-center justify-between gap-3 text-xs text-[#27397d]">
                <div className="flex items-center space-x-2">
                  <ZoomIn size={14} />
                  <span>크기 조절:</span>
                  <input
                    type="range"
                    min="0.7"
                    max="1.5"
                    step="0.05"
                    value={pendantScale}
                    onChange={(e) => setPendantScale(parseFloat(e.target.value))}
                    className="w-24 accent-[#27397d] cursor-pointer"
                  />
                </div>

                <div className="flex items-center space-x-1.5">
                  <Move size={14} />
                  <span className="text-[11px] text-[#27397d]/70">위치 미세조정:</span>
                  <button
                    type="button"
                    onClick={() => setPendantPosition((p) => ({ ...p, y: p.y - 5 }))}
                    className="px-2 py-0.5 bg-white border border-brand-border rounded hover:bg-stone-100 font-bold cursor-pointer"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendantPosition((p) => ({ ...p, y: p.y + 5 }))}
                    className="px-2 py-0.5 bg-white border border-brand-border rounded hover:bg-stone-100 font-bold cursor-pointer"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendantPosition({ x: 0, y: 0 })}
                    className="px-2 py-0.5 bg-white border border-brand-border rounded hover:bg-stone-100 text-[10px] cursor-pointer"
                  >
                    리셋
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Upload Guidelines & Action Buttons (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="border-b border-brand-border pb-2">
                <h3 className="text-sm font-bold text-[#27397d]">업로드 방법</h3>
              </div>

              {/* 3 Guide Thumbnails */}
              <div className="space-y-3">
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-brand-border bg-stone-100">
                  <Image
                    src="/images/custom/guide_1.jpg"
                    alt="Upload Guide 1"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-brand-border bg-stone-100">
                    <Image
                      src="/images/custom/guide_2.jpg"
                      alt="Upload Guide 2"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-brand-border bg-stone-100">
                    <Image
                      src="/images/custom/guide_3.jpg"
                      alt="Upload Guide 3"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Guide Text Instructions */}
              <div className="text-xs text-[#27397d]/80 space-y-1.5 font-sans leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <p className="font-bold text-[#27397d]">1. 반려동물의 이 잘 나오는 사진을 업로드해주세요</p>
                <p className="text-[11px] text-[#27397d]/70">2. 배경이 깨끗하거나 누끼컷 사용해 주세요</p>
              </div>

              {/* Step Navigation Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-full bg-[#a7f99e] text-[#27397d] py-3.5 px-6 rounded-none font-bold text-sm hover:brightness-105 transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>다음단계 &gt;&gt;</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full bg-white border border-brand-border text-[#27397d] py-2.5 px-6 rounded-none font-medium text-xs hover:bg-stone-50 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>이전단계 (보석 색상 수정)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: ORDER & CHECKOUT SECTION */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Title */}
          <div className="flex items-baseline space-x-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#27397d] tracking-tight">
              커스텀목걸이
            </h2>
            <p className="text-xs sm:text-sm text-[#27397d]/75 font-sans">
              완성된 1:1 맞춤 제작 목걸이 정보를 확인하고 바로 주문을 진행합니다.
            </p>
          </div>

          {/* 2-Column Product & Order Checkout Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start bg-white p-6 sm:p-10 rounded-2xl border border-brand-border shadow-xs">
            {/* Left: Final Custom Pendant Image Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-full max-w-[340px] aspect-[3/4] bg-stone-50 rounded-2xl overflow-hidden border border-brand-border shadow-sm flex items-center justify-center p-4">
                <Image
                  src="/images/custom/pendant_final.jpg"
                  alt="Final Custom Necklace"
                  fill
                  className="object-contain drop-shadow-md"
                />

                {/* Real Gemstone Center Preview Overlay */}
                <div
                  className="absolute rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    top: '67%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '26px',
                    height: '26px',
                  }}
                >
                  <div className="relative w-full h-full rounded-full overflow-hidden border border-white/90 shadow-md">
                    <Image
                      src={centerGemData.image}
                      alt={centerGemData.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Options Summary Badge */}
              <div className="w-full max-w-[340px] p-4 bg-stone-50 rounded-xl border border-brand-border space-y-1.5 text-xs text-[#27397d]">
                <p className="font-bold">✨ 선택된 커스텀 조합:</p>
                <p className="text-[#27397d]/80">• 목걸이: {selectedNecklace.name}</p>
                <p className="text-[#27397d]/80">
                  • 중앙 보석: {centerGemData.name} (실물 원석)
                </p>
                <p className="text-[#27397d]/80">• 서브 보석: 8구 실물 보석 커스텀 세팅</p>
              </div>
            </div>

            {/* Right: Order Summary & Checkout Actions (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Product Price */}
              <div className="border-b border-brand-border pb-4">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#27397d] font-mono tracking-tight">
                  ₩ {pricePerItem.toLocaleString()}
                </h3>
              </div>

              {/* Delivery & Custom Production Notice Box */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-[#27397d]/15 space-y-2 text-xs text-[#27397d]">
                <div className="flex items-center space-x-2 font-bold">
                  <span>📦 배송비:</span>
                  <span className="text-[#27397d]">무료배송</span>
                </div>
                <div className="flex items-start space-x-2 text-[11px] text-[#27397d]/80 leading-relaxed">
                  <Sparkles size={14} className="shrink-0 mt-0.5 text-[#27397d]" />
                  <span>
                    주문 후 제작 상품 (제작 기간 약 1주일 소요, 완제품 발송)
                  </span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between py-2 border-b border-brand-border">
                <span className="text-xs font-bold text-[#27397d] uppercase tracking-wider">
                  수량 (QUANTITY)
                </span>
                <div className="flex items-center border border-brand-border rounded bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center text-[#27397d] hover:bg-stone-100 font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-[#27397d] font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 flex items-center justify-center text-[#27397d] hover:bg-stone-100 font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Order Amount */}
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-sm font-bold text-[#27397d]">총 결제 금액</span>
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#27397d]">
                  ₩ {totalPrice.toLocaleString()}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                {addedFeedback && (
                  <div className="p-3 bg-[#a7f99e]/30 border border-[#a7f99e] rounded-md text-xs font-bold text-[#27397d] flex items-center justify-between animate-fadeIn">
                    <span>✓ 장바구니에 커스텀 상품이 담겼습니다!</span>
                    <button
                      onClick={() => router.push('/cart')}
                      className="underline cursor-pointer hover:opacity-80"
                    >
                      장바구니 확인하기 →
                    </button>
                  </div>
                )}

                {/* Primary Buy Now Button */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full bg-[#a7f99e] text-[#27397d] py-4 px-6 rounded-none font-bold text-base hover:brightness-105 transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>바로 구매하기 (테스트 결제)</span>
                  <ArrowRight size={18} />
                </button>

                {/* Secondary Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full bg-white text-[#27397d] border-2 border-[#a7f99e] py-3.5 px-6 rounded-none font-bold text-sm hover:bg-[#a7f99e]/20 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ShoppingBag size={18} />
                  <span>장바구니 담기</span>
                </button>

                {/* Step Back Action */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full text-center text-xs text-[#27397d]/70 hover:text-[#27397d] py-2 cursor-pointer font-medium"
                >
                  ‹ 이전 단계 (반려동물 합성 및 보석 수정)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
