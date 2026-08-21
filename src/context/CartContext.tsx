import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product, Reward } from '@/types/database';

export type CartLine =
  | { kind: 'product'; product: Product; quantity: number }
  | { kind: 'reward'; reward: Reward; quantity: number };

const STORAGE_KEY = 'vatoz_cart_v1';

type StoredLine =
  | { kind: 'product'; product: Product; quantity: number }
  | { kind: 'reward'; reward: Reward; quantity: number };

function loadCart(): StoredLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredLine[]) : [];
  } catch {
    return [];
  }
}

interface CartContextValue {
  lines: CartLine[];
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  setProductQuantity: (productId: string, quantity: number) => void;
  toggleReward: (reward: Reward) => void;
  clear: () => void;
  totalPrice: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => loadCart());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const addProduct = (product: Product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.kind === 'product' && l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.kind === 'product' && l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { kind: 'product', product, quantity: 1 }];
    });
  };

  const removeProduct = (productId: string) => {
    setLines((prev) => prev.filter((l) => !(l.kind === 'product' && l.product.id === productId)));
  };

  const setProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.kind === 'product' && l.product.id === productId ? { ...l, quantity } : l)),
    );
  };

  const toggleReward = (reward: Reward) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.kind === 'reward' && l.reward.id === reward.id);
      if (existing) {
        return prev.filter((l) => !(l.kind === 'reward' && l.reward.id === reward.id));
      }
      return [...prev, { kind: 'reward', reward, quantity: 1 }];
    });
  };

  const clear = () => setLines([]);

  const totalPrice = useMemo(
    () => lines.reduce((sum, l) => (l.kind === 'product' ? sum + l.product.price * l.quantity : sum), 0),
    [lines],
  );
  const totalPointsEarned = useMemo(
    () => lines.reduce((sum, l) => (l.kind === 'product' ? sum + l.product.vibe_points * l.quantity : sum), 0),
    [lines],
  );
  const totalPointsRedeemed = useMemo(
    () => lines.reduce((sum, l) => (l.kind === 'reward' ? sum + l.reward.required_points * l.quantity : sum), 0),
    [lines],
  );
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider
      value={{
        lines,
        addProduct,
        removeProduct,
        setProductQuantity,
        toggleReward,
        clear,
        totalPrice,
        totalPointsEarned,
        totalPointsRedeemed,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
