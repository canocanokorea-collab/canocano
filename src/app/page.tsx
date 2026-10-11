import React from 'react';
import Link from 'next/link';
import HomeBestGrid from '@/components/HomeBestGrid';

export default function HomePage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Banner Section */}
      <section className="relative w-full bg-white overflow-hidden pt-12 sm:pt-16 md:pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          {/* Official Signature Navy Logo with Generous Spacing */}
          <div className="text-center pb-12 sm:pb-16 md:pb-20">
            <img
              src="/images/cano_logo_navy_hero.png"
              alt="CANO CANO"
              className="h-8 sm:h-9 md:h-10 w-auto object-contain mx-auto"
            />
          </div>

          {/* Hero Image (Mobile: Focused Large Dog Face with Cropped Sides, Desktop: Full matching product grid width) */}
          <div className="relative w-full rounded-md overflow-hidden h-60 xs:h-72 sm:h-auto sm:aspect-[5323/2445] mx-auto">
            <img
              src="/images/main_hero_dog.jpg?v=12"
              alt="카노카노 메인 반려동물"
              className="w-full h-full object-cover object-center block mx-auto hover:scale-102 transition-transform duration-500"
            />
          </div>

          {/* Single Action Button Below the Photo (Montserrat Font) */}
          <div className="flex items-center justify-center pt-6 sm:pt-8">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center bg-[#a7f99e] text-[#27397d] px-7 py-1.5 rounded-none font-montserrat font-medium text-lg tracking-wide hover:brightness-105 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <span>SHOP</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Best Products Grid (BEST - Matched to SHOP Typography) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-brand-border pb-3">
          <h2 className="font-montserrat text-lg font-medium text-[#27397d] tracking-wide uppercase">
            BEST
          </h2>
        </div>

        <HomeBestGrid />
      </section>
    </div>
  );
}
