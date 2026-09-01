import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

const SHIPPING_PRICE = 150_000;

type RawCartItem = {
  slug?: unknown;
  quantity?: unknown;
};

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "برای ادامه خرید باید وارد حساب کاربری شوید.",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CART",
          message: "اطلاعات سبد خرید معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const rawItems = body.items as RawCartItem[];

    if (rawItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          code: "EMPTY_CART",
          message: "سبد خرید خالی است.",
        },
        { status: 400 }
      );
    }

    if (rawItems.length > 50) {
      return NextResponse.json(
        {
          success: false,
          code: "CART_TOO_LARGE",
          message: "تعداد محصولات سبد خرید بیش از حد مجاز است.",
        },
        { status: 400 }
      );
    }

    const normalizedItems = new Map<string, number>();

    for (const item of rawItems) {
      const slug =
        typeof item.slug === "string"
          ? item.slug.trim()
          : "";

      const quantity = Number(item.quantity);

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
            message: "یکی از محصولات سبد خرید معتبر نیست.",
          },
          { status: 400 }
        );
      }

      const previousQuantity =
        normalizedItems.get(slug) || 0;

      const nextQuantity =
        previousQuantity + quantity;

      if (nextQuantity > 100) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_QUANTITY",
            message: "تعداد انتخاب‌شده برای یکی از محصولات معتبر نیست.",
          },
          { status: 400 }
        );
      }

      normalizedItems.set(slug, nextQuantity);
    }

    const requestedItems = Array.from(
      normalizedItems.entries()
    ).map(([slug, quantity]) => ({
      slug,
      quantity,
    }));

    const slugs = requestedItems.map(
      (item) => item.slug
    );

    const products = await prisma.product.findMany({
      where: {
        slug: {
          in: slugs,
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

    const missingProducts = requestedItems.filter(
      (item) => !productMap.has(item.slug)
    );

    if (missingProducts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          code: "PRODUCT_NOT_FOUND",
          message:
            "یکی از محصولات سبد خرید دیگر در فروشگاه موجود نیست.",
          products: missingProducts.map(
            (item) => item.slug
          ),
        },
        { status: 409 }
      );
    }

    const checkoutItems = [];

    let subtotalPrice = 0;

    for (const requestedItem of requestedItems) {
      const product = productMap.get(
        requestedItem.slug
      );

      if (!product) {
        continue;
      }

      if (!product.isAvailable) {
        return NextResponse.json(
          {
            success: false,
            code: "PRODUCT_UNAVAILABLE",
            message: `محصول «${product.name}» در حال حاضر قابل سفارش نیست.`,
            product: product.slug,
          },
          { status: 409 }
        );
      }

      if (product.stock < requestedItem.quantity) {
        return NextResponse.json(
          {
            success: false,
            code: "INSUFFICIENT_STOCK",
            message: `موجودی محصول «${product.name}» برای تعداد انتخاب‌شده کافی نیست.`,
            product: product.slug,
            requestedQuantity:
              requestedItem.quantity,
            availableStock:
              product.stock,
          },
          { status: 409 }
        );
      }

      const lineTotal =
        product.price *
        requestedItem.quantity;

      subtotalPrice += lineTotal;

      checkoutItems.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.mainImage,
        quantity:
          requestedItem.quantity,
        unitPrice:
          product.price,
        lineTotal,
        availableStock:
          product.stock,
      });
    }

    const totalPrice =
      subtotalPrice +
      SHIPPING_PRICE;

    if (
      !Number.isSafeInteger(subtotalPrice) ||
      !Number.isSafeInteger(totalPrice)
    ) {
      throw new Error(
        "Checkout total exceeded safe integer range."
      );
    }

    return NextResponse.json(
      {
        success: true,

        checkout: {
          items: checkoutItems,
          subtotalPrice,
          shippingPrice: SHIPPING_PRICE,
          discountAmount: 0,
          totalPrice,
          moneyUnit: "TOMAN",
        },

        customer: {
          name: user.name,
          phone: user.phone,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Checkout validation failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message:
          "خطایی در بررسی سبد خرید رخ داد. لطفاً دوباره تلاش کنید.",
      },
      { status: 500 }
    );
  }
}