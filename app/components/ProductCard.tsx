"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useCart } from "@/src/context/CartContext";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  id: number;
  name: string;
  image: string;
  price: number;
  slug: string;
  displayName?: string;
  hidePrice?: boolean;
  hideAddToCart?: boolean;
  hideFavorite?: boolean;
  serifName?: boolean;
  editorialCard?: boolean;
};

export default function ProductCard({
  id,
  name,
  image,
  price,
  slug,
  displayName,
  hidePrice = false,
  hideAddToCart = false,
  hideFavorite = false,
  serifName = false,
  editorialCard = false,
}: ProductCardProps) {
  const [favorite, setFavorite] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  const shownName = displayName || name;

  async function toggleFavorite() {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });

    const data = await res.json();
    if (data.success) setFavorite(data.favorite);
  }

  return (
    <article
      className={styles.card}
      style={
        editorialCard
          ? {
              border: "1px solid #e8e4df",
              background: "#fbf8f3",
              padding: "18px",
              boxSizing: "border-box",
            }
          : undefined
      }
    >
      {!hideFavorite && (
        <button
          className={`${styles.favoriteButton} ${
            favorite ? styles.favoriteActive : ""
          }`}
          onClick={toggleFavorite}
          aria-label="Favorite"
        >
          <Heart size={18} strokeWidth={1.2} />
        </button>
      )}

      <Link href={`/product/${slug}`} className={styles.imageLink}>
        <div
          className={styles.imageBox}
          style={
            editorialCard
              ? {
                  background: "#ffffff",
                  borderBottom: "1px solid #e8e4df",
                }
              : undefined
          }
        >
          <img src={image} alt={shownName} className={styles.image} />
        </div>
      </Link>

      <div
        className={styles.info}
        style={
          editorialCard
            ? {
                paddingTop: "20px",
                textAlign: "left",
              }
            : undefined
        }
      >
        <Link href={`/product/${slug}`} className={styles.nameLink}>
          <h3
            style={
              serifName
                ? {
                    fontFamily: '"Times New Roman", Georgia, serif',
                    fontSize: "26px",
                    fontWeight: 400,
                    lineHeight: 1.1,
                    margin: 0,
                    color: "#202020",
                  }
                : undefined
            }
          >
            {shownName}
          </h3>
        </Link>

        {!hidePrice && (
          <p className={styles.price}>{price.toLocaleString("fa-IR")} تومان</p>
        )}

        {!hideAddToCart && (
          <button
            className={`${styles.cartButton} ${
              added ? styles.cartButtonAdded : ""
            }`}
            onClick={() => {
              addToCart({
                slug,
                name,
                image,
                price,
              });

              setAdded(true);
            }}
          >
            {added ? "ADDED TO CART" : "ADD TO CART"}
          </button>
        )}
      </div>
    </article>
  );
}