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
  addToCart: (
    product: Omit<CartItem, 'cantidad'>,
    cantidad: number,
  ) => void;
  removeFromCart: (productId: CartItem['productId']) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = 'brisee-bake-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar el carrito guardado al montar (solo en el navegador)
 useEffect(() => {
  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (storedCart) {
      const parsedCart = JSON.parse(storedCart) as unknown as CartItem[];
      queueMicrotask(() => setItems(parsedCart));
    }
  } catch (error) {
    console.error('Error loading cart from storage:', error);
  } finally {
    setIsHydrated(true);
  }
}, []);

  // Persistir cada vez que cambie (después de la carga inicial)
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }, [items, isHydrated]);

  const addToCart = (
    product: Omit<CartItem, 'cantidad'>,
    cantidad: number,
  ) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.productId === product.productId,
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.productId === product.productId
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item,
        );
      }

      return [...prevItems, { ...product, cantidad }];
    });
  };

  const removeFromCart = (productId: CartItem['productId']) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId),
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{ items, totalItems, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}