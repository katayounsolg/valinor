
import Link from "next/link";
import { ArrowLeft, Inbox, Search } from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getOrderStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "در انتظار بررسی",
    PROCESSING: "در حال آماده‌سازی",
    SHIPPED: "ارسال‌شده",
    DELIVERED: "تحویل‌شده",
    CANCELLED: "لغوشده",
  };

  return labels[status] || status;
}

function getPaymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    UNPAID: "هماهنگی نشده",
    PENDING: "در انتظار پرداخت",
    PAID: "پرداخت‌شده",
    FAILED: "ناموفق",
    CANCELLED: "لغوشده",
    REFUNDED: "بازپرداخت‌شده",
  };

  return labels[status] || status;
}

function getOrderStatusClass(status: string) {
  const base = styles.badge;

  const classes: Record<string, string> = {
    PENDING: styles.orderPending,
    PROCESSING: styles.orderProcessing,
    SHIPPED: styles.orderShipped,
    DELIVERED: styles.orderDelivered,
    CANCELLED: styles.orderCancelled,
  };

  return `${base} ${classes[status] || ""}`;
}

function getPaymentStatusClass(status: string) {
  const base = styles.badge;

  const classes: Record<string, string> = {
    UNPAID: styles.paymentUnpaid,
    PENDING: styles.paymentPending,
    PAID: styles.paymentPaid,
    FAILED: styles.paymentFailed,
    CANCELLED: styles.paymentCancelled,
    REFUNDED: styles.paymentRefunded,
  };

  return `${base} ${classes[status] || ""}`;
}

export default async function AdminOrdersPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const rawQuery = Array.isArray(params.q)
    ? params.q[0] ?? ""
    : params.q ?? "";

  const query = rawQuery.trim().slice(0, 100);

  const where = query
    ? {
        orderNumber: {
          contains: query,
        },
      }
    : {};

  const [orders, totalOrders, matchingOrders] =
    await Promise.all([
      prisma.order.findMany({
        where,
        take: 100,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
              phone: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),

      prisma.order.count(),

      query
        ? prisma.order.count({ where })
        : prisma.order.count(),
    ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>
            ORDERS
          </p>

          <h1 className={styles.title}>
            سفارش‌ها
          </h1>

          <p className={styles.description}>
            مشاهده سفارش‌های ثبت‌شده، پیدا کردن
            سفارش با کد پیگیری و مدیریت مراحل
            آماده‌سازی و ارسال.
          </p>
        </div>

        <div className={styles.countBox}>
          <p className={styles.countLabel}>
            TOTAL ORDERS
          </p>

          <p className={styles.countValue}>
            {formatPrice(totalOrders)}
          </p>
        </div>
      </header>

      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <div className={styles.panelHeaderText}>
            <h2 className={styles.panelTitle}>
              پیگیری سفارش مشتری
            </h2>

            <p className={styles.panelSub}>
              کدی را که مشتری در دایرکت
              اینستاگرام فرستاده وارد کنید.
            </p>
          </div>
        </header>

        <form
          action="/admin/orders"
          method="GET"
          role="search"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            padding: "20px",
            alignItems: "center",
          }}
        >
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="مثلاً VAL-20261125-..."
            maxLength={100}
            aria-label="جستجو با کد سفارش"
            dir="ltr"
            style={{
              flex: "1 1 240px",
              minWidth: 0,
              padding: "12px 16px",
              border: "1px solid #d6d6d6",
              borderRadius: "10px",
              backgroundColor: "transparent",
              color: "inherit",
              font: "inherit",
            }}
          />

          <button
            type="submit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#222",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              font: "inherit",
            }}
          >
            <Search size={17} />
            جستجوی سفارش
          </button>

          {query && (
            <Link
              href="/admin/orders"
              style={{
                padding: "12px",
                textDecoration: "underline",
                color: "inherit",
              }}
            >
              نمایش همه
            </Link>
          )}
        </form>

        <header className={styles.panelHeader}>
          <div className={styles.panelHeaderText}>
            <h2 className={styles.panelTitle}>
              {query
                ? "نتایج جستجو"
                : "همه سفارش‌ها"}
            </h2>

            <p className={styles.panelSub}>
              {query
                ? `${formatPrice(matchingOrders)} سفارش مطابق کد واردشده پیدا شد.`
                : "جدیدترین سفارش‌ها در ابتدای فهرست نمایش داده می‌شوند."}
            </p>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <Inbox
                size={20}
                strokeWidth={1.3}
              />
            </span>

            <p className={styles.emptyTitle}>
              {query
                ? "سفارشی با این کد پیدا نشد"
                : "هنوز سفارشی ثبت نشده"}
            </p>

            <p className={styles.emptyText}>
              {query
                ? "کد ارسالی مشتری را دوباره بررسی کنید."
                : "بعد از ثبت اولین سفارش توسط مشتری، اطلاعات آن در این بخش نمایش داده خواهد شد."}
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>کد پیگیری سفارش</th>
                  <th>مشتری</th>
                  <th>تعداد آیتم</th>
                  <th>مبلغ کل</th>
                  <th>هماهنگی مالی</th>
                  <th>وضعیت سفارش</th>
                  <th>تاریخ</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span
                        className={styles.orderNumber}
                        dir="ltr"
                      >
                        {order.orderNumber}
                      </span>
                    </td>

                    <td>
                      <div className={styles.customer}>
                        <span
                          className={styles.customerName}
                        >
                          {order.recipientName ||
                            order.user?.name ||
                            "نام وارد نشده"}
                        </span>

                        <span
                          className={styles.customerPhone}
                          dir="ltr"
                        >
                          {order.recipientPhone ||
                            order.user?.phone ||
                            ""}
                        </span>
                      </div>
                    </td>

                    <td>
                      {new Intl.NumberFormat(
                        "fa-IR"
                      ).format(order._count.items)}
                    </td>

                    <td>
                      <span className={styles.price}>
                        {formatPrice(
                          order.totalPrice
                        )}{" "}
                        تومان
                      </span>
                    </td>

                    <td>
                      <span
                        className={getPaymentStatusClass(
                          order.paymentStatus
                        )}
                      >
                        {getPaymentStatusLabel(
                          order.paymentStatus
                        )}
                      </span>
                    </td>

                    <td>
                      <span
                        className={getOrderStatusClass(
                          order.status
                        )}
                      >
                        {getOrderStatusLabel(
                          order.status
                        )}
                      </span>
                    </td>

                    <td>
                      <span className={styles.date}>
                        {formatDate(
                          order.createdAt
                        )}
                      </span>
                    </td>

                    <td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className={styles.actionLink}
                      >
                        مشاهده
                        <ArrowLeft
                          size={13}
                          strokeWidth={1.4}
                        />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
