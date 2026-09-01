import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";
import { Prisma } from "@/app/generated/prisma/client";

type CreateProductBody = {
  name?: unknown;
  slug?: unknown;

  shortDescription?: unknown;
  fullDescription?: unknown;

  price?: unknown;

  mainImage?: unknown;
  images?: unknown;

  stock?: unknown;
  isAvailable?: unknown;

  tags?: unknown;

  material?: unknown;
  dimensions?: unknown;
  weight?: unknown;

  categoryId?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function cleanOptionalText(
  value: unknown,
  maxLength: number
) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  if (text.length > maxLength) {
    return undefined;
  }

  return text;
}

function cleanStringArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number
) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  if (value.length > maxItems) {
    return null;
  }

  const result: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return null;
    }

    const text = item.trim();

    if (!text) {
      continue;
    }

    if (text.length > maxItemLength) {
      return null;
    }

    if (!result.includes(text)) {
      result.push(text);
    }
  }

  return result;
}

export async function POST(request: Request) {
  try {
    /*
      فقط ادمین اجازه ساخت محصول دارد.
    */
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message:
            "برای انجام این عملیات باید وارد حساب کاربری شوید.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          message:
            "اجازه افزودن محصول را ندارید.",
        },
        { status: 403 }
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as
      | CreateProductBody
      | null;

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message:
            "اطلاعات ارسال‌شده معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const name = cleanText(body.name);
    const slug = cleanText(body.slug);

    const shortDescription =
      cleanOptionalText(
        body.shortDescription,
        500
      );

    const fullDescription =
      cleanOptionalText(
        body.fullDescription,
        5000
      );

    const material =
      cleanOptionalText(
        body.material,
        200
      );

    const dimensions =
      cleanOptionalText(
        body.dimensions,
        200
      );

    const weight =
      cleanOptionalText(
        body.weight,
        100
      );

    const mainImage =
      cleanText(body.mainImage);

    const price = Number(body.price);
    const stock = Number(body.stock);

    const categoryId = Number(
      body.categoryId
    );

    const images = cleanStringArray(
      body.images,
      20,
      1000
    );

    const tags = cleanStringArray(
      body.tags,
      30,
      100
    );

    /*
      نام محصول
    */
    if (
      name.length < 2 ||
      name.length > 160
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_NAME",
          message:
            "نام محصول باید بین ۲ تا ۱۶۰ کاراکتر باشد.",
        },
        { status: 400 }
      );
    }

    /*
      Slug
    */
    if (
      slug.length < 2 ||
      slug.length > 160 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_SLUG",
          message:
            "Slug معتبر نیست. فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است.",
        },
        { status: 400 }
      );
    }

    /*
      متن‌های اختیاری
    */
    if (
      shortDescription === undefined ||
      fullDescription === undefined ||
      material === undefined ||
      dimensions === undefined ||
      weight === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "TEXT_TOO_LONG",
          message:
            "یکی از فیلدهای متنی بیش از حد طولانی است.",
        },
        { status: 400 }
      );
    }

    /*
      قیمت
    */
    if (
      !Number.isSafeInteger(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PRICE",
          message:
            "قیمت محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      موجودی
    */
    if (
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_STOCK",
          message:
            "موجودی محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      دسته‌بندی
    */
    if (
      !Number.isInteger(categoryId) ||
      categoryId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CATEGORY",
          message:
            "دسته‌بندی انتخاب‌شده معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      تصویر اصلی
    */
    if (
      !mainImage ||
      mainImage.length > 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_MAIN_IMAGE",
          message:
            "تصویر اصلی محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      تصاویر تکمیلی
    */
    if (!images) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_IMAGES",
          message:
            "فهرست تصاویر محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      تگ‌ها
    */
    if (!tags) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_TAGS",
          message:
            "فهرست تگ‌های محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      وضعیت فعال/غیرفعال
    */
    const isAvailable =
      body.isAvailable === undefined
        ? true
        : body.isAvailable;

    if (
      typeof isAvailable !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_AVAILABILITY",
          message:
            "وضعیت محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      دسته‌بندی حتماً باید وجود داشته باشد.
    */
    const category =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },

        select: {
          id: true,
        },
      });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          code: "CATEGORY_NOT_FOUND",
          message:
            "دسته‌بندی انتخاب‌شده وجود ندارد.",
        },
        { status: 400 }
      );
    }

    /*
      ساخت محصول
    */
    const product =
      await prisma.product.create({
        data: {
          name,
          slug,

          shortDescription,
          fullDescription,

          price,

          mainImage,
          images: JSON.stringify(images),

          stock,
          isAvailable,

          tags: JSON.stringify(tags),

          material,
          dimensions,
          weight,

          categoryId,
        },

        select: {
          id: true,
          name: true,
          slug: true,

          price: true,
          stock: true,
          isAvailable: true,

          mainImage: true,
          categoryId: true,

          createdAt: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        product,
      },
      {
        status: 201,

        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    /*
      Slug محصول unique است.
    */
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "SLUG_ALREADY_EXISTS",
          message:
            "این Slug قبلاً برای محصول دیگری استفاده شده است.",
        },
        { status: 409 }
      );
    }

    console.error(
      "Admin product creation failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message:
          "افزودن محصول با خطا روبه‌رو شد.",
      },
      { status: 500 }
    );
  }
}