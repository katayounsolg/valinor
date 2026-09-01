import Link from "next/link";
import {
  Plus,
} from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import ProductRowActionsClient from "./ProductRowActionsClient";
import styles from "./page.module.css";

function formatPrice(value: number) {
  return new Intl.NumberFormat("fa-IR").format(
    value
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(
    value
  );
}

export default async function AdminProductsPage() {
  const products =
    await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        isAvailable: true,
        mainImage: true,
      },
    });

  const availableCount = products.filter(
    (product) => product.isAvailable
  ).length;

  const lowStockCount = products.filter(
    (product) =>
      product.isAvailable &&
      product.stock <= 3
  ).length;

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>
            PRODUCT MANAGEMENT
          </p>

          <h1 className={styles.title}>
            محصولات
          </h1>

          <p className={styles.description}>
            مدیریت محصولات، قیمت، موجودی و وضعیت
            نمایش آن‌ها در فروشگاه.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className={styles.addButton}
        >
          <Plus
            size={15}
            strokeWidth={1.5}
          />

          افزودن محصول
        </Link>
      </header>

      {/* SUMMARY */}
      <section className={styles.summary}>
        <article className={styles.summaryItem}>
          <p className={styles.summaryLabel}>
            کل محصولات
          </p>

          <p className={styles.summaryValue}>
            {formatNumber(products.length)}
          </p>
        </article>

        <article className={styles.summaryItem}>
          <p className={styles.summaryLabel}>
            فعال در فروشگاه
          </p>

          <p className={styles.summaryValue}>
            {formatNumber(availableCount)}
          </p>
        </article>

        <article className={styles.summaryItem}>
          <p className={styles.summaryLabel}>
            کم‌موجود
          </p>

          <p className={styles.summaryValue}>
            {formatNumber(lowStockCount)}
          </p>
        </article>
      </section>

      {/* PRODUCTS */}
      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>
              فهرست محصولات
            </h2>

            <p className={styles.panelSub}>
              اطلاعات فعلی ثبت‌شده در دیتابیس
            </p>
          </div>
        </header>

        {products.length === 0 ? (
          <div className={styles.empty}>
            هنوز محصولی ثبت نشده است.
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>محصول</th>
                    <th>قیمت</th>
                    <th>موجودی</th>
                    <th>وضعیت</th>
                    <th>مدیریت</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => {
                    const isOutOfStock =
                      product.stock <= 0;

                    const isLowStock =
                      product.stock > 0 &&
                      product.stock <= 3;

                    return (
                      <tr key={product.id}>
                        {/* PRODUCT */}
                        <td
                          className={
                            styles.productCell
                          }
                        >
                          <div
                            className={
                              styles.product
                            }
                          >
                            <div
                              className={
                                styles.imageBox
                              }
                            >
                              {product.mainImage ? (
                                <img
                                  src={
                                    product.mainImage
                                  }
                                  alt={
                                    product.name
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
                                styles.productInfo
                              }
                            >
                              <p
                                className={
                                  styles.productName
                                }
                              >
                                {product.name}
                              </p>

                              <p
                                className={
                                  styles.slug
                                }
                                title={
                                  product.slug
                                }
                              >
                                {product.slug}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* PRICE */}
                        <td>
                          <span
                            className={
                              styles.price
                            }
                          >
                            {formatPrice(
                              product.price
                            )}{" "}
                            تومان
                          </span>
                        </td>

                        {/* STOCK */}
                        <td>
                          <span
                            className={[
                              styles.stock,

                              isOutOfStock
                                ? styles.stockOut
                                : "",

                              isLowStock
                                ? styles.stockLow
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {formatNumber(
                              product.stock
                            )}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td>
                          {product.isAvailable ? (
                            <span
                              className={`${styles.badge} ${styles.available}`}
                            >
                              فعال
                            </span>
                          ) : (
                            <span
                              className={`${styles.badge} ${styles.unavailable}`}
                            >
                              غیرفعال
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <ProductRowActionsClient
                            productId={product.id}
                            productName={product.name}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className={styles.footer}>
              {formatNumber(products.length)}{" "}
              محصول نمایش داده شده است.
            </footer>
          </>
        )}
      </section>
    </div>
  );
}