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
  materialAndSize?: string;
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
  materialAndSize,
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
                direction: "ltr",
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
                    fontSize: "28px",
                    fontWeight: 400,
                    lineHeight: 1.12,
                    margin: 0,
                    color: "#202020",
                  }
                : undefined
            }
          >
            {shownName}
          </h3>
        </Link>

        {materialAndSize && (
          <p
            dir="ltr"
            style={{
              margin: "9px 0 0",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: 1.4,
              color: "#34312e",
              textAlign: "left",
            }}
          >
            {materialAndSize}
          </p>
        )}

        {!hidePrice && (
          <p
            className={styles.price}
            style={
              editorialCard
                ? {
                    margin: "7px 0 18px",
                    fontSize: "12px",
                    fontWeight: 400,
                    color: "#96908a",
                    textAlign: "left",
                  }
                : undefined
            }
          >
            {price.toLocaleString("fa-IR")} تومان
          </p>
        )}

        {!hideAddToCart && (
          <button
            type="button"
            className={`${styles.cartButton} ${
              added ? styles.cartButtonAdded : ""
            }`}
            style={
              editorialCard
                ? {
                    width: "100%",
                    background: "#202020",
                    color: "#ffffff",
                    border: "1px solid #202020",
                    borderRadius: 0,
                    padding: "13px 12px",
                    fontSize: "12px",
                    letterSpacing: "1.1px",
                    cursor: "pointer",
                  }
                : undefined
            }
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
            {added ? "ADDED TO BAG" : "ADD TO BAG"}
          </button>
        )}
      </div>
    </article>
  );
}
