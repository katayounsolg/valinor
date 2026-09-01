import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";
import { Prisma } from "@/app/generated/prisma/client";

const SHIPPING_PRICE = 150_000;

type RawItem = {
  slug?: unknown;
  quantity?: unknown;
};

type CheckoutBody = {
  requestKey?: unknown;

  items?: RawItem[];

  recipientName?: unknown;
  recipientPhone?: unknown;

  province?: unknown;
  city?: unknown;
  addressLine?: unknown;
  postalCode?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizePhone(value: string) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(/[۰-۹]/g, (digit) =>
      String(persianDigits.indexOf(digit))
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(arabicDigits.indexOf(digit))
    )
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}

function normalizePostalCode(value: string) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(/[۰-۹]/g, (digit) =>
      String(persianDigits.indexOf(digit))
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(arabicDigits.indexOf(digit))
    )
    .replace(/\D/g, "");
}

function createOrderNumber() {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const randomPart = crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();

  return `VAL-${datePart}-${randomPart}`;
}

function orderResponse(order: {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotalPrice: number;
  shippingPrice: number;
  discountAmount: number;
  totalPrice: number;
  createdAt: Date;
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,

    status: order.status,
    paymentStatus: order.paymentStatus,

    subtotalPrice: order.subtotalPrice,
    shippingPrice: order.shippingPrice,
    discountAmount: order.discountAmount,
    totalPrice: order.totalPrice,

    createdAt: order.createdAt,
  };
}

