import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import styles from "./page.module.css";

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

export default async function AdminOrdersPage() {
  const [orders, totalOrders] = await Promise.all([
    prisma.order.findMany({
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
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>ORDERS</p>

          <h1 className={styles.title}>سفارش‌ها</h1>

          <p className={styles.description}>
            مشاهده و مدیریت سفارش‌های ثبت‌شده، وضعیت پرداخت و روند
            آماده‌سازی و ارسال.
          </p>
        </div>

        <div className={styles.countBox}>
          <p className={styles.countLabel}>TOTAL ORDERS</p>

          <p className={styles.countValue}>
            {formatPrice(totalOrders)}
          </p>
        </div>
      </header>

      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <div className={styles.panelHeaderText}>
            <h2 className={styles.panelTitle}>
              همه سفارش‌ها
            </h2>

            <p className={styles.panelSub}>
              جدیدترین سفارش‌ها در ابتدای فهرست نمایش داده می‌شوند.
            </p>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>
              <Inbox size={20} strokeWidth={1.3} />
            </span>

            <p className={styles.emptyTitle}>
              هنوز سفارشی ثبت نشده
            </p>

            <p className={styles.emptyText}>
              بعد از ثبت اولین سفارش توسط مشتری، اطلاعات آن در این
              بخش نمایش داده خواهد شد.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>شماره سفارش</th>
                  <th>مشتری</th>
                  <th>تعداد آیتم</th>
                  <th>مبلغ کل</th>
                  <th>پرداخت</th>
                  <th>وضعیت سفارش</th>
                  <th>تاریخ</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className={styles.orderNumber}>
                        {order.orderNumber}
                      </span>
                    </td>

                    <td>
                      <div className={styles.customer}>
                        <span className={styles.customerName}>
                          {order.user.name || "بدون نام"}
                        </span>

                        <span className={styles.customerPhone}>
                          {order.user.phone}
                        </span>
                      </div>
                    </td>

                    <td>
                      {new Intl.NumberFormat("fa-IR").format(
                        order._count.items
                      )}
                    </td>

                    <td>
                      <span className={styles.price}>
                        {formatPrice(order.totalPrice)} تومان
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
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>

                    <td>
                      <span className={styles.date}>
                        {formatDate(order.createdAt)}
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