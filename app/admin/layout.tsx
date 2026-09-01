import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Users,
  Settings,
  Store,
  ExternalLink,
} from "lucide-react";

import { requireAdmin } from "@/app/lib/auth";
import styles from "./layout.module.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className={styles.shell}>
      {/* Mobile menu controller */}
      <input
        id="admin-mobile-menu-toggle"
        type="checkbox"
        className={styles.mobileToggle}
      />

      {/* Mobile header */}
      <header className={styles.mobileHeader}>
        <span className={styles.mobileBrand}>
          VALINOR
        </span>

        <label
          htmlFor="admin-mobile-menu-toggle"
          className={styles.mobileMenuButton}
          aria-label="باز کردن منوی مدیریت"
        >
          <span />
          <span />
        </label>
      </header>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <Link
          href="/admin"
          className={styles.brand}
        >
          <span className={styles.brandName}>
            VALINOR
          </span>

          <span className={styles.brandSub}>
            A DESIGN-LED STUDIO
          </span>
        </Link>

        <p className={styles.panelLabel}>
          ADMINISTRATION
        </p>

        <nav className={styles.nav}>
          <Link
            href="/admin"
            className={styles.navLink}
          >
            <span className={styles.navIcon}>
              <LayoutDashboard
                size={19}
                strokeWidth={1.35}
              />
            </span>

            <span>داشبورد</span>
          </Link>

          <Link
            href="/admin/orders"
            className={styles.navLink}
          >
            <span className={styles.navIcon}>
              <ShoppingBag
                size={19}
                strokeWidth={1.35}
              />
            </span>

            <span>سفارش‌ها</span>
          </Link>

          <Link
            href="/admin/products"
            className={styles.navLink}
          >
            <span className={styles.navIcon}>
              <Package
                size={19}
                strokeWidth={1.35}
              />
            </span>

            <span>محصولات</span>
          </Link>

          <Link
            href="/admin/categories"
            className={styles.navLink}
          >
            <span className={styles.navIcon}>
              <FolderTree
                size={19}
                strokeWidth={1.35}
              />
            </span>

            <span>دسته‌بندی‌ها</span>
          </Link>

          <Link
            href="/admin/customers"
            className={styles.navLink}
          >
            <span className={styles.navIcon}>
              <Users
                size={19}
                strokeWidth={1.35}
              />
            </span>

            <span>مشتری‌ها</span>
          </Link>

          <div className={styles.navDivider} />

          <Link
            href="/admin/settings"
            className={styles.navLink}
          >
            <span className={styles.navIcon}>
              <Settings
                size={19}
                strokeWidth={1.35}
              />
            </span>

            <span>تنظیمات</span>
          </Link>

          <Link
            href="/"
            className={styles.navLink}
          >
            <span className={styles.navIcon}>
              <Store
                size={19}
                strokeWidth={1.35}
              />
            </span>

            <span>مشاهده فروشگاه</span>
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminCard}>
            <div
              className={styles.adminAvatar}
            />

            <div className={styles.adminInfo}>
              <span
                className={styles.adminName}
              >
                {user.name || "مدیر والینور"}
              </span>

              <span
                className={styles.adminRole}
              >
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Clicking overlay closes mobile menu */}
      <label
        htmlFor="admin-mobile-menu-toggle"
        className={styles.mobileOverlay}
        aria-label="بستن منو"
      />

      {/* Main area */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div
            className={styles.topbarTitle}
          >
            <p
              className={
                styles.topbarEyebrow
              }
            >
              VALINOR / ADMIN
            </p>

            <h2
              className={
                styles.topbarHeading
              }
            >
              پنل مدیریت
            </h2>
          </div>

          <div
            className={styles.topbarActions}
          >
            <Link
              href="/"
              className={
                styles.topbarButton
              }
              aria-label="مشاهده فروشگاه"
              title="مشاهده فروشگاه"
            >
              <ExternalLink
                size={17}
                strokeWidth={1.35}
              />
            </Link>
          </div>
        </header>

        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}