export async function POST(request: Request) {
  let requestKey = "";
  let authenticatedUserId: number | null = null;

  try {
    /*
      فقط کاربر لاگین‌شده می‌تواند سفارش بسازد.
    */
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message:
            "برای ثبت سفارش باید وارد حساب کاربری شوید.",
        },
        { status: 401 }
      );
    }

    /*
      userId را خارج از try نیز نگه می‌داریم
      تا در مسیر race condition بتوانیم
      مالکیت requestKey را دوباره بررسی کنیم.
    */
    authenticatedUserId = user.id;

    const body = (await request
      .json()
      .catch(() => null)) as CheckoutBody | null;

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message:
            "اطلاعات سفارش معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      کلید یکتای هر تلاش ثبت سفارش.
      در مرحله Checkout ارسال می‌شود.
    */
    requestKey = cleanText(
      body.requestKey
    );

    if (
      !requestKey ||
      requestKey.length < 20 ||
      requestKey.length > 100 ||
      !/^[a-zA-Z0-9-]+$/.test(requestKey)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST_KEY",
          message:
            "شناسه ثبت سفارش معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      اگر همین درخواست قبلاً ثبت شده،
      سفارش جدید نمی‌سازیم.
    */
    const existingOrder =
      await prisma.order.findUnique({
        where: {
          requestKey,
        },

        select: {
          id: true,
          userId: true,

          orderNumber: true,

          status: true,
          paymentStatus: true,

          subtotalPrice: true,
          shippingPrice: true,
          discountAmount: true,
          totalPrice: true,

          createdAt: true,
        },
      });

    if (existingOrder) {
      /*
        requestKey نباید بین دو کاربر مشترک باشد.
      */
      if (
        existingOrder.userId !== user.id
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "REQUEST_KEY_CONFLICT",
            message:
              "شناسه ثبت سفارش معتبر نیست.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          duplicate: true,

          order:
            orderResponse(existingOrder),
        },
        {
          status: 200,

          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const recipientName =
      cleanText(body.recipientName);

    const recipientPhone =
      normalizePhone(
        cleanText(body.recipientPhone)
      );

    const province =
      cleanText(body.province);

    const city =
      cleanText(body.city);

    const addressLine =
      cleanText(body.addressLine);

    const postalCode =
      normalizePostalCode(
        cleanText(body.postalCode)
      );

    /*
      Validation اطلاعات گیرنده
    */
    if (
      !recipientName ||
      !recipientPhone ||
      !province ||
      !city ||
      !addressLine ||
      !postalCode
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_ADDRESS_DATA",
          message:
            "اطلاعات گیرنده و آدرس را کامل کنید.",
        },
        { status: 400 }
      );
    }

    if (
      recipientName.length < 2 ||
      recipientName.length > 120
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_RECIPIENT_NAME",
          message:
            "نام گیرنده معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (
      !/^09\d{9}$/.test(
        recipientPhone
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PHONE",
          message:
            "شماره موبایل گیرنده معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (
      province.length > 80 ||
      city.length > 80
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_LOCATION",
          message:
            "استان یا شهر معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (
      addressLine.length < 10 ||
      addressLine.length > 500
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_ADDRESS",
          message:
            "آدرس کامل معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (
      !/^\d{10}$/.test(postalCode)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_POSTAL_CODE",
          message:
            "کد پستی باید ۱۰ رقم باشد.",
        },
        { status: 400 }
      );
    }

    /*
      Validation سبد
    */
    if (
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "EMPTY_CART",
          message:
            "سبد خرید خالی است.",
        },
        { status: 400 }
      );
    }

    if (body.items.length > 50) {
      return NextResponse.json(
        {
          success: false,
          code: "CART_TOO_LARGE",
          message:
            "تعداد محصولات سبد خرید بیش از حد مجاز است.",
        },
        { status: 400 }
      );
    }

    /*
      slug تکراری را یکی می‌کنیم.
    */
    const normalizedItems =
      new Map<string, number>();

    for (const item of body.items) {
      const slug =
        cleanText(item.slug);

      const quantity =
        Number(item.quantity);

      if (
        !slug ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 100
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_CART_ITEM",
            message:
              "یکی از محصولات سبد خرید معتبر نیست.",
          },
          { status: 400 }
        );
      }

      const nextQuantity =
        (normalizedItems.get(slug) || 0) +
        quantity;

      if (nextQuantity > 100) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_QUANTITY",
            message:
              "تعداد انتخاب‌شده برای یک محصول معتبر نیست.",
          },
          { status: 400 }
        );
      }

      normalizedItems.set(
        slug,
        nextQuantity
      );
    }

    const requestedItems =
      Array.from(
        normalizedItems.entries()
      ).map(([slug, quantity]) => ({
        slug,
        quantity,
      }));

    /*
      قیمت و موجودی فقط از دیتابیس.
    */
    const products =
      await prisma.product.findMany({
        where: {
          slug: {
            in: requestedItems.map(
              (item) => item.slug
            ),
          },
        },

        select: {
          id: true,
          slug: true,
          name: true,
          mainImage: true,

          price: true,
          stock: true,
          isAvailable: true,
        },
      });

    const productMap = new Map(
      products.map((product) => [
        product.slug,
        product,
      ])
    );

    let subtotalPrice = 0;

    const orderItems: {
      productId: number;
      productSlug: string;
      productName: string;
      productImage: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];

    for (
      const requestedItem of requestedItems
    ) {
      const product =
        productMap.get(
          requestedItem.slug
        );

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            code: "PRODUCT_NOT_FOUND",
            message:
              "یکی از محصولات سبد خرید دیگر در فروشگاه وجود ندارد.",
          },
          { status: 409 }
        );
      }

      if (!product.isAvailable) {
        return NextResponse.json(
          {
            success: false,
            code: "PRODUCT_UNAVAILABLE",

            message:
              `محصول «${product.name}» در حال حاضر قابل سفارش نیست.`,
          },
          { status: 409 }
        );
      }

      if (
        product.stock <
        requestedItem.quantity
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "INSUFFICIENT_STOCK",

            message:
              `موجودی محصول «${product.name}» کافی نیست.`,

            product:
              product.slug,

            availableStock:
              product.stock,
          },
          { status: 409 }
        );
      }

      const lineTotal =
        product.price *
        requestedItem.quantity;

      if (
        !Number.isSafeInteger(
          lineTotal
        )
      ) {
        throw new Error(
          "Order line total exceeded safe integer range."
        );
      }

      subtotalPrice +=
        lineTotal;

      orderItems.push({
        productId:
          product.id,

        productSlug:
          product.slug,

        productName:
          product.name,

        productImage:
          product.mainImage,

        quantity:
          requestedItem.quantity,

        unitPrice:
          product.price,

        lineTotal,
      });
    }

    const discountAmount = 0;

    const totalPrice =
      subtotalPrice +
      SHIPPING_PRICE -
      discountAmount;

    if (
      !Number.isSafeInteger(
        subtotalPrice
      ) ||
      !Number.isSafeInteger(
        totalPrice
      )
    ) {
      throw new Error(
        "Order total exceeded safe integer range."
      );
    }

    /*
      Order + OrderItemها یکجا ساخته می‌شوند.
    */
    const order =
      await prisma.$transaction(
        async (tx) => {
          const orderNumber =
            createOrderNumber();

          return tx.order.create({
            data: {
              orderNumber,
              requestKey,

              userId: user.id,

              status: "PENDING",
              paymentStatus:
                "UNPAID",

              recipientName,
              recipientPhone,

              province,
              city,
              addressLine,
              postalCode,

              subtotalPrice,

              shippingPrice:
                SHIPPING_PRICE,

              discountAmount,

              totalPrice,

              items: {
                create:
                  orderItems,
              },
            },

            select: {
              id: true,

              orderNumber: true,

              status: true,
              paymentStatus: true,

              subtotalPrice: true,
              shippingPrice: true,
              discountAmount: true,
              totalPrice: true,

              createdAt: true,
            },
          });
        }
      );

    return NextResponse.json(
      {
        success: true,
        duplicate: false,

        order:
          orderResponse(order),
      },
      {
        status: 201,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    /*
      ممکن است دو درخواست دقیقاً همزمان
      با یک requestKey برسند.

      unique constraint باعث می‌شود
      فقط یکی ساخته شود.
    */
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      requestKey &&
      authenticatedUserId !== null
    ) {
      const existingOrder =
        await prisma.order.findUnique({
          where: {
            requestKey,
          },

          select: {
            id: true,
            userId: true,

            orderNumber: true,

            status: true,
            paymentStatus: true,

            subtotalPrice: true,
            shippingPrice: true,
            discountAmount: true,
            totalPrice: true,

            createdAt: true,
          },
        });

      if (existingOrder) {
        /*
          حتی در race condition هم نباید
          سفارش متعلق به کاربر دیگری
          برگردانده شود.
        */
        if (
          existingOrder.userId !==
          authenticatedUserId
        ) {
          return NextResponse.json(
            {
              success: false,
              code: "REQUEST_KEY_CONFLICT",
              message:
                "شناسه ثبت سفارش معتبر نیست.",
            },
            { status: 409 }
          );
        }

        return NextResponse.json(
          {
            success: true,
            duplicate: true,

            order:
              orderResponse(
                existingOrder
              ),
          },
          {
            status: 200,

            headers: {
              "Cache-Control":
                "no-store",
            },
          }
        );
      }
    }

    console.error(
      "Order creation failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",

        message:
          "ثبت سفارش با خطا روبه‌رو شد. لطفاً دوباره تلاش کنید.",
      },
      { status: 500 }
    );
  }
}