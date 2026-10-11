import { useState, useEffect, useCallback } from "react";
import initialProductsData from "@/data/products.json";
import { Product } from "@/types";

const LOCAL_STORAGE_KEY = "cano_product_overrides_v12";

function applyOverrides(baseProducts: Product[], overrides: Record<string, Partial<Product>>): Product[] {
  if (!overrides || Object.keys(overrides).length === 0) {
    return baseProducts;
  }

  const updated = baseProducts.map((p) => {
    if (overrides[p.id]) {
      return { ...p, ...overrides[p.id] };
    }
    return p;
  });

  const existingIds = new Set(updated.map((p) => p.id));
  const newProducts: Product[] = [];

  Object.keys(overrides).forEach((key) => {
    if (!existingIds.has(key) && overrides[key]) {
      newProducts.push({
        id: key,
        name: overrides[key].name || "새 상품",
        category: overrides[key].category || "가구/소품",
        categoryId: overrides[key].categoryId || "furniture",
        price: overrides[key].price || 0,
        originalPrice: overrides[key].originalPrice || 0,
        status: overrides[key].status || "판매중",
        isDisplayed: overrides[key].isDisplayed !== undefined ? overrides[key].isDisplayed : true,
        mainImage: overrides[key].mainImage || "/images/placeholder.jpg",
        detailImages: overrides[key].detailImages || [],
        options: overrides[key].options || [],
        delivery: overrides[key].delivery || { type: "화물택배", fee: 0, freeThreshold: 50000 },
        description: overrides[key].description || "",
        detailBodyImages: overrides[key].detailBodyImages || [],
        detailNoticeText: overrides[key].detailNoticeText || "",
        detailHtml: overrides[key].detailHtml || "",
        createdAt: overrides[key].createdAt || new Date().toISOString(),
        ...overrides[key],
      } as Product);
    }
  });

  return [...updated, ...newProducts];
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(initialProductsData as Product[]);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Initial immediate hydration from LocalStorage (0ms SWR)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsedOverrides = JSON.parse(cached);
        if (parsedOverrides && typeof parsedOverrides === "object") {
          setProducts(applyOverrides(initialProductsData as Product[], parsedOverrides));
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }, []);

  // 2. Background fresh fetch from Cloudflare KV
  useEffect(() => {
    let isMounted = true;
    async function loadOverrides() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) {
          if (isMounted) setIsLoaded(true);
          return;
        }
        const data = await res.json();
        if (data.success && data.overrides && isMounted) {
          const overrides: Record<string, Partial<Product>> = data.overrides;
          setProducts(applyOverrides(initialProductsData as Product[], overrides));
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(overrides));
          } catch {
            // LocalStorage quota safety
          }
        }
      } catch (e) {
        // Fallback to cached or static products
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsLoaded(true);
        }
      }
    }

    loadOverrides();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update or insert product in KV & LocalStorage
  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    // 1. Optimistic update
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === productId);
      if (exists) {
        return prev.map((p) => (p.id === productId ? { ...p, ...updates } : p));
      } else {
        const newProduct: Product = {
          id: productId,
          name: updates.name || "새 상품",
          category: updates.category || "가구/소품",
          categoryId: updates.categoryId || "furniture",
          price: updates.price || 0,
          originalPrice: updates.originalPrice || 0,
          status: updates.status || "판매중",
          isDisplayed: updates.isDisplayed !== undefined ? updates.isDisplayed : false,
          mainImage: updates.mainImage || "/images/placeholder.jpg",
          detailImages: updates.detailImages || [],
          options: updates.options || [],
          delivery: updates.delivery || { type: "화물택배", fee: 0, freeThreshold: 50000 },
          description: updates.description || "",
          detailBodyImages: updates.detailBodyImages || [],
          detailNoticeText: updates.detailNoticeText || "",
          detailHtml: updates.detailHtml || "",
          createdAt: updates.createdAt || new Date().toISOString(),
          ...updates,
        };
        return [...prev, newProduct];
      }
    });

    // 2. Optimistically update localStorage
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      const overrides = cached ? JSON.parse(cached) : {};
      overrides[productId] = {
        ...(overrides[productId] || {}),
        ...updates,
        id: productId,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // Ignore localStorage error
    }

    // 3. Persist to Cloudflare KV
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          ...updates,
        }),
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      console.error("Failed to update product on server:", e);
      return false;
    }
  };

  // Delete product from KV & local state
  const deleteProduct = async (productId: string) => {
    // 1. Optimistic delete
    setProducts((prev) => prev.filter((p) => p.id !== productId));

    // 2. Delete from localStorage
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const overrides = JSON.parse(cached);
        delete overrides[productId];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(overrides));
      }
    } catch {
      // Ignore
    }

    // 3. Persist delete to Cloudflare KV
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          isDelete: true,
        }),
      });
      const data = await res.json();
      return data.success;
    } catch (e) {
      console.error("Failed to delete product on server:", e);
      return false;
    }
  };

  // Clear all overrides / reset to static defaults
  const clearOverrides = useCallback(async () => {
    setProducts(initialProductsData as Product[]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearAll: true }),
      });
    } catch (e) {
      console.error("Failed to reset overrides:", e);
    }
  }, []);

  return { products, setProducts, updateProduct, deleteProduct, clearOverrides, loading, isLoaded };
}
