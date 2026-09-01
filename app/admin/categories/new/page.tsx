import Link from "next/link";
import { ArrowRight } from "lucide-react";

import CategoryCreateFormClient from "./CategoryCreateFormClient";
import styles from "../page.module.css";

export default function AdminNewCategoryPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>
            NEW CATEGORY
          </p>

          <h1 className={styles.title}>
            افزودن دسته‌بندی
          </h1>

          <p className={styles.description}>
            یک دسته‌بندی جدید برای محصولات
            فروشگاه ایجاد کنید.
          </p>
        </div>

        <Link
          href="/admin/categories"
          className={styles.addButton}
        >
          <ArrowRight
            size={14}
            strokeWidth={1.4}
          />

          بازگشت به دسته‌بندی‌ها
        </Link>
      </header>

      <CategoryCreateFormClient />
    </div>
  );
}