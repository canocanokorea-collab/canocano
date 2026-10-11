import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import productsData from '@/data/products.json';
import { Product } from '@/types';

export default function ArchivePage() {
  const products = productsData as Product[];

  // 갤러리 이미지 모음
  const galleryItems = [
    {
      title: '플라워 참',
      desc: '2026년 3D 프린팅 플라워 젬 참',
      image: '/images/products/flower-charm-thumb-pink-v11.png',
      productId: '33',
    },
    {
      title: '유닛 젬 목걸이',
      desc: '2026년 3D 프린팅 맞춤 각인 유닛 젬 목걸이',
      image: '/images/products/unit-gem-necklace-thumb-pink-v17.png',
      productId: '32',
    },
    {
      title: '라운드 젬 목걸이',
      desc: '2026년 3D 프린팅 맞춤 각인 라운드 젬 목걸이',
      image: '/images/products/round-gem-necklace-thumb-pink-v6.png',
      productId: '31',
    },
    {
      title: '드롭 젬 목걸이',
      desc: '2026년 3D 프린팅 맞춤 각인 드롭 젬 목걸이',
      image: '/images/products/drop-gem-necklace-thumb-olive-v6.png',
      productId: '30',
    },
    {
      title: '스타 젬 목걸이',
      desc: '2026년 3D 프린팅 맞춤 각인 스타 젬 목걸이',
      image: '/images/products/star-gem-necklace-thumb-yellow-v6.png',
      productId: '29',
    },
    {
      title: '오벌 젬 목걸이',
      desc: '2026년 3D 프린팅 맞춤 각인 오벌 젬 목걸이',
      image: '/images/products/oval-gem-necklace-thumb-pastel-v7.png',
      productId: '28',
    },
    {
      title: '하트 젬 목걸이',
      desc: '2026년 3D 프린팅 맞춤 각인 하트 젬 목걸이',
      image: '/images/products/heart-gem-necklace-thumb-deep-v6.png',
      productId: '27',
    },
    {
      title: '베베블 우드 테이블',
      desc: '루미낙 강화유리 볼과 자작나무의 조화',
      image: 'https://cdn.imweb.me/thumbnail/20260203/aef552aa2322f.jpg',
      productId: '26',
    },
    {
      title: '크로스 우드 테이블',
      desc: '독창적인 엑스자 프레임의 원목 식탁',
      image: 'https://cdn-optimized.imweb.me/upload/S202601287894e63213ee4/45b8e8adceb4d.jpg?w=800',
      productId: '23',
    },
    {
      title: '삼각 우드 하우스',
      desc: '아늑한 삼각 텐트형 원목 안식처',
      image: 'https://cdn-optimized.imweb.me/upload/S202601287894e63213ee4/1212bb81cb387.jpg?w=800',
      productId: '18',
    },
    {
      title: '삼각 우드 하우스 ver.2',
      desc: '문 방향 및 디자인을 업그레이드한 프리미엄 하우스',
      image: 'https://cdn-optimized.imweb.me/upload/S202601287894e63213ee4/d74d7d9776b77.jpg?w=800',
      productId: '14',
    },
    {
      title: '실린더 우드 테이블',
      desc: '원형 실린더 라인의 감각적인 식기대',
      image: 'https://cdn-optimized.imweb.me/upload/S202601287894e63213ee4/f4f56d4ca41bc.jpg?w=800',
      productId: '17',
    },
    {
      title: '밀크볼 우드 테이블',
      desc: '2016년 카노카노의 시작을 함께한 오리지널 우드 테이블',
      image: '/images/archive_milkbowl_wood_table_2016.png?v=2',
      productId: 'archive_milkbowl_wood_table_2016',
    },
    {
      title: '스마일 노즈워크 매트',
      desc: '2016년 반려견을 위한 시그니처 노즈워크 플레이 매트',
      image: '/images/archive_smile_nosework_mat_2016.png',
      productId: 'archive_smile_nosework_mat_2016',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="border-b border-brand-border pb-6 text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold text-[#27397d] uppercase tracking-widest">
          CANO CANO ARCHIVE
        </span>
        <h1 className="text-3xl font-extrabold text-brand-blue mt-1">ARCHIVE</h1>
        <p className="text-sm text-[#27397d]/70 max-w-xl mx-auto mt-3 font-sans">
          과거 출시되었던 소중한 제품들과 카노카노의 지난 여정을 기록하는 공간입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {galleryItems.map((item, idx) => (
          <Link
            key={idx}
            href={`/product/${item.productId}`}
            className="group block bg-white rounded-xl overflow-hidden border border-brand-border hover:shadow-lg transition-all"
          >
            <div className={`relative bg-white overflow-hidden ${
              item.productId && parseInt(item.productId) >= 27 ? 'aspect-[3/4]' : 'aspect-[4/3]'
            }`}>
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5">
              <h3 className="text-base font-bold text-brand-blue group-hover:opacity-80 transition-opacity">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
