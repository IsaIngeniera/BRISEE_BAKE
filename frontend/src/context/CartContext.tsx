'use client';

import {
  createContext,
  useEffect,
  useState,
  useCallback,
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
  refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [removedItems, setRemovedItems] = useState<string[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchCart = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const storedCart = localStorage.getItem('brisee_cart');
        if (storedCart) {
          setItems(JSON.parse(storedCart));
        } else {
          setItems([]);
        }
      }
      setRemovedItems([]); // Ya no tenemos backend para items removidos
      setLoadError(false);
    } catch (error) {
      console.error('Error fetching cart from localStorage:', error);
      setLoadError(true);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToCart = async (
    product: Omit<CartItem, 'cantidad'>,
    cantidad: number,
  ) => {
    setItems((prev) => {
      const currentCart = [...prev];
      const existingIndex = currentCart.findIndex((item) => item.productId === product.productId);
      if (existingIndex > -1) {
        currentCart[existingIndex].cantidad += cantidad;
      } else {
        currentCart.push({ ...product, cantidad });
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('brisee_cart', JSON.stringify(currentCart));
      }
      return currentCart;
    });
  };

  const removeFromCart = async (productId: CartItem['productId']) => {
    setItems((prev) => {
      const currentCart = prev.filter((item) => item.productId !== productId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('brisee_cart', JSON.stringify(currentCart));
      }
      return currentCart;
    });
  };

  const updateQuantity = async (productId: CartItem['productId'], cantidad: number) => {
    setItems((prev) => {
      const currentCart = prev.map((item) =>
        item.productId === productId ? { ...item, cantidad } : item,
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('brisee_cart', JSON.stringify(currentCart));
      }
      return currentCart;
    });
  };

  const clearCart = () => {
    setItems([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('brisee_cart');
    }
  };

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
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}