import AddToCartButton from "@/app/components/AddToCartButton";
import Header from "@/app/components/Header";
import { productService } from "@/src/services/product.service";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

function getSeriesName(categoryTitle: string) {
  const titleMap: Record<string, string> = {
    "قفل ثابت": "PALETTE SERIES",
    "قفل متحرک": "MONO SERIES",
    "مینی": "JOURNAL & JUNIOR",
    "بافت": "MOSAIC SERIES",
    "برش": "REVEALED SERIES",
    "تکه": "ORIGIN SERIES",
  };

  return titleMap[categoryTitle] || "VALINOR OBJECT";
}

function getEnglishObjectName(slug: string, fallbackName: string) {
  const nameMap: Record<string, string> = {
    "sabet-gray": "Silver Ash",
    "sabet-blue": "Blue Veil",
    "sabet-lilac": "Lilac Haze",
    "sabet-pistachio": "Pistachio Mist",
    "sabet-cream": "Cream Linen",
    "sabet-rose": "Rose Bloom",
    "sabet-apricot": "Apricot Nude",
    "sabet-butter": "Butter Light",
    "sabet-taupe": "Taupe Ground",
    "sabet-plum": "Plum Dusk",
  };

  return nameMap[slug] || fallbackName;
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const product = await productService.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const seriesName = getSeriesName(product.category.title);
  const objectName = getEnglishObjectName(product.slug, product.name);

  return (
    <main className={styles.page}>
      <Header />

      <section className={styles.productShell} dir="ltr">
        <div className={styles.galleryColumn}>
          <div className={styles.mainImageBox}>
            <img
              src={product.mainImage}
              alt={objectName}
              className={styles.mainImage}
            />
          </div>

          <div className={styles.thumbnails}>
            <button type="button" className={styles.thumbnail}>
              <img src={product.mainImage} alt={objectName} />
            </button>

            <button type="button" className={styles.thumbnail}>
              <img src={product.mainImage} alt={objectName} />
            </button>

            <button type="button" className={styles.thumbnail}>
              <img src={product.mainImage} alt={objectName} />
            </button>

            <button type="button" className={styles.thumbnail}>
              <img src={product.mainImage} alt={objectName} />
            </button>
          </div>
        </div>

        <aside className={styles.infoColumn} dir="ltr">
          <p className={styles.series}>{seriesName}</p>

          <p className={styles.objectNumber}>Object No. 01</p>

          <h1>{objectName}</h1>

          <p className={styles.shortLine}>
            Built for quiet daily rituals.
          </p>

          <p className={styles.description}>
            {product.shortDescription ||
              "A handmade leather object shaped through material, proportion, and deliberate construction."}
          </p>

          <div className={styles.divider}></div>

          <strong className={styles.price}>
            {product.price.toLocaleString("fa-IR")} تومان
          </strong>

          <div className={styles.optionBlock}>
            <p className={styles.optionLabel}>SELECT SIZE</p>

            <div className={styles.sizeGrid}>
              <button type="button">A5</button>
              <button type="button">B6</button>
            </div>
          </div>

          <div className={styles.stockRow}>
            <span>LIMITED EDITION</span>

            <span className={product.stock > 0 ? styles.inStock : styles.outStock}>
              {product.stock > 0 ? `${product.stock} AVAILABLE` : "SOLD OUT"}
            </span>
          </div>

          {product.stock > 0 ? (
            <div className={styles.addToCartWrapper}>
              <AddToCartButton
                slug={product.slug}
                name={product.name}
                image={product.mainImage}
                price={product.price}
              />
            </div>
          ) : (
            <button type="button" disabled className={styles.disabledButton}>
              ناموجود
            </button>
          )}

          <button type="button" className={styles.saveButton}>
            Save
          </button>

          <div className={styles.notes}>
            <p>Free shipping will be calculated at checkout.</p>
            <p>Crafted to order. Ships in 5–7 business days.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}