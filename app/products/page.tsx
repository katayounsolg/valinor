import Header from "@/app/components/Header";
import ProductsCollections from "./ProductsCollections";
import styles from "./page.module.css";

export default function ProductsPage() {
  return (
    <main className={styles.page}>
      <Header />

      <section className={styles.objectsHero}>
        <div className={styles.objectsImageBox}>
          <img
            src="/images/hero/hero-banner.png"
            alt="Valinor leather objects"
            className={styles.objectsImage}
          />
        </div>

        <div className={styles.objectsText}>
          <h1>The Objects</h1>

          <p>
            Each collection embodies a distinct idea, expressed through
            <br />
            leather objects. These ideas emerge from deliberate references
            <br />
            -to history, architecture, philosophy, geometry, nature, art,
            <br />
            and culture- and are transformed through the design process
            <br />
            into a new visual language.
          </p>
        </div>
      </section>

      <ProductsCollections />

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