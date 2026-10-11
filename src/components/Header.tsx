'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const pathname = usePathname();
  const { totalItemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const navLinks = [
    { name: 'MAIN', href: '/' },
    { name: 'SHOP', href: '/shop' },
    { name: 'CUSTOM', href: '/custom' },
    { name: 'ABOUT', href: '/about' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchKeyword.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-brand-border transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left Column: Mobile Menu Toggle / Desktop Brand Logo */}
          <div className="w-20 md:w-36 lg:w-48 shrink-0 flex items-center justify-start">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 -ml-1 text-brand-blue hover:text-[#a7f99e] focus:outline-none md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Desktop Brand Logo */}
            <div className="hidden md:flex items-center">
              <Link
                href="/"
                className={`flex items-center py-1 transition-opacity ${
                  pathname === '/' ? 'opacity-0 pointer-events-none' : 'hover:opacity-85'
                }`}
                aria-hidden={pathname === '/'}
                tabIndex={pathname === '/' ? -1 : 0}
              >
                <img
                  src="/images/cano_logo_navy.png"
                  alt="CANO CANO"
                  className="h-6 sm:h-7 w-auto object-contain"
                />
              </Link>
            </div>
          </div>

          {/* Center Column: Mobile Center Logo on Subpages / Desktop Navigation */}
          <div className="flex-1 flex items-center justify-center">
            {/* Mobile: Centered Logo on Shop, Custom, About, Inquiry etc. */}
            <div className="md:hidden flex items-center justify-center">
              {pathname !== '/' && (
                <Link href="/" className="flex items-center justify-center py-1">
                  <img
                    src="/images/cano_logo_navy.png"
                    alt="CANO CANO"
                    className="h-5.5 w-auto object-contain"
                  />
                </Link>
              )}
            </div>

            {/* Desktop Navigation (Absolute Center Fixed) */}
            <nav className="hidden md:flex items-center justify-center space-x-7 lg:space-x-10 font-montserrat">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-lg font-medium tracking-wide transition-colors duration-150 py-1 ${
                      isActive ? 'text-[#a7f99e]' : 'text-[#27397d] hover:text-[#a7f99e]'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Column: Action Icons & Text Links (Search, Order Lookup, Inquiry & Shopping Bag) */}
          <div className="w-auto shrink-0 flex items-center justify-end space-x-3 sm:space-x-4 md:space-x-5">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="text-[#27397d] hover:text-[#a7f99e] transition-colors p-1"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* Order Lookup Link (Desktop) */}
            <Link
              href="/order-lookup"
              className="hidden sm:inline-block text-xs font-medium text-[#27397d] hover:text-[#a7f99e] transition-colors whitespace-nowrap"
            >
              주문조회
            </Link>

            {/* Inquiry Link (Desktop) */}
            <Link
              href="/inquiry"
              className="hidden sm:inline-block text-xs font-medium text-[#27397d] hover:text-[#a7f99e] transition-colors whitespace-nowrap"
            >
              문의하기
            </Link>

            {/* Shopping Bag / Cart Link */}
            <Link
              href="/cart"
              className="relative p-1 text-[#27397d] hover:text-[#a7f99e] transition-colors"
              aria-label="Shopping Bag"
            >
              <ShoppingBag size={21} className="sm:w-[22px] sm:h-[22px]" />
              {totalItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#27397d] text-white text-[10px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        {searchOpen && (
          <div className="py-4 border-t border-brand-border animate-in fade-in duration-200">
            <form onSubmit={handleSearch} className="flex items-center max-w-lg mx-auto">
              <input
                type="text"
                placeholder="검색어를 입력하세요 (예: 해먹, 스크레쳐, 베베블)"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="flex-1 px-4 py-2 text-sm bg-stone-50 border border-brand-border rounded-l-md focus:outline-none focus:border-[#27397d]"
                autoFocus
              />
              <button
                type="submit"
                className="bg-[#27397d] text-white px-5 py-2 text-sm font-medium rounded-r-md hover:bg-[#27397d]/90 transition-colors"
              >
                검색
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-brand-border px-4 pt-2 pb-6 space-y-3 font-montserrat">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 text-base font-medium ${
                pathname === link.href ? 'text-[#a7f99e]' : 'text-[#27397d]'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-brand-border space-y-2">
            <Link
              href="/order-lookup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 text-sm text-[#27397d] hover:text-[#a7f99e]"
            >
              <span>주문 / 배송 조회</span>
            </Link>
            <Link
              href="/inquiry"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 text-sm text-[#27397d] hover:text-[#a7f99e]"
            >
              <span>문의하기</span>
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 text-sm text-[#27397d] hover:text-[#a7f99e]"
            >
              <span>장바구니 ({totalItemCount})</span>
              <ShoppingBag size={16} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
