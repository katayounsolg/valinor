
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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

const CART_STORAGE_KEY = "valinor_cart_guest";

const CartContext = createContext<CartContextType | null>(null);

function readSavedCart(): CartItem[] {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
      return [];
    }

    const parsed: unknown = JSON.parse(savedCart);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is CartItem => {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        return false;
      }

      const cartItem = item as Partial<CartItem>;

      return (
        typeof cartItem.slug === "string" &&
        cartItem.slug.length > 0 &&
        typeof cartItem.name === "string" &&
        typeof cartItem.image === "string" &&
        typeof cartItem.price === "number" &&
        Number.isSafeInteger(cartItem.price) &&
        cartItem.price >= 0 &&
        typeof cartItem.quantity === "number" &&
        Number.isInteger(cartItem.quantity) &&
        cartItem.quantity > 0 &&
        cartItem.quantity <= 100
      );
    });
  } catch (error) {
    console.error("Failed to load cart:", error);
    return [];
  }
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load the guest cart only once.
  useEffect(() => {
    setItems(readSavedCart());
    setLoaded(true);
  }, []);

  // Save changes to the guest cart.
  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [items, loaded]);

  function addToCart(
    item: Omit<CartItem, "quantity">
  ) {
    if (
      !item.slug ||
      !Number.isSafeInteger(item.price) ||
      item.price < 0
    ) {
      return;
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (cartItem) => cartItem.slug === item.slug
      );

      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.slug === item.slug
            ? {
                ...cartItem,
                quantity: Math.min(
                  cartItem.quantity + 1,
                  100
                ),
              }
            : cartItem
        );
      }

      return [
        ...currentItems,
        {
          slug: item.slug,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: 1,
        },
      ];
    });
  }

  function increase(slug: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.slug === slug
          ? {
              ...item,
              quantity: Math.min(
                item.quantity + 1,
                100
              ),
            }
          : item
      )
    );
  }

  function decrease(slug: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.slug === slug
          ? {
              ...item,
              quantity: Math.max(
                item.quantity - 1,
                1
              ),
            }
          : item
      )
    );
  }

  function remove(slug: string) {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.slug !== slug
      )
    );
  }

  const total = items.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
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
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}