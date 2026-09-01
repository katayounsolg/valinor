"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type CartItem = {
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  loaded: boolean;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  increase: (slug: string) => void;
  decrease: (slug: string) => void;
  remove: (slug: string) => void;
  total: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [items, setItems] = useState<CartItem[]>([]);
  const [storageKey, setStorageKey] = useState("valinor_cart_guest");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadUserCart() {
      setLoaded(false);

      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await res.json();

        const key = data.user?.phone
          ? `valinor_cart_${data.user.phone}`
          : "valinor_cart_guest";

        setStorageKey(key);

        const savedCart = localStorage.getItem(key);

        setItems(savedCart ? JSON.parse(savedCart) : []);
      } catch {
        setStorageKey("valinor_cart_guest");

        const savedCart = localStorage.getItem("valinor_cart_guest");

        setItems(savedCart ? JSON.parse(savedCart) : []);
      } finally {
        setLoaded(true);
      }
    }

    loadUserCart();
  }, [pathname]);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey, loaded]);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (cartItem) => cartItem.slug === item.slug
      );

      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.slug === item.slug
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        );
      }

      return [
        ...currentItems,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  };

  const increase = (slug: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.slug === slug
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  const decrease = (slug: string) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.slug === slug && item.quantity > 1
          ? {
              ...item,
              quantity: item.quantity - 1,
            }
          : item
      )
    );
  };

  const remove = (slug: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.slug !== slug)
    );
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loaded,
        addToCart,
        increase,
        decrease,
        remove,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}