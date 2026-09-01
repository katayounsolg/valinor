import Header from "@/app/components/Header";
import ProductCard from "@/app/components/ProductCard";
import { productService } from "@/src/services/product.service";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

type Props = {
  params: Promise<{
    category: string;
  }>;
};

type CollectionInfo = {
  title: string;
  description: string;
};

function getCollectionInfo(slug: string): CollectionInfo {
  const collections: Record<string, CollectionInfo> = {
    sabet: {
      title: "Palette",
      description:
        "A study of soft color, quiet tones, and everyday visual calm.",
    },
    moteharek: {
      title: "Mono",
      description:
        "One form, one material presence, reduced to its clearest expression.",
    },
    mini: {
      title: "Journal and Junior",
      description:
        "Small leather objects designed to carry daily thoughts, notes, and quiet routines.",
    },
    baft: {
      title: "Mosaic",
      description:
        "Fragments, surfaces, and references gathered into a balanced object language.",
    },
    boresh: {
      title: "Revealed",
      description:
        "A collection focused on cut, edge, construction, and visible precision.",
    },
    tikeh: {
      title: "Origin",
      description:
        "Timeless leather objects shaped around material presence and enduring character.",
    },
  };

  return (
    collections[slug] || {
      title: slug,
      description:
        "A Valinor collection shaped through material, form, and deliberate construction.",
    }
  );
}

const collectionProductNames: Record<string, string[]> = {
  sabet: [
    "Blue Veil",
    "Plum Dusk",
    "Lilac Haze",
    "Pistachio Mist",
    "Silver Ash",
    "Taupe Ground",
    "Rose Bloom",
    "Apricot Nude",
    "Cream Linen",
    "Butter Light",
  ],

  mini: [
    "Sky Token",
    "Violet Charm",
    "Pebble Note",
    "Mint Keepsake",
    "Ivory Pocket",
    "Wisteria Loop",
    "Blush Key",
    "Lemon Drop",
    "Drift Tag",
  ],

  moteharek: [
    "Azure Spine",
    "Linen Fold",
    "Midnight Plane",
    "Mauve Edge",
    "Vermilion Strip",
    "Silver Quiet",
    "Sage Panel",
    "Roseate Side",
    "Ochre Line",
  ],

  baft: [
    "Cacao Tessera",
    "Teal Ladder",
    "Forest Braid",
    "Flint Grid",
    "Umber Lattice",
    "Ember Matrix",
    "Navy Shard",
    "Onyx Stitch",
  ],

  boresh: [
    "Ancient Marks",
    "Crimson Mask",
    "Night Wing",
    "Ink Trace",
    "Lotus Script",
  ],

  tikeh: [
    "Tide",
    "Twin",
    "Morning",
    "Balloon",
    "Profile",
  ],
};

function getDisplayName(categorySlug: string, index: number) {
  return collectionProductNames[categorySlug]?.[index] || `Object ${index + 1}`;
}

export default async function CategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;

  const category = await productService.getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const categoryProducts = await productService.getProductsByCategory(
    categorySlug
  );

  const collectionInfo = getCollectionInfo(categorySlug);

  const isEditorialCollection = [
    "sabet",
    "moteharek",
    "mini",
    "baft",
    "boresh",
    "tikeh",
  ].includes(categorySlug);

  return (
    <main className={styles.page}>
      <Header />

      <section className={styles.collectionHeader}>
        <div className={styles.collectionHeaderInner}>
          <div className={styles.collectionHeaderText}>
            <p className={styles.collectionEyebrow}>VALINOR COLLECTION</p>

            <h1>{collectionInfo.title}</h1>

            <p className={styles.collectionDescription}>
              {collectionInfo.description}
            </p>
          </div>

          <div className={styles.collectionMetaPanel}>
            <span>COLLECTION</span>
            <span>{categoryProducts.length} VARIATIONS</span>
          </div>
        </div>
      </section>

      <section className={styles.products} dir="rtl">
        <div className={styles.grid}>
          {categoryProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              name={product.name}
              displayName={
                isEditorialCollection
                  ? getDisplayName(categorySlug, index)
                  : undefined
              }
              image={product.mainImage}
              price={product.price}
              hidePrice={isEditorialCollection}
              hideAddToCart={isEditorialCollection}
              hideFavorite={isEditorialCollection}
              serifName={isEditorialCollection}
              editorialCard={isEditorialCollection}
            />
          ))}
        </div>
      </section>

      <section className={styles.principlesSection}>
        <div className={styles.principlesBox}>
          <div className={styles.principlesIntro}>
            <p>
              We don&apos;t follow
              <br />
              trends.
              <br />
              We follow
              <br />
              principles.
            </p>
          </div>

          <div className={styles.principlesGrid}>
            <div className={styles.principleItem}>
              <img
                src="/icons/principles/P.png"
                alt="Purpose"
                className={styles.principleIcon}
              />

              <h3>Purpose</h3>

              <p>
                No decoration, word, photo,
                <br />
                stitch, color, or layout exists
                <br />
                just to fill space
              </p>
            </div>

            <div className={styles.principleItem}>
              <img
                src="/icons/principles/R.jpg"
                alt="Reference"
                className={styles.principleIcon}
              />

              <h3>Reference</h3>

              <p>
                The reference can come from architecture, history,
                <br />
                geometry, culture, nature, philosophy,
                <br />
                or material behavior.
              </p>
            </div>

            <div className={styles.principleItem}>
              <img
                src="/icons/principles/S.png"
                alt="Structure"
                className={styles.principleIcon}
              />

              <h3>Structure</h3>

              <p>
                Valinor does not add meaning on top of a product.
                <br />
                The meaning must be built into the form,
                <br />
                structure, material, and construction.
              </p>
            </div>

            <div className={styles.principleItem}>
              <img
                src="/icons/principles/O.png"
                alt="Object"
                className={styles.principleIcon}
              />

              <h3>Object</h3>

              <p>
                It creates designed objects meant to be kept,
                <br />
                used, aged,
                <br />
                and lived with.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.principlesBottom}>
          <div className={styles.principlesMarkBox}>
            <img
              src="/icons/brand/valinor-mark.png"
              alt="Valinor mark"
              className={styles.principlesMark}
            />
          </div>

          <div className={styles.principlesFooterText}>
            <span>A DESIGN-LED STUDIO CREATING LEATHER OBJECTS</span>
          </div>
        </div>
      </section>
    </main>
  );
}