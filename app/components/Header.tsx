
"use client";

import Link from "next/link";
import { useCart } from "@/src/context/CartContext";
import styles from "./Header.module.css";

export default function Header() {
  const { items } = useCart();

  const cartCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  function closeMobileMenu() {
    const toggle = document.getElementById(
      "mobile-menu-toggle"
    ) as HTMLInputElement | null;

    if (toggle) {
      toggle.checked = false;
    }
  }

  return (
    <header className={styles.header} dir="rtl">
      <div className={styles.inner}>
        <Link
          href="/"
          className={styles.logo}
          onClick={closeMobileMenu}
        >
          <span className={styles.logoMain}>VALINOR</span>

          <span className={styles.logoSub} dir="ltr">
            A DESIGN-LED STUDIO
          </span>
        </Link>

        <nav className={styles.desktopNav}>
          <Link
            href="/products"
            className={styles.navItem}
          >
            Objects
          </Link>

          <Link
            href="/studio"
            className={styles.navItem}
          >
            Studio
          </Link>
        </nav>

        <Link
          href="/cart"
          className={styles.cart}
          aria-label="سبد خرید"
        >
          <img
            src="/icons/handbag.svg"
            alt="سبد خرید"
            className={styles.cartIcon}
          />

          <span className={styles.cartCount}>
            {cartCount}
          </span>
        </Link>

        <input
          id="mobile-menu-toggle"
          type="checkbox"
          className={styles.mobileToggle}
        />

        <label
          htmlFor="mobile-menu-toggle"
          className={styles.mobileMenuButton}
          aria-label="باز کردن منو"
        >
          <span></span>
          <span></span>
        </label>

        <nav className={styles.mobilePanel}>
          <Link
            href="/products"
            className={styles.mobileNavItem}
            onClick={closeMobileMenu}
          >
            Objects
          </Link>

          <Link
            href="/studio"
            className={styles.mobileNavItem}
            onClick={closeMobileMenu}
          >
            Studio
          </Link>
        </nav>
      </div>
    </header>
  );
}
