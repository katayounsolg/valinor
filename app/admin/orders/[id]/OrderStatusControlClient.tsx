"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";

import styles from "./OrderStatusControl.module.css";

type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type PaymentStatus =
  | "UNPAID"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

type Props = {
  orderId: number;
  currentStatus: OrderStatus;
  paymentStatus: PaymentStatus;
};

type Action = {
  status: OrderStatus;
  label: string;
  variant: "primary" | "default" | "cancel";
  icon: ReactNode;
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "در انتظار",
  PROCESSING: "در حال آماده‌سازی",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELLED: "لغوشده",
};

function getActions(currentStatus: OrderStatus): Action[] {
  if (currentStatus === "PENDING") {
    return [
      {
        status: "PROCESSING",
        label: "شروع آماده‌سازی",
        variant: "primary",
        icon: (
          <PackageCheck
            size={15}
            strokeWidth={1.4}
          />
        ),
      },
      {
        status: "CANCELLED",
        label: "لغو سفارش",
        variant: "cancel",
        icon: (
          <XCircle
            size={15}
            strokeWidth={1.4}
          />
        ),
      },
    ];
  }

  if (currentStatus === "PROCESSING") {
    return [
      {
        status: "SHIPPED",
        label: "ثبت به‌عنوان ارسال‌شده",
        variant: "primary",
        icon: (
          <Truck
            size={15}
            strokeWidth={1.4}
          />
        ),
      },
      {
        status: "CANCELLED",
        label: "لغو سفارش",
        variant: "cancel",
        icon: (
          <XCircle
            size={15}
            strokeWidth={1.4}
          />
        ),
      },
    ];
  }

  if (currentStatus === "SHIPPED") {
    return [
      {
        status: "DELIVERED",
        label: "ثبت تحویل سفارش",
        variant: "primary",
        icon: (
          <CheckCircle2
            size={15}
            strokeWidth={1.4}
          />
        ),
      },
    ];
  }

  return [];
}

export default function OrderStatusControl({
  orderId,
  currentStatus,
  paymentStatus,
}: Props) {
  const router = useRouter();

  const [note, setNote] = useState("");
  const [loadingStatus, setLoadingStatus] =
    useState<OrderStatus | null>(null);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error" | null>(null);

  const actions = getActions(currentStatus);

  const isTerminal =
    currentStatus === "DELIVERED" ||
    currentStatus === "CANCELLED";

  const paymentLocked = paymentStatus !== "PAID";

  async function changeStatus(nextStatus: OrderStatus) {
    if (loadingStatus) {
      return;
    }

    const isCancellation =
      nextStatus === "CANCELLED";

    if (!isCancellation && paymentLocked) {
      setMessageType("error");

      setMessage(
        "این سفارش هنوز پرداخت نشده و نمی‌تواند وارد مرحله آماده‌سازی یا ارسال شود."
      );

      return;
    }

    if (isCancellation) {
      const confirmed = window.confirm(
        "از لغو این سفارش مطمئن هستید؟"
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setLoadingStatus(nextStatus);
      setMessage("");
      setMessageType(null);

      const response = await fetch(
        `/api/admin/orders/${orderId}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status: nextStatus,
            note: note.trim(),
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!data) {
        setMessageType("error");
        setMessage(
          "پاسخ نامعتبر از سرور دریافت شد."
        );
        return;
      }

      if (!response.ok || !data.success) {
        setMessageType("error");

        setMessage(
          data.message ||
            "تغییر وضعیت سفارش انجام نشد."
        );

        return;
      }

      setMessageType("success");

      setMessage(
        "وضعیت سفارش با موفقیت تغییر کرد."
      );

      setNote("");

      router.refresh();
    } catch (error) {
      console.error(
        "Order status update failed:",
        error
      );

      setMessageType("error");

      setMessage(
        "ارتباط با سرور برقرار نشد. دوباره تلاش کنید."
      );
    } finally {
      setLoadingStatus(null);
    }
  }

  return (
    <div className={styles.control}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          ORDER WORKFLOW
        </p>

        <h3 className={styles.title}>
          مدیریت وضعیت سفارش
        </h3>

        <p className={styles.description}>
          تغییرات این بخش در تاریخچه سفارش ثبت می‌شوند.
        </p>
      </header>

      <div className={styles.current}>
        <span className={styles.currentLabel}>
          وضعیت فعلی
        </span>

        <strong className={styles.currentValue}>
          {statusLabels[currentStatus]}
        </strong>
      </div>

      {paymentLocked && !isTerminal && (
        <div className={styles.locked}>
          این سفارش هنوز پرداخت نشده است. تا قبل از
          تأیید پرداخت، فقط امکان لغو سفارش وجود
          دارد.
        </div>
      )}

      {isTerminal ? (
        <div className={styles.locked}>
          {currentStatus === "DELIVERED"
            ? "این سفارش تحویل‌شده ثبت شده و فرایند آن پایان یافته است."
            : "این سفارش لغو شده و امکان تغییر وضعیت دیگری ندارد."}
        </div>
      ) : (
        <>
          <label className={styles.noteBlock}>
            <span className={styles.noteLabel}>
              یادداشت داخلی
            </span>

            <textarea
              className={styles.note}
              value={note}
              onChange={(event) =>
                setNote(event.target.value)
              }
              maxLength={500}
              disabled={Boolean(loadingStatus)}
              placeholder="اختیاری؛ مثلاً توضیح مربوط به آماده‌سازی یا علت لغو سفارش"
            />
          </label>

          <div className={styles.actions}>
            {actions.map((action) => {
              const disabled =
                Boolean(loadingStatus) ||
                (paymentLocked &&
                  action.status !== "CANCELLED");

              const classNames = [
                styles.actionButton,

                action.variant === "primary"
                  ? styles.primaryButton
                  : "",

                action.variant === "cancel"
                  ? styles.cancelButton
                  : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={action.status}
                  type="button"
                  className={classNames}
                  disabled={disabled}
                  onClick={() =>
                    changeStatus(action.status)
                  }
                >
                  {action.icon}

                  {loadingStatus === action.status
                    ? "در حال ثبت..."
                    : action.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {message && (
        <div
          className={[
            styles.message,

            messageType === "error"
              ? styles.error
              : "",

            messageType === "success"
              ? styles.success
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {message}
        </div>
      )}
    </div>
  );
}