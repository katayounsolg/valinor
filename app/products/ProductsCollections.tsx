"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Category = {
  slug: string;
  title: string;
  image: string;
};

type ObjectGroup = {
  id: number | string;
  slug: string;
  title: string;
  categories: Category[];
};

type GroupsResponse = {
  success: boolean;
  groups?: ObjectGroup[];
  message?: string;
};

const collectionDescriptions: Record<string, string[]> = {
  sabet: ["Soft tones.", "Quiet inspiration."],
  tikeh: ["Timeless leather.", "Enduring character."],
  kumi: ["Interlaced by hand.", "Strength in structure."],
  boresh: ["Precision in every cut", "and edge."],
  mini: ["Hand binding.", "Always together."],
  moteharek: ["One piece.", "Timeless simplicity."],
};

const collectionNames: Record<string, string> = {
  sabet: "Palette",
  tikeh: "Origin",
  kumi: "Kumi",
  boresh: "Revealed",
  mini: "Journal & Junior",
  moteharek: "Mono",
};

export default function ProductsCollections() {
  const [groups, setGroups] = useState<ObjectGroup[]>([]);
  const [activeGroupSlug, setActiveGroupSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadGroups() {
      try {
        const response = await fetch("/api/public/object-groups", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data = (await response.json()) as GroupsResponse;

        if (!response.ok || !data.success || !Array.isArray(data.groups)) {
          throw new Error(data.message || "دریافت گروه‌های محصولات انجام نشد.");
        }

        if (controller.signal.aborted) return;

        setGroups(data.groups);
        setActiveGroupSlug((previous) => {
          if (previous && data.groups!.some((group) => group.slug === previous)) {
            return previous;
          }
          return data.groups![0]?.slug ?? null;
        });
        setError("");
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "خطا در دریافت گروه‌های محصولات.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadGroups();
    return () => controller.abort();
  }, []);

  const activeGroup = groups.find((group) => group.slug === activeGroupSlug) ?? groups[0];

  return (
    <section className={styles.collectionArea}>
      <div className={styles.tabsGuide}>
        <div className={styles.partialLine} />
        <div className={styles.tabsRow} role="tablist" aria-label="گروه‌های محصولات">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={activeGroup?.slug === group.slug}
              className={`${styles.tabButton} ${activeGroup?.slug === group.slug ? styles.activeTab : ""}`}
              onClick={() => setActiveGroupSlug(group.slug)}
            >
              {group.title}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.fullLine} />

      {loading ? (
        <div className={styles.emptyState}>در حال بارگذاری مجموعه‌ها...</div>
      ) : error ? (
        <div className={styles.emptyState} role="alert">{error}</div>
      ) : !activeGroup ? (
        <div className={styles.emptyState}>هنوز گروهی برای نمایش ثبت نشده است.</div>
      ) : (
        <div className={styles.collectionsBlock} role="tabpanel">
          <h2 className={styles.seriesHeading} dir="ltr">
            <span className={styles.soolTitle}>
              {activeGroup.slug === "notebooks" ? "SOOL" : activeGroup.title}
            </span>
            <span className={styles.seriesSubtitle}>Series</span>
          </h2>

          {activeGroup.categories.length === 0 ? (
            <div className={styles.emptyState}>
              هنوز دسته‌بندی‌ای به این گروه اختصاص داده نشده است.
            </div>
          ) : (
            <div className={styles.collectionGrid}>
              {activeGroup.categories.map((category) => {
                const name = collectionNames[category.slug] || category.title;
                const lines = collectionDescriptions[category.slug] || [];

                return (
                  <Link
                    key={category.slug}
                    href={`/products/${encodeURIComponent(category.slug)}`}
                    className={styles.collectionCard}
                  >
                    <div className={styles.collectionImageBox}>
                      <img
                        src={category.image}
                        alt={name}
                        className={styles.collectionImage}
                        loading="lazy"
                      />
                    </div>
                    <div className={styles.collectionInfo}>
                      <h3>{name}</h3>
                      {lines.length > 0 && (
                        <p>
                          {lines.map((line, index) => (
                            <span key={index}>
                              {line}
                              {index < lines.length - 1 && <br />}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
