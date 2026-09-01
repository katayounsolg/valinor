import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type Body = {
  status?: unknown;
  note?: unknown;
};

const allowedTransitions: Record<
  OrderStatus,
  OrderStatus[]
> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isOrderStatus(
  value: string
): value is OrderStatus {
  return [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ].includes(value);
}

export async function PATCH(
  request: Request,
  { params }: Props
) {
  try {
    /*
      APIهای Admin نباید با redirect محافظت شوند.
      اینجا JSON مناسب 401 / 403 برمی‌گردانیم.
    */
    const admin = await getCurrentUser();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "ابتدا وارد حساب کاربری شوید.",
        },
        { status: 401 }
      );
    }

    if (admin.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          message: "شما اجازه انجام این عملیات را ندارید.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    const orderId = Number(id);

    if (
      !Number.isInteger(orderId) ||
      orderId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_ORDER_ID",
          message: "شناسه سفارش معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as Body | null;

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message: "اطلاعات درخواست معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const nextStatus = cleanText(body.status);
    const note = cleanText(body.note);

    if (!isOrderStatus(nextStatus)) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_STATUS",
          message: "وضعیت سفارش معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (note.length > 500) {
      return NextResponse.json(
        {
          success: false,
          code: "NOTE_TOO_LONG",
          message:
            "یادداشت نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد.",
        },
        { status: 400 }
      );
    }

    const order =
      await prisma.order.findUnique({
        where: {
          id: orderId,
        },

        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          code: "ORDER_NOT_FOUND",
          message: "سفارش پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const currentStatus =
      order.status as OrderStatus;

    if (currentStatus === nextStatus) {
      return NextResponse.json(
        {
          success: true,
          unchanged: true,

          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus:
              order.paymentStatus,
          },
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    /*
      وضعیت‌ها فقط در مسیر منطقی مجاز
      قابل تغییر هستند.

      مثال:
      PENDING -> PROCESSING
      PROCESSING -> SHIPPED
      SHIPPED -> DELIVERED
    */
    const allowedNextStatuses =
      allowedTransitions[currentStatus];

    if (
      !allowedNextStatuses.includes(
        nextStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_TRANSITION",

          message:
            "تغییر مستقیم بین این دو وضعیت مجاز نیست.",

          currentStatus,
          requestedStatus:
            nextStatus,

          allowedStatuses:
            allowedNextStatuses,
        },
        { status: 409 }
      );
    }

    /*
      برای سایت واقعی نباید سفارش
      پرداخت‌نشده وارد فرایند آماده‌سازی،
      ارسال یا تحویل شود.

      فعلاً چون درگاه هنوز وصل نشده،
      سفارش آزمایشی UNPAID فقط می‌تواند
      CANCELLED شود.
    */
    if (
      nextStatus !== "CANCELLED" &&
      order.paymentStatus !== "PAID"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "PAYMENT_REQUIRED",

          message:
            "سفارش پرداخت‌نشده نمی‌تواند وارد فرایند آماده‌سازی یا ارسال شود.",
        },
        { status: 409 }
      );
    }

    /*
      update سفارش + audit history
      باید یک عملیات اتمیک باشند.
    */
    const updatedOrder =
      await prisma.$transaction(
        async (tx) => {
          /*
            وضعیت را دوباره داخل transaction
            می‌خوانیم تا تغییر هم‌زمان Admin دیگر
            را نادیده نگیریم.
          */
          const freshOrder =
            await tx.order.findUnique({
              where: {
                id: orderId,
              },

              select: {
                id: true,
                status: true,
                paymentStatus: true,
              },
            });

          if (!freshOrder) {
            throw new Error(
              "ORDER_NOT_FOUND_DURING_UPDATE"
            );
          }

          const freshStatus =
            freshOrder.status as OrderStatus;

          if (
            freshStatus !== currentStatus
          ) {
            throw new Error(
              "ORDER_STATUS_CHANGED"
            );
          }

          const updated =
            await tx.order.update({
              where: {
                id: orderId,
              },

              data: {
                status: nextStatus,
              },

              select: {
                id: true,
                orderNumber: true,
                status: true,
                paymentStatus: true,
                updatedAt: true,
              },
            });

          await tx.orderStatusHistory.create({
            data: {
              orderId,

              fromStatus:
                currentStatus,

              toStatus:
                nextStatus,

              changedByUserId:
                admin.id,

              note:
                note || null,
            },
          });

          return updated;
        }
      );

    return NextResponse.json(
      {
        success: true,
        unchanged: false,

        order: updatedOrder,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "ORDER_STATUS_CHANGED"
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "ORDER_STATUS_CONFLICT",

          message:
            "وضعیت سفارش هم‌زمان توسط عملیات دیگری تغییر کرده است. صفحه را تازه‌سازی کنید.",
        },
        { status: 409 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "ORDER_NOT_FOUND_DURING_UPDATE"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "ORDER_NOT_FOUND",
          message: "سفارش پیدا نشد.",
        },
        { status: 404 }
      );
    }

    console.error(
      "Admin order status update failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message:
          "تغییر وضعیت سفارش با خطا روبه‌رو شد.",
      },
      { status: 500 }
    );
  }
}