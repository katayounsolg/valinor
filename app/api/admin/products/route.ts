import { NextResponse } from "next/server";

import { Prisma } from "@/app/generated/prisma/client";
import { getCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type CreateProductBody = {
  name?: unknown;
  slug?: unknown;

  shortDescription?: unknown;
  fullDescription?: unknown;

  leftDescription?: unknown;
  detailsContent?: unknown;
  shippingContent?: unknown;

  englishName?: unknown;
  seriesTitle?: unknown;
  seriesTagline?: unknown;

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

const MAX_TEXT_LENGTH = {
  name: 160,
  slug: 160,
  shortDescription: 500,
  fullDescription: 5000,
  leftDescription: 5000,
  detailsContent: 5000,
  shippingContent: 5000,
  englishName: 160,
  seriesTitle: 160,
  seriesTagline: 300,
  material: 200,
  dimensions: 200,
  weight: 100,
} as const;

const MAX_IMAGE_URL_LENGTH = 1000;
const MAX_GALLERY_IMAGES = 5;
const MAX_TAGS = 30;
const MAX_TAG_LENGTH = 100;

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalText(
  value: unknown,
  maxLength: number
): string | null | undefined {
  const text = cleanText(value);

  if (!text) return null;
  if (text.length > maxLength) return undefined;

  return text;
}

/**
 * برای تصاویر، ترتیب آرایه مهم است.
 * بنابراین خانه‌های خالی حذف و آدرس‌های تکراری جابه‌جا نمی‌شوند.
 */
function cleanGalleryImages(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_GALLERY_IMAGES) {
    return null;
  }

  const result: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") return null;

    const imageUrl = item.trim();

    if (imageUrl.length > MAX_IMAGE_URL_LENGTH) return null;

    result.push(imageUrl);
  }

  return result;
}

function cleanTags(value: unknown): string[] | null {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_TAGS) return null;

  const result: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") return null;

    const tag = item.trim();

    if (!tag) continue;
    if (tag.length > MAX_TAG_LENGTH) return null;
    if (!result.includes(tag)) result.push(tag);
  }

  return result;
}

function badRequest(code: string, message: string, status = 400) {
  return NextResponse.json(
    { success: false, code, message },
    { status }
  );
}

