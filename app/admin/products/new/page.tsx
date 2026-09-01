import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import ProductCreateFormClient from "./ProductCreateFormClient";
import styles from "../[id]/page.module.css";

export default async function AdminNewProductPage() {
  const categories =
    await prisma.category.findMany({
      orderBy: {
        title: "asc",
      },

      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>
            NEW PRODUCT
          </p>

          <h1 className={styles.title}>
            افزودن محصول
          </h1>

          <p className={styles.description}>
            محصول جدید را با اطلاعات کامل،
            قیمت، موجودی و دسته‌بندی به فروشگاه
            اضافه کنید.
          </p>
        </div>

        <Link
          href="/admin/products"
          className={styles.backLink}
        >
          <ArrowRight
            size={14}
            strokeWidth={1.4}
          />

          بازگشت به محصولات
        </Link>
      </header>

      <ProductCreateFormClient
        categories={categories}
      />
    </div>
  );
}