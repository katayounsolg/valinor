
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";
import { deleteMediaIfUnreferenced } from "@/app/lib/mediaCleanup";
import { Prisma } from "@/app/generated/prisma/client";

type Props = {
  params: Promise<{ id: string }>;
};

type UpdateProductBody = {
  name?: unknown;
  slug?: unknown;
  categoryId?: unknown;
  price?: unknown;
  stock?: unknown;
  isAvailable?: unknown;

  mainImage?: unknown;
  images?: unknown;

  shortDescription?: unknown;
  fullDescription?: unknown;
  leftDescription?: unknown;
  detailsContent?: unknown;
  shippingContent?: unknown;

  englishName?: unknown;
  seriesTitle?: unknown;
  seriesTagline?: unknown;

  tags?: unknown;

  material?: unknown;
  dimensions?: unknown;
  weight?: unknown;
};

const MAX_GALLERY_IMAGES = 5;
const MAX_IMAGE_URL_LENGTH = 1000;

const TEXT_LIMITS = {
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
};

function cleanText(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isValidImageReference(value: string): boolean {
  if (!value || value.length > MAX_IMAGE_URL_LENGTH) {
    return false;
  }

  if (value.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function normalizeImages(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const images: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return null;
    }

    const image = item.trim();

    if (!image) continue;

    if (!isValidImageReference(image)) {
      return null;
    }

    if (!images.includes(image)) {
      images.push(image);
    }
  }

  return images.length <= MAX_GALLERY_IMAGES
    ? images
    : null;
}

function normalizeTags(value: unknown): string[] | null {
  if (value === undefined || value === null) {
    return [];
  }

  let items: unknown[];

  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === "string") {
    items = value.split(",");
  } else {
    return null;
  }

  const tags: string[] = [];

  for (const item of items) {
    if (typeof item !== "string") {
      return null;
    }

    const tag = item.trim();

    if (!tag) continue;

    if (tag.length > 100) {
      return null;
    }

    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags.length <= 30 ? tags : null;
}

function normalizeOptionalText(
  value: unknown,
  maxLength: number
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.trim();

  if (text.length > maxLength) {
    return undefined;
  }

  return text || null;
}

function parseStoredImages(value: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return null;
    }

    const images: string[] = [];

    for (const item of parsed) {
      if (typeof item !== "string") {
        return null;
      }

      const image = item.trim();

      if (image && !images.includes(image)) {
        images.push(image);
      }
    }

    return images;
  } catch {
    return null;
  }
}

// =========================================
// ADMIN AUTH
// =========================================

async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      response: NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "ابتدا وارد حساب کاربری شوید.",
        },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "ADMIN") {
    return {
      response: NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          message: "اجازه مدیریت محصولات را ندارید.",
        },
        { status: 403 }
      ),
    };
  }

  return { response: null };
}

// =========================================
// MEDIA CLEANUP
// =========================================

async function cleanupMediaUrls(urls: string[]) {
  const uniqueUrls = Array.from(
    new Set(
      urls.map((url) => url.trim()).filter(Boolean)
    )
  );

  const results = await Promise.allSettled(
    uniqueUrls.map((url) =>
      deleteMediaIfUnreferenced(url)
    )
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        "Product media cleanup failed:",
        {
          url: uniqueUrls[index],
          error: result.reason,
        }
      );
    }
  });
}

// =========================================
// UPDATE PRODUCT
// =========================================

