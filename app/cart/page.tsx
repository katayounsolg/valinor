"use client";

import Link from "next/link";
import Header from "@/app/components/Header";
import { useCart } from "@/src/context/CartContext";
import styles from "./page.module.css";

export default function CartPage() {
  const {
    items,
    loaded,
    increase,
    decrease,
    remove,
    total,
  } = useCart();

  return (
    <>
      <Header />

      <main className={styles.page} dir="rtl">
        <div className={styles.inner}>
          <section className={styles.cartHeader}>
            <p className={styles.eyebrow}>BAG</p>

            <h1>سبد خرید</h1>

            <p>محصولات انتخاب شده برای سفارش</p>
          </section>

          {!loaded ? (
            <section className={styles.emptyCart}>
              <p>در حال بارگذاری سبد خرید...</p>
            </section>
          ) : items.length === 0 ? (
            <section className={styles.emptyCart}>
              <p>سبد خرید شما خالی است.</p>

              <Link href="/products">
                مشاهده محصولات
              </Link>
            </section>
          ) : (
            <section className={styles.cartLayout}>
              <div className={styles.productsColumn}>
                {items.map((item) => (
                  <article
                    key={item.slug}
                    className={styles.cartItem}
                  >
                    <div className={styles.imageBox}>
                      <img
                        src={item.image}
                        alt={item.name}
                      />
                    </div>

                    <div className={styles.itemInfo}>
                      <h3>{item.name}</h3>

                      <div className={styles.quantityRow}>
                        <button
                          type="button"
                          onClick={() =>
                            decrease(item.slug)
                          }
                          aria-label="کم کردن تعداد"
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          type="button"
                          onClick={() =>
                            increase(item.slug)
                          }
                          aria-label="زیاد کردن تعداد"
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            remove(item.slug)
                          }
                          className={
                            styles.removeButton
                          }
                        >
                          حذف
                        </button>
                      </div>
                    </div>

                    <strong
                      className={styles.itemPrice}
                    >
                      {(
                        item.price * item.quantity
                      ).toLocaleString("fa-IR")}{" "}
                      تومان
                    </strong>
                  </article>
                ))}
              </div>

              <aside className={styles.summary}>
                <p
                  className={
                    styles.summaryEyebrow
                  }
                >
                  SUMMARY
                </p>

                <h2>خلاصه سفارش</h2>

                <div
                  className={styles.summaryRow}
                >
                  <span>جمع محصولات</span>

                  <span>
                    {total.toLocaleString("fa-IR")}{" "}
                    تومان
                  </span>
                </div>

                <div
                  className={styles.summaryRow}
                >
                  <span>ارسال</span>

                  <span>
                    ۱۵۰٬۰۰۰ تومان
                  </span>
                </div>

                <div
                  className={styles.totalRow}
                >
                  <strong>
                    مبلغ قابل پرداخت
                  </strong>

                  <strong>
                    {(total + 150_000).toLocaleString(
                      "fa-IR"
                    )}{" "}
                    تومان
                  </strong>
                </div>

                <Link
                  href="/checkout"
                  className={styles.checkoutButton}
                >
                  ادامه فرایند خرید
                </Link>

                <Link
                  href="/products"
                  className={styles.continueLink}
                >
                  ادامه خرید
                </Link>
              </aside>
            </section>
          )}
        </div>
      </main>
    </>
  );
}