import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import OrderStatusControl from "./OrderStatusControlClient";

import { prisma } from "@/app/lib/prisma";
import styles from "./page.module.css";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "در انتظار",
    PROCESSING: "در حال آماده‌سازی",
    SHIPPED: "ارسال‌شده",
    DELIVERED: "تحویل‌شده",
    CANCELLED: "لغوشده",
  };

  return labels[status] || status;
}

function getPaymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    UNPAID: "پرداخت‌نشده",
    PENDING: "در انتظار پرداخت",
    PAID: "پرداخت‌شده",
    FAILED: "ناموفق",
    CANCELLED: "لغوشده",
    REFUNDED: "بازپرداخت‌شده",
  };

  return labels[status] || status;
}

function getOrderStatusClass(status: string) {
  const classes: Record<string, string> = {
    PENDING: styles.orderPending,
    PROCESSING: styles.orderProcessing,
    SHIPPED: styles.orderShipped,
    DELIVERED: styles.orderDelivered,
    CANCELLED: styles.orderCancelled,
  };

  return `${styles.badge} ${classes[status] || ""}`;
}

function getPaymentStatusClass(status: string) {
  const classes: Record<string, string> = {
    UNPAID: styles.paymentUnpaid,
    PENDING: styles.paymentPending,
    PAID: styles.paymentPaid,
    FAILED: styles.paymentFailed,
    CANCELLED: styles.paymentCancelled,
    REFUNDED: styles.paymentRefunded,
  };

  return `${styles.badge} ${classes[status] || ""}`;
}

