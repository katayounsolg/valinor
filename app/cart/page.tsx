
"use client";

import Link from "next/link";
import Header from "@/app/components/Header";
import { useCart } from "@/src/context/CartContext";
import styles from "./page.module.css";

const SHIPPING_PRICE = 150_000;

function formatPrice(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

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

            <p>محصولات انتخاب‌شده برای سفارش</p>
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
                          aria-label={`کم کردن تعداد ${item.name}`}
                        >
                          −
                        </button>

                        <span>
                          {formatPrice(item.quantity)}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increase(item.slug)
                          }
                          aria-label={`افزایش تعداد ${item.name}`}
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            remove(item.slug)
                          }
                          className={styles.removeButton}
                        >
                          حذف
                        </button>
                      </div>
                    </div>

                    <strong className={styles.itemPrice}>
                      {formatPrice(
                        item.price * item.quantity
                      )}{" "}
                      تومان
                    </strong>
                  </article>
                ))}
              </div>

              <aside className={styles.summary}>
                <p className={styles.summaryEyebrow}>
                  ORDER SUMMARY
                </p>

                <h2>خلاصه سفارش</h2>

                <div className={styles.summaryRow}>
                  <span>جمع محصولات</span>

                  <span>
                    {formatPrice(total)} تومان
                  </span>
                </div>

                <div className={styles.summaryRow}>
                  <span>هزینه ارسال</span>

                  <span>
                    {formatPrice(SHIPPING_PRICE)}{" "}
                    تومان
                  </span>
                </div>

                <div className={styles.totalRow}>
                  <strong>مبلغ کل سفارش</strong>

                  <strong>
                    {formatPrice(
                      total + SHIPPING_PRICE
                    )}{" "}
                    تومان
                  </strong>
                </div>

                <p
                  style={{
                    marginTop: "20px",
                    marginBottom: "16px",
                    fontSize: "13px",
                    lineHeight: "2",
                    color: "#786f69",
                    textAlign: "right",
                  }}
                >
                  در مرحله بعد اطلاعات ارسال را وارد
                  می‌کنید و پس از ثبت سفارش، یک کد
                  پیگیری دریافت خواهید کرد.
                  برای هماهنگی سفارش، کد را در دایرکت
                  اینستاگرام والینور ارسال کنید.
                </p>

                <Link
                  href="/checkout"
                  className={styles.checkoutButton}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: "56px",
                    padding: "14px 18px",
                    backgroundColor: "#303030",
                    color: "#ffffff",
                    border: "1px solid #303030",
                    borderRadius: "0",
                    fontSize: "14px",
                    fontWeight: 500,
                    lineHeight: "1.7",
                    textDecoration: "none",
                    textAlign: "center",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  ادامه و دریافت کد سفارش
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
