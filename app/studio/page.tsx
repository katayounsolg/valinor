import type { Metadata } from "next";
import Header from "@/app/components/Header";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Studio | Valinor",
  description: "The Valinor studio: purpose, honest materials and contact information.",
};

export default function StudioPage() {
  return (
    <main className={styles.page}>
      <Header />

      <div className={styles.content} dir="ltr">
        <header className={styles.heading}>
          <p className={styles.eyebrow}>VALINOR — A DESIGN-LED STUDIO</p>
          <h1 className={styles.title}>The Studio</h1>
          <p className={styles.tagline}>We don&apos;t design to impress. We design to endure.</p>
        </header>

        <section className={styles.story} aria-label="Our design philosophy">
          <div className={styles.storyRow}>
            {/* Empty image slot — add the real image later. */}
            <div className={styles.imagePlaceholder} aria-label="Reserved space for the first Studio image" />
            <div className={styles.storyText}>
              <span className={styles.storyNumber}>01 / OUR APPROACH</span>
              <h2>PURPOSE BEFORE DECORATION</h2>
              <p>Every detail exists for a reason.</p>
            </div>
          </div>

          <div className={`${styles.storyRow} ${styles.storyRowReverse}`}>
            <div className={styles.storyText}>
              <span className={styles.storyNumber}>02 / OUR MATERIALS</span>
              <h2>HONEST MATERIALS</h2>
              <p>We choose materials that age beautifully.</p>
            </div>
            {/* Empty image slot — add the real image later. */}
            <div className={styles.imagePlaceholder} aria-label="Reserved space for the second Studio image" />
          </div>
        </section>

        <section className={styles.contact} aria-labelledby="studio-contact-title">
          <p className={styles.eyebrow}>GET IN TOUCH</p>
          <h2 id="studio-contact-title" className={styles.contactTitle}>Contact</h2>
          <div className={styles.contactGrid}>
            <div className={styles.contactItem}>
              <span className={styles.contactLabel}>PHONE</span>
              <a className={styles.contactLink} href="tel:+989374909049" dir="ltr">09374909049</a>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactLabel}>INSTAGRAM</span>
              <a
                className={styles.contactLink}
                href="https://www.instagram.com/valinor.journals/"
                target="_blank"
                rel="noopener noreferrer"
              >
                @valinor.journals
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
