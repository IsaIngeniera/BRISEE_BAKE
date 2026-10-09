'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export interface CartItem {
  productId: string | number;
  nombre: string;
  precio: number | string;
  imagenUrl?: string;
  tematica?: string;
  cantidad: number;
}

interface CatalogProduct {
  id: string | number;
  estado: 'ACTIVO' | 'INACTIVO';
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
  removedItems: string[];
  isHydrated: boolean;
  refreshCart: () => Promise<void>;
}

import { getSessionUser, AUTH_CHANGE_EVENT } from '../services/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getCartStorageKey(): string {
  if (typeof window === 'undefined') return 'brisee_cart_guest';
  const user = getSessionUser();
  if (user) {
    return `brisee_cart_${user.sub}`;
  }
  return 'brisee_cart_guest';
}

export const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  const key = getCartStorageKey();
  const storedCart = localStorage.getItem(key);

  if (!storedCart) {
    return [];
  }

  const parsed: unknown = JSON.parse(storedCart);

  if (!Array.isArray(parsed)) {
    throw new Error('El carrito guardado no tiene un formato válido.');
  }

  return parsed as CartItem[];
}

function saveStoredCart(items: CartItem[]): void {
  const key = getCartStorageKey();
  localStorage.setItem(key, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [removedItems, setRemovedItems] = useState<string[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshCart = useCallback(async (): Promise<void> => {
    try {
      const storedItems = readStoredCart();

      if (storedItems.length === 0) {
        setItems([]);
        setRemovedItems([]);
        setLoadError(false);
        return;
      }

      const response = await fetch(`${API_URL}/products`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('No se pudo consultar el catálogo.');
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('El catálogo no devolvió una lista válida.');
      }

      const catalog = data as CatalogProduct[];

      const activeIds = new Set(
        catalog
          .filter((product) => product.estado === 'ACTIVO')
          .map((product) => String(product.id)),
      );

      const availableItems = storedItems.filter((item) =>
        activeIds.has(String(item.productId)),
      );

      const removed = storedItems
        .filter((item) => !activeIds.has(String(item.productId)))
        .map((item) => item.nombre);

      if (removed.length > 0) {
        saveStoredCart(availableItems);
      }

      setItems(availableItems);
      setRemovedItems(removed);
      setLoadError(false);
    } catch (error) {
      console.error('Error al validar el carrito:', error);
      setLoadError(true);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCart();

    const handleAuthChange = () => {
      void refreshCart();
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    };
  }, [refreshCart]);

  const addToCart = (
    product: Omit<CartItem, 'cantidad'>,
    cantidad: number,
  ): void => {
    setItems((previous) => {
      const existingItem = previous.find(
        (item) => String(item.productId) === String(product.productId),
      );

      const updated = existingItem
        ? previous.map((item) =>
            String(item.productId) === String(product.productId)
              ? { ...item, cantidad: item.cantidad + cantidad }
              : item,
          )
        : [...previous, { ...product, cantidad }];

      saveStoredCart(updated);
      return updated;
    });
  };

  const removeFromCart = (productId: CartItem['productId']): void => {
    setItems((previous) => {
      const updated = previous.filter(
        (item) => String(item.productId) !== String(productId),
      );

      saveStoredCart(updated);
      return updated;
    });
  };

  const updateQuantity = (
    productId: CartItem['productId'],
    cantidad: number,
  ): void => {
    setItems((previous) => {
      const updated = previous.map((item) =>
        String(item.productId) === String(productId)
          ? { ...item, cantidad }
          : item,
      );

      saveStoredCart(updated);
      return updated;
    });
  };

  const clearCart = useCallback((): void => {
    setItems([]);
    setRemovedItems([]);
    const key = getCartStorageKey();
    localStorage.removeItem(key);
  }, []);

  const totalItems = items.reduce(
    (sum, item) => sum + item.cantidad,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        loadError,
        removedItems,
        isHydrated,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}