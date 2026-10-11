"use client";

import React from "react";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/lib/useProducts";

export default function HomeBestGrid() {
  const { products } = useProducts();

  // 메인 화면 대표 상품 필터링 (노출 상품 중 판매중/품절, 최대 8개)
  const displayProducts = products
    .filter((p) => p.isDisplayed !== false && (p.status === "판매중" || p.status === "품절"))
    .slice(0, 8);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
      {displayProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
