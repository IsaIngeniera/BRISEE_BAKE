'use client';

import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export interface CartItem {
  productId: string | number;
  nombre: string;
  precio: number | string;
  imagenUrl?: string;
  cantidad: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  loadError: boolean;
  addToCart: (
    product: Omit<CartItem, 'cantidad'>,
    cantidad: number,
  ) => void;
  updateQuantity: (
    productId: CartItem['productId'],
    cantidad: number,
  ) => void;
  removeFromCart: (productId: CartItem['productId']) => void;
  clearCart: () => void;
  removedItems?: string[];
  isHydrated?: boolean;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [removedItems, setRemovedItems] = useState<string[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API_URL}/carrito`);
      if (!res.ok) throw new Error('Failed to fetch cart');
      const data = await res.json();
      setItems(data.items);
      setRemovedItems(data.removed);
      setLoadError(false);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setLoadError(true);
    } finally {
      setIsHydrated(true);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (
    product: Omit<CartItem, 'cantidad'>,
    cantidad: number,
  ) => {
    try {
      const res = await fetch(`${API_URL}/carrito/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idProducto: product.productId,
          cantidad,
        }),
      });
      if (res.ok) {
        await fetchCart(); // Refresh cart to get updated quantities
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const removeFromCart = async (productId: CartItem['productId']) => {
    try {
      const res = await fetch(`${API_URL}/carrito/items/${productId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.productId !== productId));
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateQuantity = async (productId: CartItem['productId'], cantidad: number) => {
    try {
      const res = await fetch(`${API_URL}/carrito/items/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.productId === productId ? { ...item, cantidad } : item,
          ),
        );
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadError,
        removedItems,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}