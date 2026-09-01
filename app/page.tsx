import Header from "@/app/components/Header";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <Header />

      <section className={styles.hero}>
        <img
          src="/images/hero/hero-banner.png"
          alt="VALINOR hero banner"
          className={styles.heroImage}
        />

        <div className={styles.heroOverlay} dir="ltr">
          <p className={styles.eyebrow}>CRAFT  FOLLOWS  THOUGHT.</p>

          <h1>
  We dont design
  <br />
  to impress,
  <br />
  We design to endure.
</h1>

          <p className={styles.description}>
  OBJECTS with intentional design
  <br />
  can maintain their identity for years.
  <br />
  We create leather objects where
  <br />
  every detail is deliberate, and form,
  <br />
  material, and craftsmanship come
  <br />
  together in balance.
</p>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.feature}>
          <img src="/icons/purpose.svg" alt="Purpose" className={styles.featureIcon} />
          <h3>PURPOSE BEFORE DECORATION</h3>
          <p>
            Every detail exists
            <br />
            for a reason.
          </p>
        </div>

        <div className={styles.feature}>
          <img src="/icons/leaf.svg" alt="Materials" className={styles.featureIcon} />
          <h3>HONEST MATERIALS</h3>
          <p>
            We choose materials
            <br />
            that age beautifully.
          </p>
        </div>

        <div className={styles.feature}>
          <img src="/icons/craftsmanship.svg" alt="Craftsmanship" className={styles.featureIcon} />
          <h3>CRAFTSMANSHIP</h3>
          <p>
            Made with care,
            <br />
            meant to last.
          </p>
        </div>

        <div className={styles.feature}>
          <img src="/icons/timeless.svg" alt="Timeless" className={styles.featureIcon} />
          <h3>TIMELESS SIMPLICITY</h3>
          <p>
            Designs that stay
            <br />
            relevant over time.
          </p>
        </div>
      </section>

      <section className={styles.brandQuote}>
  <div className={styles.quoteLine}></div>

  <p>
    VALINOR — A DESIGN STUDIO CREATING
    <br />
    LEATHER OBJECTS
  </p>
</section>

      <footer className={styles.footer}>
  <div>
    <h3>VALINOR</h3>
    <p>A DESIGN-LED LEATHER GOODS STUDIO</p>
  </div>

  <div>
    <p>SHOP</p>
    <p>ABOUT</p>
    <p>CONTACT</p>
  </div>

  <div>
    <p>INSTAGRAM</p>
    <p>SUPPORT</p>
    <p>SHIPPING</p>
  </div>

  <div className={styles.copyright}>
    © 2026 VALINOR. ALL RIGHTS RESERVED.
  </div>
</footer>
    </main>
  );
}