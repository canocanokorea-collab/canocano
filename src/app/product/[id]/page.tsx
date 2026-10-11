import React from 'react';
import productsData from '@/data/products.json';
import { Product } from '@/types';
import ProductDetailClient from '@/components/ProductDetailClient';

export function generateStaticParams() {
  const products = productsData as Product[];
  const existingIds = products.map((product) => ({
    id: product.id,
  }));
  // Pre-generate dynamic slots 30 to 100 for newly duplicated / added products
  const extraSlots = Array.from({ length: 71 }, (_, i) => ({
    id: (30 + i).toString(),
  }));
  return [...existingIds, ...extraSlots];
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const products = productsData as Product[];
  const product =
    products.find((p) => p.id === params.id) ||
    ({
      id: params.id,
      name: '상품 로딩 중...',
      category: '가구/소품',
      categoryId: 'furniture',
      price: 0,
      originalPrice: 0,
      status: '판매중',
      isDisplayed: true,
      mainImage: '/images/placeholder.jpg',
      detailImages: [],
      options: [],
      delivery: {
        type: '화물택배',
        fee: 0,
        freeThreshold: 50000,
      },
      detailHtml: '',
      createdAt: new Date().toISOString(),
    } as Product);

  return <ProductDetailClient product={product} />;
}
