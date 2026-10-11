'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '@/types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, selectedOptions: Record<string, string>, quantity?: number) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  totalItemCount: number;
  totalProductPrice: number;
  deliveryFee: number;
  finalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('canocano_cart');
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('canocano_cart', JSON.stringify(cart));
      } catch (e) {
        console.error('Failed to save cart', e);
      }
    }
  }, [cart, isLoaded]);

  const addToCart = (product: Product, selectedOptions: Record<string, string>, quantity = 1) => {
    setCart((prev) => {
      // Check if identical item already exists
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            product,
            selectedOptions,
            quantity,
            unitPrice: product.price,
          },
        ];
      }
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => {
      const next = [...prev];
      next[index].quantity = quantity;
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalProductPrice = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  
  // 조건부 무료배송: 총 결제 50,000원 이상 시 무료 (단 상품별 무료배송이면 0원)
  const isFreeDelivery = totalProductPrice >= 50000 || cart.every((it) => it.product.delivery?.type === '무료');
  const deliveryFee = totalProductPrice === 0 ? 0 : isFreeDelivery ? 0 : 3500;
  const finalPrice = totalProductPrice + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemCount,
        totalProductPrice,
        deliveryFee,
        finalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
