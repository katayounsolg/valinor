import {
  ShoppingBag,
  Users,
  Package,
  TriangleAlert,
  Inbox,
  Boxes,
} from "lucide-react";

import { prisma } from "@/app/lib/prisma";
import styles from "./page.module.css";

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatOrderId(id: number) {
  return `#${String(id).padStart(6, "0")}`;
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

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "در انتظار",
    PROCESSING: "در حال آماده‌سازی",
    SHIPPED: "ارسال‌شده",
    DELIVERED: "تحویل‌شده",
    CANCELLED: "لغوشده",
  };

  return labels[status] || status;
}
function getStatusClass(status: string) {
  if (status === "PENDING") {
    return `${styles.status} ${styles.statusPending}`;
  }

  if (
    status === "DELIVERED" ||
    status === "PROCESSING" ||
    status === "SHIPPED"
  ) {
    return `${styles.status} ${styles.statusPaid}`;
  }

  if (status === "CANCELLED") {
    return `${styles.status} ${styles.statusCancelled}`;
  }

  return styles.status;
}
export default async function AdminPage() {
  const [
    totalOrders,
    totalCustomers,
    totalProducts,
    lowStockCount,
    recentOrders,
    lowStockProducts,
  ] = await Promise.all([
    prisma.order.count(),

    prisma.user.count({
      where: {
        role: "CUSTOMER",
      },
    }),

    prisma.product.count(),

    prisma.product.count({
      where: {
        stock: {
          lte: 3,
        },
        isAvailable: true,
      },
    }),

    prisma.order.findMany({
      take: 5,
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
      },
    }),

    prisma.product.findMany({
      where: {
        stock: {
          lte: 3,
        },
        isAvailable: true,
      },
      take: 5,
      orderBy: {
        stock: "asc",
      },
      include: {
        category: {
          select: {
            title: true,
          },
        },
      },
    }),
  ]);

  const today = new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "long",
  }).format(new Date());

  return (
    <div className={styles.dashboard}>
      {/* INTRO */}
      <section className={styles.intro}>
        <div className={styles.introText}>
          <p className={styles.eyebrow}>STORE OVERVIEW</p>

          <h1 className={styles.title}>داشبورد</h1>

          <p className={styles.description}>
            نمای کلی فروشگاه، سفارش‌ها، مشتری‌ها و وضعیت موجودی محصولات
            والینور.
          </p>
        </div>

        <div className={styles.dateBox}>
          <p className={styles.dateLabel}>TODAY</p>
          <p className={styles.dateValue}>{today}</p>
        </div>
      </section>

      {/* METRICS */}
      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <div className={styles.metricTop}>
            <p className={styles.metricLabel}>کل سفارش‌ها</p>

            <span className={styles.metricIcon}>
              <ShoppingBag size={17} strokeWidth={1.35} />
            </span>
          </div>

          <div>
            <p className={styles.metricValue}>
              {formatNumber(totalOrders)}
            </p>

            <p className={styles.metricMeta}>
              سفارش ثبت‌شده در سیستم
            </p>
          </div>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricTop}>
            <p className={styles.metricLabel}>مشتری‌ها</p>

            <span className={styles.metricIcon}>
              <Users size={17} strokeWidth={1.35} />
            </span>
          </div>

          <div>
            <p className={styles.metricValue}>
              {formatNumber(totalCustomers)}
            </p>

            <p className={styles.metricMeta}>
              حساب مشتری ثبت‌شده
            </p>
          </div>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricTop}>
            <p className={styles.metricLabel}>محصولات</p>

            <span className={styles.metricIcon}>
              <Package size={17} strokeWidth={1.35} />
            </span>
          </div>

          <div>
            <p className={styles.metricValue}>
              {formatNumber(totalProducts)}
            </p>

            <p className={styles.metricMeta}>
              محصول ثبت‌شده در کاتالوگ
            </p>
          </div>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricTop}>
            <p className={styles.metricLabel}>موجودی کم</p>

            <span className={styles.metricIcon}>
              <TriangleAlert size={17} strokeWidth={1.35} />
            </span>
          </div>

          <div>
            <p className={styles.metricValue}>
              {formatNumber(lowStockCount)}
            </p>

            <p className={styles.metricMeta}>
              محصول با موجودی ۳ عدد یا کمتر
            </p>
          </div>
        </article>
      </section>

      {/* MAIN PANELS */}
      <section className={styles.mainGrid}>
        {/* RECENT ORDERS */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelHeading}>
                سفارش‌های اخیر
              </h2>

              <p className={styles.panelSub}>
                آخرین سفارش‌های ثبت‌شده در فروشگاه
              </p>
            </div>
          </header>

          {recentOrders.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                <Inbox size={19} strokeWidth={1.3} />
              </span>

              <p className={styles.emptyTitle}>
                هنوز سفارشی ثبت نشده
              </p>

              <p className={styles.emptyText}>
                بعد از ثبت اولین سفارش، اطلاعات آن در این بخش
                نمایش داده می‌شود.
              </p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>شماره سفارش</th>
                    <th>مشتری</th>
                    <th>مبلغ ثبت‌شده</th>
                    <th>وضعیت</th>
                    <th>تاریخ</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className={styles.orderId}>
                          {formatOrderId(order.id)}
                        </span>
                      </td>

                      <td>
                        <span className={styles.customerName}>
                          {order.user.name || order.user.phone}
                        </span>
                      </td>

                      <td>
                        <span className={styles.price}>
                          {formatNumber(order.totalPrice)}
                        </span>
                      </td>

                      <td>
                        <span className={getStatusClass(order.status)}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>

                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        {/* LOW STOCK */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelHeading}>
                هشدار موجودی
              </h2>

              <p className={styles.panelSub}>
                محصولاتی که باید بررسی شوند
              </p>
            </div>
          </header>

          {lowStockProducts.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>
                <Boxes size={19} strokeWidth={1.3} />
              </span>

              <p className={styles.emptyTitle}>
                موجودی در وضعیت مناسب است
              </p>

              <p className={styles.emptyText}>
                در حال حاضر محصول فعال با موجودی ۳ عدد یا کمتر
                وجود ندارد.
              </p>
            </div>
          ) : (
            <div className={styles.stockList}>
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className={styles.stockItem}
                >
                  <div className={styles.stockProduct}>
                    <span className={styles.stockName}>
                      {product.name}
                    </span>

                    <span className={styles.stockCategory}>
                      {product.category.title}
                    </span>
                  </div>

                  <span className={styles.stockCount}>
                    {formatNumber(product.stock)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}