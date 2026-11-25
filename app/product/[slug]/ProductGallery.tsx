"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type ProductGalleryProps = {
  images: string[];
  alt: string;
};

export default function ProductGallery({
  images,
  alt,
}: ProductGalleryProps) {
  const galleryImages = useMemo(() => {
    return images
      .filter(
        (image): image is string =>
          typeof image === "string" &&
          image.trim().length > 0
      )
      .slice(0, 6);
  }, [images]);

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [galleryImages.join("|")]);

  if (galleryImages.length === 0) {
    return (
      <div className={styles.galleryColumn}>
        <div className={styles.mainImageBox}>
          <div
            role="img"
            aria-label="No product image available"
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              fontSize: "14px",
            }}
          >
            No image available
          </div>
        </div>
      </div>
    );
  }

  const safeSelectedIndex = Math.min(
    selectedIndex,
    galleryImages.length - 1
  );

  const selectedImage =
    galleryImages[safeSelectedIndex];

  const thumbnailItems = galleryImages
    .map((src, index) => ({
      src,
      originalIndex: index,
    }))
    .filter(
      (item) =>
        item.originalIndex !== safeSelectedIndex
    );

  return (
    <div className={styles.galleryColumn}>
      {/* تصویر بزرگ */}
      <div className={styles.mainImageBox}>
        <img
          key={selectedImage}
          src={selectedImage}
          alt={alt}
          className={styles.mainImage}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable={false}
        />
      </div>

      {/* فقط بقیه تصاویر پایین نمایش داده شوند */}
      {thumbnailItems.length > 0 && (
        <div
          className={styles.thumbnails}
          role="group"
          aria-label="Product image gallery"
        >
          {thumbnailItems.map(
            ({ src, originalIndex }, index) => (
              <button
                key={`${src}-${originalIndex}`}
                type="button"
                className={styles.thumbnail}
                onClick={() =>
                  setSelectedIndex(originalIndex)
                }
                aria-label={`Show product image ${
                  originalIndex + 1
                }`}
              >
                <img
                  src={src}
                  alt={`${alt} - image ${
                    originalIndex + 1
                  }`}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}