export async function POST(request: Request) {
  try {
    // فقط مدیر فروشگاه اجازه ساخت محصول دارد.
    const user = await getCurrentUser();

    if (!user) {
      return badRequest(
        "UNAUTHORIZED",
        "برای انجام این عملیات باید وارد حساب کاربری شوید.",
        401
      );
    }

    if (user.role !== "ADMIN") {
      return badRequest(
        "FORBIDDEN",
        "اجازه افزودن محصول را ندارید.",
        403
      );
    }

    const body = (await request.json().catch(() => null)) as
      | CreateProductBody
      | null;

    if (!body || typeof body !== "object") {
      return badRequest(
        "INVALID_REQUEST",
        "اطلاعات ارسال‌شده معتبر نیست."
      );
    }

    const name = cleanText(body.name);
    const slug = cleanText(body.slug);

    // متن‌های صفحه محصول
    const shortDescription = cleanOptionalText(
      body.shortDescription,
      MAX_TEXT_LENGTH.shortDescription
    );
    const fullDescription = cleanOptionalText(
      body.fullDescription,
      MAX_TEXT_LENGTH.fullDescription
    );

    // ستون سمت چپ
    const leftDescription = cleanOptionalText(
      body.leftDescription,
      MAX_TEXT_LENGTH.leftDescription
    );
    const detailsContent = cleanOptionalText(
      body.detailsContent,
      MAX_TEXT_LENGTH.detailsContent
    );
    const shippingContent = cleanOptionalText(
      body.shippingContent,
      MAX_TEXT_LENGTH.shippingContent
    );

    // ستون سمت راست
    const englishName = cleanOptionalText(
      body.englishName,
      MAX_TEXT_LENGTH.englishName
    );
    const seriesTitle = cleanOptionalText(
      body.seriesTitle,
      MAX_TEXT_LENGTH.seriesTitle
    );
    const seriesTagline = cleanOptionalText(
      body.seriesTagline,
      MAX_TEXT_LENGTH.seriesTagline
    );

    // مشخصات فیزیکی
    const material = cleanOptionalText(
      body.material,
      MAX_TEXT_LENGTH.material
    );
    const dimensions = cleanOptionalText(
      body.dimensions,
      MAX_TEXT_LENGTH.dimensions
    );
    const weight = cleanOptionalText(
      body.weight,
      MAX_TEXT_LENGTH.weight
    );

    const optionalTextFields = [
      shortDescription,
      fullDescription,
      leftDescription,
      detailsContent,
      shippingContent,
      englishName,
      seriesTitle,
      seriesTagline,
      material,
      dimensions,
      weight,
    ];

    if (optionalTextFields.some((field) => field === undefined)) {
      return badRequest(
        "TEXT_TOO_LONG",
        "یکی از فیلدهای متنی بیش از حد طولانی است."
      );
    }

    // نام محصول
    if (name.length < 2 || name.length > MAX_TEXT_LENGTH.name) {
      return badRequest(
        "INVALID_NAME",
        "نام محصول باید بین ۲ تا ۱۶۰ کاراکتر باشد."
      );
    }

    // آدرس محصول
    if (
      slug.length < 2 ||
      slug.length > MAX_TEXT_LENGTH.slug ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      return badRequest(
        "INVALID_SLUG",
        "Slug معتبر نیست. فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است."
      );
    }

    // قیمت و موجودی
    const price = Number(body.price);
    const stock = Number(body.stock);

    if (!Number.isSafeInteger(price) || price < 0) {
      return badRequest("INVALID_PRICE", "قیمت محصول معتبر نیست.");
    }

    if (!Number.isSafeInteger(stock) || stock < 0) {
      return badRequest("INVALID_STOCK", "موجودی محصول معتبر نیست.");
    }

    // دسته‌بندی
    const categoryId = Number(body.categoryId);

    if (!Number.isInteger(categoryId) || categoryId < 1) {
      return badRequest(
        "INVALID_CATEGORY",
        "دسته‌بندی انتخاب‌شده معتبر نیست."
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return badRequest(
        "CATEGORY_NOT_FOUND",
        "دسته‌بندی انتخاب‌شده وجود ندارد."
      );
    }

    // تصویر اصلی (جایگاه شماره ۱)
    const mainImage = cleanText(body.mainImage);

    if (
      !mainImage ||
      mainImage.length > MAX_IMAGE_URL_LENGTH
    ) {
      return badRequest(
        "INVALID_MAIN_IMAGE",
        "تصویر شماره ۱ محصول معتبر نیست."
      );
    }

    // تصاویر شماره ۲ تا ۶؛ ترتیب دقیق آرایه حفظ می‌شود.
    const images = cleanGalleryImages(body.images);

    if (!images) {
      return badRequest(
        "INVALID_IMAGES",
        "حداکثر پنج تصویر تکمیلی با آدرس معتبر مجاز است."
      );
    }

    // تگ‌ها
    const tags = cleanTags(body.tags);

    if (!tags) {
      return badRequest(
        "INVALID_TAGS",
        "فهرست تگ‌های محصول معتبر نیست."
      );
    }

    // وضعیت محصول
    const isAvailable =
      body.isAvailable === undefined ? true : body.isAvailable;

    if (typeof isAvailable !== "boolean") {
      return badRequest(
        "INVALID_AVAILABILITY",
        "وضعیت محصول معتبر نیست."
      );
    }

    // ایجاد محصول
    const product = await prisma.product.create({
      data: {
        name,
        slug,

        shortDescription,
        fullDescription,

        leftDescription,
        detailsContent,
        shippingContent,

        englishName,
        seriesTitle,
        seriesTagline,

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

        shortDescription: true,
        fullDescription: true,

        leftDescription: true,
        detailsContent: true,
        shippingContent: true,

        englishName: true,
        seriesTitle: true,
        seriesTagline: true,

        price: true,
        stock: true,
        isAvailable: true,

        mainImage: true,
        images: true,
        tags: true,

        material: true,
        dimensions: true,
        weight: true,

        categoryId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "محصول با موفقیت ایجاد شد.",
        product: {
          ...product,
          images,
          tags,
        },
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return badRequest(
        "SLUG_ALREADY_EXISTS",
        "این Slug قبلاً برای محصول دیگری استفاده شده است.",
        409
      );
    }

    console.error("Admin product creation failed:", error);

    return badRequest(
      "INTERNAL_ERROR",
      "افزودن محصول با خطا روبه‌رو شد.",
      500
    );
  }
}