export default async function AdminOrderDetailPage({
  params,
}: Props) {
  const { id } = await params;

  const orderId = Number(id);

  if (!Number.isInteger(orderId) || orderId < 1) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },

      items: {
        orderBy: {
          id: "asc",
        },
      },

      statusHistory: {
        orderBy: {
          createdAt: "desc",
        },

        include: {
          changedByUser: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>
            ORDER DETAILS
          </p>

          <h1 className={styles.title}>
            جزئیات سفارش
          </h1>

          <p className={styles.orderNumber}>
            {order.orderNumber}
          </p>
        </div>

        <Link
          href="/admin/orders"
          className={styles.backLink}
        >
          <ArrowRight
            size={14}
            strokeWidth={1.4}
          />

          بازگشت به سفارش‌ها
        </Link>
      </header>

      {/* STATUS */}
      <section className={styles.statusGrid}>
        <article className={styles.statusCard}>
          <p className={styles.statusLabel}>
            وضعیت سفارش
          </p>

          <div className={styles.statusValue}>
            <span
              className={getOrderStatusClass(
                order.status
              )}
            >
              {getOrderStatusLabel(order.status)}
            </span>
          </div>
        </article>

        <article className={styles.statusCard}>
          <p className={styles.statusLabel}>
            وضعیت پرداخت
          </p>

          <div className={styles.statusValue}>
            <span
              className={getPaymentStatusClass(
                order.paymentStatus
              )}
            >
              {getPaymentStatusLabel(
                order.paymentStatus
              )}
            </span>
          </div>
        </article>

        <article className={styles.statusCard}>
          <p className={styles.statusLabel}>
            تاریخ ثبت سفارش
          </p>

          <p className={styles.dateValue}>
            {formatDate(order.createdAt)}
          </p>
        </article>
      </section>

      {/* MAIN */}
      <section className={styles.mainGrid}>
        {/* ORDER ITEMS */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>
                محصولات سفارش
              </h2>

              <p className={styles.panelSub}>
                اطلاعات ثبت‌شده در زمان ایجاد سفارش
              </p>
            </div>
          </header>

          <div className={styles.items}>
            {order.items.map((item) => (
              <div
                key={item.id}
                className={styles.item}
              >
                <div className={styles.imageBox}>
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                    />
                  ) : (
                    <span>—</span>
                  )}
                </div>

                <div className={styles.itemInfo}>
                  <h3 className={styles.itemName}>
                    {item.productName}
                  </h3>

                  <p className={styles.itemSlug}>
                    {item.productSlug}
                  </p>

                  <p className={styles.itemMeta}>
                    تعداد:{" "}
                    {formatNumber(item.quantity)}
                    {" · "}
                    قیمت واحد:{" "}
                    {formatPrice(item.unitPrice)}{" "}
                    تومان
                  </p>
                </div>

                <strong
                  className={styles.itemTotal}
                >
                  {formatPrice(item.lineTotal)}{" "}
                  تومان
                </strong>
              </div>
            ))}
          </div>
        </article>

        {/* SIDE */}
        <div className={styles.sideStack}>
          {/* ORDER WORKFLOW */}
          <article className={styles.panel}>
            <div style={{ padding: "22px" }}>
              <OrderStatusControl
                orderId={order.id}
                currentStatus={order.status}
                paymentStatus={order.paymentStatus}
              />
            </div>
          </article>

          {/* STATUS HISTORY */}
          <article className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  تاریخچه وضعیت
                </h2>

                <p className={styles.panelSub}>
                  تغییرات ثبت‌شده توسط مدیران
                </p>
              </div>
            </header>

            {order.statusHistory.length === 0 ? (
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span
                    className={styles.infoLabel}
                  >
                    وضعیت
                  </span>

                  <span
                    className={styles.infoValue}
                  >
                    هنوز تغییری برای این سفارش
                    ثبت نشده است.
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.infoList}>
                {order.statusHistory.map(
                  (history) => (
                    <div
                      key={history.id}
                      className={styles.infoRow}
                    >
                      <span
                        className={
                          styles.infoLabel
                        }
                      >
                        {formatDate(
                          history.createdAt
                        )}
                      </span>

                      <div
                        className={
                          styles.infoValue
                        }
                      >
                        <div>
                          {getOrderStatusLabel(
                            history.fromStatus
                          )}
                          {" → "}
                          <strong>
                            {getOrderStatusLabel(
                              history.toStatus
                            )}
                          </strong>
                        </div>

                        <div>
                          توسط{" "}
                          {history.changedByUser
                            ?.name ||
                            history.changedByUser
                              ?.phone ||
                            "مدیر حذف‌شده"}
                        </div>

                        {history.note && (
                          <div>
                            یادداشت:{" "}
                            {history.note}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </article>

          {/* RECIPIENT */}
          <article className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  اطلاعات گیرنده
                </h2>

                <p className={styles.panelSub}>
                  Snapshot ثبت‌شده روی همین سفارش
                </p>
              </div>
            </header>

            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span
                  className={styles.infoLabel}
                >
                  نام گیرنده
                </span>

                <span
                  className={styles.infoValue}
                >
                  {order.recipientName}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span
                  className={styles.infoLabel}
                >
                  شماره موبایل
                </span>

                <span
                  className={`${styles.infoValue} ${styles.infoValueLtr}`}
                >
                  {order.recipientPhone}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span
                  className={styles.infoLabel}
                >
                  استان
                </span>

                <span
                  className={styles.infoValue}
                >
                  {order.province}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span
                  className={styles.infoLabel}
                >
                  شهر
                </span>

                <span
                  className={styles.infoValue}
                >
                  {order.city}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span
                  className={styles.infoLabel}
                >
                  آدرس کامل
                </span>

                <span
                  className={styles.infoValue}
                >
                  {order.addressLine}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span
                  className={styles.infoLabel}
                >
                  کد پستی
                </span>

                <span
                  className={`${styles.infoValue} ${styles.infoValueLtr}`}
                >
                  {order.postalCode}
                </span>
              </div>
            </div>
          </article>

          {/* ACCOUNT */}
          <article className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  حساب مشتری
                </h2>

                <p className={styles.panelSub}>
                  کاربری که سفارش را ثبت کرده
                </p>
              </div>
            </header>

            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span
                  className={styles.infoLabel}
                >
                  نام حساب
                </span>

                <span
                  className={styles.infoValue}
                >
                  {order.user.name || "بدون نام"}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span
                  className={styles.infoLabel}
                >
                  شماره حساب
                </span>

                <span
                  className={`${styles.infoValue} ${styles.infoValueLtr}`}
                >
                  {order.user.phone}
                </span>
              </div>
            </div>
          </article>

          {/* PAYMENT SUMMARY */}
          <article className={styles.panel}>
            <header className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>
                  خلاصه مالی
                </h2>

                <p className={styles.panelSub}>
                  مبالغ ثبت‌شده روی سفارش
                </p>
              </div>
            </header>

            <div className={styles.priceSummary}>
              <div className={styles.priceRow}>
                <span>جمع محصولات</span>

                <span>
                  {formatPrice(
                    order.subtotalPrice
                  )}{" "}
                  تومان
                </span>
              </div>

              <div className={styles.priceRow}>
                <span>هزینه ارسال</span>

                <span>
                  {formatPrice(
                    order.shippingPrice
                  )}{" "}
                  تومان
                </span>
              </div>

              {order.discountAmount > 0 && (
                <div className={styles.priceRow}>
                  <span>تخفیف</span>

                  <span>
                    −{" "}
                    {formatPrice(
                      order.discountAmount
                    )}{" "}
                    تومان
                  </span>
                </div>
              )}

              <div className={styles.totalRow}>
                <span
                  className={styles.totalLabel}
                >
                  مبلغ کل
                </span>

                <strong
                  className={styles.totalPrice}
                >
                  {formatPrice(order.totalPrice)}{" "}
                  تومان
                </strong>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}