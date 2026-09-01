"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type TabKey = "notebooks" | "planner";

type Collection = {
  name: string;
  lines: string[];
  image: string;
  href: string;
};

const notebookCollections: Collection[] = [
  {
    name: "Palette",
    lines: ["Soft tones.", "Quiet inspiration."],
    image: "/images/hero/hero-banner.png",
    href: "/products/sabet",
  },
  {
    name: "Origin",
    lines: ["Timeless leather.", "Enduring character."],
    image: "/images/hero/hero-banner.png",
    href: "/products/tikeh",
  },
  {
    name: "Kumi",
    lines: ["Interlaced by hand.", "Strength in structure."],
    image: "/images/hero/hero-banner.png",
    href: "/products/kumi",
  },
  {
    name: "Mosaic",
    lines: [
      "Pieces become something new. Fragments are gathered",
      "into a calm composition. Each part keeps its own character,",
      "while the whole object becomes balanced and complete.",
    ],
    image: "/images/hero/hero-banner.png",
    href: "/products/baft",
  },
  {
    name: "Revealed",
    lines: ["Precision in every cut", "and edge."],
    image: "/images/hero/hero-banner.png",
    href: "/products/boresh",
  },
  {
    name: "Journal & Junior",
    lines: ["Hand binding.", "Always together."],
    image: "/images/hero/hero-banner.png",
    href: "/products/mini",
  },
  {
    name: "Mono",
    lines: ["One piece.", "Timeless simplicity."],
    image: "/images/hero/hero-banner.png",
    href: "/products/moteharek",
  },
];

export default function ProductsCollections() {
  const [activeTab, setActiveTab] = useState<TabKey>("notebooks");

  return (
    <section className={styles.collectionArea}>
      <div className={styles.tabsGuide}>
        <div className={styles.partialLine}></div>

        <div className={styles.tabsRow}>
          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === "notebooks" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("notebooks")}
          >
            Notebooks
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${
              activeTab === "planner" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("planner")}
          >
            To do | Planner
          </button>
        </div>
      </div>

      <div className={styles.fullLine}></div>

      {activeTab === "notebooks" ? (
        <div className={styles.collectionsBlock}>
          <h2>Collections</h2>

          <div className={styles.collectionGrid}>
            {notebookCollections.map((collection) => (
              <Link
                key={collection.name}
                href={collection.href}
                className={styles.collectionCard}
              >
                <div className={styles.collectionImageBox}>
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className={styles.collectionImage}
                  />
                </div>

                <div className={styles.collectionInfo}>
                  <h3>{collection.name}</h3>

                  <p>
                    {collection.lines.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          To do and planner collections will be added here.
        </div>
      )}
    </section>
  );
}