import Link from "next/link";
import {
  PencilLine,
  Plus,
} from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import styles from "./page.module.css";

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(
    value
  );
}

export default async function AdminCategoriesPage() {
  const categories =
    await prisma.category.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

  const totalProducts =
    categories.reduce(
      (sum, category) =>
        sum + category._count.products,
      0
    );

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>
            CATEGORY MANAGEMENT
          </p>

          <h1 className={styles.title}>
            دسته‌بندی‌ها
          </h1>

          <p className={styles.description}>
            مدیریت دسته‌بندی‌های فروشگاه،
            تصویر و محصولات متصل به هر دسته.
          </p>
        </div>

        <Link
          href="/admin/categories/new"
          className={styles.addButton}
        >
          <Plus
            size={15}
            strokeWidth={1.5}
          />

          افزودن دسته‌بندی
        </Link>
      </header>

      {/* SUMMARY */}
      <section className={styles.summary}>
        <article className={styles.summaryItem}>
          <p className={styles.summaryLabel}>
            کل دسته‌بندی‌ها
          </p>

          <p className={styles.summaryValue}>
            {formatNumber(
              categories.length
            )}
          </p>
        </article>

        <article className={styles.summaryItem}>
          <p className={styles.summaryLabel}>
            محصولات متصل
          </p>

          <p className={styles.summaryValue}>
            {formatNumber(totalProducts)}
          </p>
        </article>
      </section>

      {/* LIST */}
      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>
              فهرست دسته‌بندی‌ها
            </h2>

            <p className={styles.panelSub}>
              اطلاعات فعلی ثبت‌شده در دیتابیس
            </p>
          </div>
        </header>

        {categories.length === 0 ? (
          <div className={styles.empty}>
            هنوز دسته‌بندی‌ای ثبت نشده است.
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>دسته‌بندی</th>
                    <th>تعداد محصولات</th>
                    <th>مدیریت</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map(
                    (category) => (
                      <tr key={category.id}>
                        <td>
                          <div
                            className={
                              styles.category
                            }
                          >
                            <div
                              className={
                                styles.imageBox
                              }
                            >
                              {category.image ? (
                                <img
                                  src={
                                    category.image
                                  }
                                  alt={
                                    category.title
                                  }
                                />
                              ) : (
                                <div
                                  className={
                                    styles.imageFallback
                                  }
                                >
                                  V
                                </div>
                              )}
                            </div>

                            <div
                              className={
                                styles.categoryInfo
                              }
                            >
                              <p
                                className={
                                  styles.categoryTitle
                                }
                              >
                                {
                                  category.title
                                }
                              </p>

                              <p
                                className={
                                  styles.slug
                                }
                                title={
                                  category.slug
                                }
                              >
                                {
                                  category.slug
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              styles.count
                            }
                          >
                            {formatNumber(
                              category._count
                                .products
                            )}
                          </span>
                        </td>

                        <td>
                          <Link
                            href={`/admin/categories/${category.id}`}
                            className={
                              styles.actionLink
                            }
                          >
                            <PencilLine
                              size={13}
                              strokeWidth={1.4}
                            />

                            ویرایش
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <footer className={styles.footer}>
              {formatNumber(
                categories.length
              )}{" "}
              دسته‌بندی نمایش داده شده است.
            </footer>
          </>
        )}
      </section>
    </div>
  );
}