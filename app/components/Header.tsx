"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/src/context/CartContext";
import styles from "./Header.module.css";

export default function Header() {
  const [user, setUser] = useState<{ name: string | null } | null>(null);

  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    async function getUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        setUser(data.user);
      } catch {
        setUser(null);
      }
    }

    getUser();
  }, []);

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
        <Link href="/" className={styles.logo} onClick={closeMobileMenu}>
          <span className={styles.logoMain}>VALINOR</span>

          <span className={styles.logoSub} dir="ltr">
            A DESIGN-LED STUDIO
          </span>
        </Link>

        <nav className={styles.desktopNav}>
          <div className={styles.navItemWrapper}>
            <Link href="/products" className={styles.navItem}>
              محصولات
            </Link>

            <div className={styles.dropdown}>
              <Link href="/products" className={styles.dropdownItem}>
                کلاسور
              </Link>

              <Link href="/products" className={styles.dropdownItem}>
                بوک مارک
              </Link>

              <Link href="/products" className={styles.dropdownItem}>
                چارم بگ
              </Link>

              <Link href="/products" className={styles.dropdownItem}>
                تو دو لیست
              </Link>

              <Link href="/products" className={styles.dropdownItem}>
                پلنر
              </Link>
            </div>
          </div>

          <Link href="#" className={styles.navItem}>
            درباره ما
          </Link>

          {user ? (
            <Link href="/profile" className={styles.navItem}>
              حساب کاربری
            </Link>
          ) : (
            <Link href="/login" className={styles.navItem}>
              ورود
            </Link>
          )}
        </nav>

        <Link href="/cart" className={styles.cart} aria-label="سبد خرید">
          <img
            src="/icons/handbag.svg"
            alt="سبد خرید"
            className={styles.cartIcon}
          />

          <span className={styles.cartCount}>{cartCount}</span>
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
            محصولات
          </Link>

          <div className={styles.mobileSubNav}>
            <Link
              href="/products"
              className={styles.mobileSubItem}
              onClick={closeMobileMenu}
            >
              کلاسور
            </Link>

            <Link
              href="/products"
              className={styles.mobileSubItem}
              onClick={closeMobileMenu}
            >
              بوک مارک
            </Link>

            <Link
              href="/products"
              className={styles.mobileSubItem}
              onClick={closeMobileMenu}
            >
              چارم بگ
            </Link>

            <Link
              href="/products"
              className={styles.mobileSubItem}
              onClick={closeMobileMenu}
            >
              تو دو لیست
            </Link>

            <Link
              href="/products"
              className={styles.mobileSubItem}
              onClick={closeMobileMenu}
            >
              پلنر
            </Link>
          </div>

          <Link
            href="#"
            className={styles.mobileNavItem}
            onClick={closeMobileMenu}
          >
            درباره ما
          </Link>

          {user ? (
            <Link
              href="/profile"
              className={styles.mobileNavItem}
              onClick={closeMobileMenu}
            >
              حساب کاربری
            </Link>
          ) : (
            <Link
              href="/login"
              className={styles.mobileNavItem}
              onClick={closeMobileMenu}
            >
              ورود
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}