export async function PATCH(
  request: Request,
  { params }: Props
) {
  try {
    const auth = await requireAdmin();

    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;
    const productId = Number(id);

    if (
      !Number.isInteger(productId) ||
      productId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PRODUCT_ID",
          message: "شناسه محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as UpdateProductBody | null;

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message: "اطلاعات ارسالی معتبر نیست.",
        },
        { status: 400 }
      );
    }

    // اطلاعات اصلی

    const name = cleanText(body.name);
    const slug = cleanText(body.slug);

    if (name.length < 2 || name.length > 160) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_NAME",
          message: "نام محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (
      slug.length < 2 ||
      slug.length > 160 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_SLUG",
          message: "Slug محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body.categoryId !== "number" ||
      !Number.isInteger(body.categoryId) ||
      body.categoryId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CATEGORY",
          message: "دسته‌بندی معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body.price !== "number" ||
      !Number.isSafeInteger(body.price) ||
      body.price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PRICE",
          message: "قیمت محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body.stock !== "number" ||
      !Number.isSafeInteger(body.stock) ||
      body.stock < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_STOCK",
          message: "موجودی محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (typeof body.isAvailable !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_AVAILABILITY",
          message: "وضعیت محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const categoryId = body.categoryId;
    const price = body.price;
    const stock = body.stock;

    // تصویر اصلی

    const mainImage = cleanText(body.mainImage);

    if (!isValidImageReference(mainImage)) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_IMAGE",
          message: "تصویر اصلی معتبر نیست.",
        },
        { status: 400 }
      );
    }

    // پنج تصویر تکمیلی

    const images = normalizeImages(body.images);

    if (!images) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_IMAGES",
          message: "حداکثر پنج تصویر تکمیلی مجاز است.",
        },
        { status: 400 }
      );
    }

    // متن‌های اختصاصی صفحه محصول

    const shortDescription = normalizeOptionalText(
      body.shortDescription,
      TEXT_LIMITS.shortDescription
    );

    const fullDescription = normalizeOptionalText(
      body.fullDescription,
      TEXT_LIMITS.fullDescription
    );

    const leftDescription = normalizeOptionalText(
      body.leftDescription,
      TEXT_LIMITS.leftDescription
    );

    const detailsContent = normalizeOptionalText(
      body.detailsContent,
      TEXT_LIMITS.detailsContent
    );

    const shippingContent = normalizeOptionalText(
      body.shippingContent,
      TEXT_LIMITS.shippingContent
    );

    const englishName = normalizeOptionalText(
      body.englishName,
      TEXT_LIMITS.englishName
    );

    const seriesTitle = normalizeOptionalText(
      body.seriesTitle,
      TEXT_LIMITS.seriesTitle
    );

    const seriesTagline = normalizeOptionalText(
      body.seriesTagline,
      TEXT_LIMITS.seriesTagline
    );

    const material = normalizeOptionalText(
      body.material,
      TEXT_LIMITS.material
    );

    const dimensions = normalizeOptionalText(
      body.dimensions,
      TEXT_LIMITS.dimensions
    );

    const weight = normalizeOptionalText(
      body.weight,
      TEXT_LIMITS.weight
    );

    const textFields = [
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

    if (textFields.some((field) => field === undefined)) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_TEXT",
          message: "یکی از متن‌ها معتبر نیست یا بیش از حد طولانی است.",
        },
        { status: 400 }
      );
    }

    // تگ‌ها

    const tags = normalizeTags(body.tags);

    if (!tags) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_TAGS",
          message: "تگ‌های محصول معتبر نیستند.",
        },
        { status: 400 }
      );
    }

    // بررسی محصول و دسته‌بندی

    const [existingProduct, category] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          mainImage: true,
          images: true,
        },
      }),

      prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      }),
    ]);

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          code: "PRODUCT_NOT_FOUND",
          message: "محصول پیدا نشد.",
        },
        { status: 404 }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          code: "CATEGORY_NOT_FOUND",
          message: "دسته‌بندی پیدا نشد.",
        },
        { status: 400 }
      );
    }

    // ذخیره تغییرات

    const updatedProduct = await prisma.product.update({
      where: { id: productId },

      data: {
        name,
        slug,
        categoryId,
        price,
        stock,
        isAvailable: body.isAvailable,

        mainImage,
        images: JSON.stringify(images),
        tags: JSON.stringify(tags),

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
      },

      // نکته مهم: تمام مقادیر select باید true باشند.
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        isAvailable: true,

        mainImage: true,
        images: true,
        tags: true,

        shortDescription: true,
        fullDescription: true,

        leftDescription: true,
        detailsContent: true,
        shippingContent: true,

        englishName: true,
        seriesTitle: true,
        seriesTagline: true,

        material: true,
        dimensions: true,
        weight: true,

        categoryId: true,
        updatedAt: true,
      },
    });

    // پاک‌سازی تصاویر قدیمی که دیگر استفاده نمی‌شوند

    const previousGallery = parseStoredImages(
      existingProduct.images
    );

    const currentImageUrls = new Set([
      updatedProduct.mainImage,
      ...images,
    ]);

    const cleanupCandidates: string[] = [];

    if (
      existingProduct.mainImage &&
      !currentImageUrls.has(existingProduct.mainImage)
    ) {
      cleanupCandidates.push(existingProduct.mainImage);
    }

    if (previousGallery) {
      for (const oldImage of previousGallery) {
        if (!currentImageUrls.has(oldImage)) {
          cleanupCandidates.push(oldImage);
        }
      }
    }

    if (cleanupCandidates.length > 0) {
      await cleanupMediaUrls(cleanupCandidates);
    }

    return NextResponse.json(
      {
        success: true,
        message: "محصول با موفقیت ویرایش شد.",
        product: {
          ...updatedProduct,
          images,
          tags,
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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "SLUG_ALREADY_EXISTS",
          message: "این Slug قبلاً استفاده شده است.",
        },
        { status: 409 }
      );
    }

    console.error("Admin product update failed:", error);

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "ویرایش محصول با خطا روبه‌رو شد.",
      },
      { status: 500 }
    );
  }
}

// =========================================
// DELETE PRODUCT
// =========================================

export async function DELETE(
  _request: Request,
  { params }: Props
) {
  try {
    const auth = await requireAdmin();

    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;
    const productId = Number(id);

    if (
      !Number.isInteger(productId) ||
      productId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PRODUCT_ID",
          message: "شناسه محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        mainImage: true,
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          code: "PRODUCT_NOT_FOUND",
          message: "محصول پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const galleryImages = parseStoredImages(
      product.images
    );

    await prisma.product.delete({
      where: { id: productId },
    });

    await cleanupMediaUrls([
      product.mainImage,
      ...(galleryImages ?? []),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "محصول با موفقیت حذف شد.",
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "PRODUCT_DELETE_CONFLICT",
          message: "این محصول به اطلاعات دیگری وابسته است.",
        },
        { status: 409 }
      );
    }

    console.error("Admin product deletion failed:", error);

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "حذف محصول با خطا روبه‌رو شد.",
      },
      { status: 500 }
    );
  }
}
