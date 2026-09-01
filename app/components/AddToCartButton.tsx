"use client";

import { useState } from "react";
import { useCart } from "@/src/context/CartContext";

type Props = {
  slug: string;
  name: string;
  image: string;
  price: number;
};

export default function AddToCartButton({ slug, name, image, price }: Props) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      onClick={() => {
        addToCart({ slug, name, image, price });
        setAdded(true);
      }}
      style={{
        width: "100%",
        height: "58px",
        border: "none",
        borderRadius: "999px",
        background: added ? "#5f7f5f" : "#C08F8F",
        color: "#fff",
        fontSize: "17px",
        cursor: "pointer",
      }}
    >
      {added ? "به سبد اضافه شد" : "افزودن به سبد خرید"}
    </button>
  );
}