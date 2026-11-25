
import AddToCartButton from "@/app/components/AddToCartButton";
import Header from "@/app/components/Header";
import ProductGallery from "./ProductGallery";
import { productService } from "@/src/services/product.service";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ slug: string }>;
};

type SeriesInfo = {
  name: string;
  tagline: string;
};

function getSeriesInfo(categoryTitle: string): SeriesInfo {
  const seriesMap: Record<string, SeriesInfo> = {
    "قفل ثابت": { name: "Palette", tagline: "Soft tones." },
    "قفل متحرک": { name: "Mono", tagline: "One piece." },
    "مینی": { name: "Journal & Junior", tagline: "Hand binding." },
    "بافت": { name: "Mosaic", tagline: "Pieces become something new." },
    "برش": {
      name: "Revealed",
      tagline: "Precision in every cut and edge.",
    },
    "تکه": { name: "Origin", tagline: "Timeless leather." },
  };

  return (
    seriesMap[categoryTitle] || {
      name: categoryTitle || "Valinor",
      tagline: "Designed to be kept.",
    }
  );
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

/**
 * تبدیل تصاویر ذخیره‌شده در دیتابیس به آرایه
 */
function parseProductImages(images: unknown): string[] {
  if (Array.isArray(images)) {
    return images.filter(
      (image): image is string =>
        typeof image === "string" && image.trim().length > 0
    );
  }

  if (typeof images !== "string" || !images.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(images);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (image): image is string =>
        typeof image === "string" && image.trim().length > 0
    );
  } catch {
    return [];
  }
}

/**
 * نمایش متن چندخطی واردشده در داشبورد
 */
function ContentText({
  content,
}: {
  content: string;
}) {
  return (
    <div style={{ whiteSpace: "pre-line" }}>
      {content}
    </div>
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const product = await productService.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // اطلاعات مجموعه
  const defaultSeries = getSeriesInfo(product.category.title);

  const seriesName =
    product.seriesTitle?.trim() || defaultSeries.name;

  const seriesTagline =
    product.seriesTagline?.trim() || defaultSeries.tagline;

  // نام انگلیسی محصول
  const objectName =
    product.englishName?.trim() ||
    getEnglishObjectName(product.slug, product.name);

  // تصاویر محصول با حفظ ترتیب
  const additionalImages = parseProductImages(product.images);

  const images = [
    product.mainImage,
    ...additionalImages.filter(
      (image) => image !== product.mainImage
    ),
  ].slice(0, 6);

  // متن‌های اختصاصی داشبورد
  const leftDescription =
    product.leftDescription?.trim() ||
    "An object designed to bring calm to everyday routines. Carefully crafted in leather, it balances purposeful details, lasting materials, and a quiet, timeless character.";

  const detailsContent =
    product.detailsContent?.trim() || "";

  const shippingContent =
    product.shippingContent?.trim() || "";

  const rightDescription =
    product.shortDescription?.trim() ||
    "A thoughtfully made leather object, created for everyday use and designed to age beautifully.";

  return (
    <main className={styles.page}>
      <Header />

      <section className={styles.productShell} dir="ltr">

        {/* ستون سمت چپ */}
        <aside className={styles.editorialColumn}>

          <div className={styles.editorialDescription}>
            <ContentText content={leftDescription} />
          </div>

          <div className={styles.accordionGroup}>

            {/* DETAILS */}
            <details className={styles.accordionItem}>
              <summary className={styles.accordionTrigger}>
                <span>DETAILS</span>
                <span
                  className={styles.accordionChevron}
                  aria-hidden="true"
                />
              </summary>

              <div className={styles.accordionContent}>
                {detailsContent ? (
                  <ContentText content={detailsContent} />
                ) : (
                  <ul className={styles.detailsList}>
                    {product.material && (
                      <li>Material: {product.material}</li>
                    )}

                    {product.dimensions && (
                      <li>Dimensions: {product.dimensions}</li>
                    )}

                    {product.weight && (
                      <li>Weight: {product.weight}</li>
                    )}
                  </ul>
                )}
              </div>
            </details>

            {/* PREPARATION & SHIPPING */}
            <details className={styles.accordionItem}>
              <summary className={styles.accordionTrigger}>
                <span>PREPARATION &amp; SHIPPING</span>
                <span
                  className={styles.accordionChevron}
                  aria-hidden="true"
                />
              </summary>

              <div className={styles.accordionContent}>
                {shippingContent ? (
                  <ContentText content={shippingContent} />
                ) : (
                  <>
                    <p>
                      Orders are prepared within a maximum of 7 working days.
                    </p>
                    <p>
                      We ship to all locations across Iran.
                    </p>
                  </>
                )}
              </div>
            </details>

          </div>
        </aside>

        {/* گالری تصاویر */}
        <ProductGallery
          images={images}
          alt={objectName}
        />

        {/* ستون سمت راست */}
        <aside className={styles.infoColumn} dir="ltr">

          <p className={styles.objectNumber}>
            {objectName}
          </p>

          <h1 className={styles.seriesTitle}>
            {seriesName}
          </h1>

          <p className={styles.shortLine}>
            {seriesTagline}
          </p>

          <p className={styles.description}>
            {rightDescription}
          </p>

          {/* قیمت و خرید */}
          <div className={styles.purchaseArea}>

            <p className={styles.price}>
              {product.price.toLocaleString("fa-IR")} تومان
            </p>

            {product.stock > 0 && product.isAvailable ? (
              <div className={styles.addToCartWrapper}>
                <AddToCartButton
                  slug={product.slug}
                  name={product.name}
                  image={product.mainImage}
                  price={product.price}
                />
              </div>
            ) : (
              <button
                type="button"
                disabled
                className={styles.disabledButton}
              >
                SOLD OUT
              </button>
            )}

          </div>
        </aside>

      </section>
    </main>
  );
}
