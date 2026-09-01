import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";
import { deleteMediaIfUnreferenced } from "@/app/lib/mediaCleanup";
import { Prisma } from "@/app/generated/prisma/client";

type Props = {
  params: Promise<{
    id: string;
  }>;
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
};

const MAX_GALLERY_IMAGES = 12;
const MAX_IMAGE_URL_LENGTH = 1000;

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isValidImageReference(
  value: string
) {
  if (
    !value ||
    value.length >
      MAX_IMAGE_URL_LENGTH
  ) {
    return false;
  }

  /*
    تصاویر قدیمی local را هم فعلاً
    پشتیبانی می‌کنیم.
  */
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

function normalizeImages(
  value: unknown
): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const images: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return null;
    }

    const image = item.trim();

    if (!image) {
      continue;
    }

    if (
      !isValidImageReference(image)
    ) {
      return null;
    }

    if (!images.includes(image)) {
      images.push(image);
    }
  }

  if (
    images.length >
    MAX_GALLERY_IMAGES
  ) {
    return null;
  }

  return images;
}

function parseStoredImages(
  value: string
): string[] | null {
  try {
    const parsed =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return null;
    }

    const images: string[] = [];

    for (const item of parsed) {
      if (typeof item !== "string") {
        return null;
      }

      const image = item.trim();

      if (
        image &&
        !images.includes(image)
      ) {
        images.push(image);
      }
    }

    return images;
  } catch {
    return null;
  }
}

/*
  Cleanup نباید موفقیت عملیات اصلی
  محصول را خراب کند.

  اگر Storage موقتاً در دسترس نباشد،
  تغییر دیتابیس همچنان معتبر می‌ماند.
*/
async function cleanupMediaUrls(
  urls: string[]
) {
  const uniqueUrls =
    Array.from(
      new Set(
        urls
          .map((url) =>
            url.trim()
          )
          .filter(Boolean)
      )
    );

  const results =
    await Promise.allSettled(
      uniqueUrls.map((url) =>
        deleteMediaIfUnreferenced(
          url
        )
      )
    );

  results.forEach(
    (result, index) => {
      if (
        result.status ===
        "rejected"
      ) {
        console.error(
          "Product media cleanup failed:",
          {
            url:
              uniqueUrls[index],
            error:
              result.reason,
          }
        );
      }
    }
  );
}

/*
  =========================================================
  UPDATE PRODUCT
  =========================================================
*/

export async function PATCH(
  request: Request,
  { params }: Props
) {
  try {
    const user =
      await getCurrentUser();

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
            "اجازه ویرایش محصولات را ندارید.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    const productId = Number(id);

    if (
      !Number.isInteger(
        productId
      ) ||
      productId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "INVALID_PRODUCT_ID",
          message:
            "شناسه محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as
      | UpdateProductBody
      | null;

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          code:
            "INVALID_REQUEST",
          message:
            "اطلاعات ارسال‌شده معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const name =
      cleanText(body.name);

    const slug =
      cleanText(body.slug);

    const mainImage =
      cleanText(
        body.mainImage
      );

    /*
      مقدار خالی نباید به‌طور ضمنی
      به صفر تبدیل شود.
    */
    if (
      typeof body.categoryId !==
        "number" ||
      !Number.isInteger(
        body.categoryId
      ) ||
      body.categoryId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "INVALID_CATEGORY",
          message:
            "دسته‌بندی انتخاب‌شده معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body.price !==
        "number" ||
      !Number.isSafeInteger(
        body.price
      ) ||
      body.price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "INVALID_PRICE",
          message:
            "قیمت محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body.stock !==
        "number" ||
      !Number.isSafeInteger(
        body.stock
      ) ||
      body.stock < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "INVALID_STOCK",
          message:
            "موجودی محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const categoryId =
      body.categoryId;

    const price = body.price;
    const stock = body.stock;

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
          code:
            "INVALID_SLUG",
          message:
            "Slug محصول معتبر نیست. فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است.",
        },
        { status: 400 }
      );
    }

    if (
      !isValidImageReference(
        mainImage
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "INVALID_IMAGE",
          message:
            "تصویر اصلی محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    let images:
      | string[]
      | undefined;

    if (
      body.images !== undefined
    ) {
      const normalizedImages =
        normalizeImages(
          body.images
        );

      if (!normalizedImages) {
        return NextResponse.json(
          {
            success: false,
            code:
              "INVALID_IMAGES",
            message:
              `تصاویر تکمیلی معتبر نیستند. حداکثر ${MAX_GALLERY_IMAGES} تصویر مجاز است.`,
          },
          { status: 400 }
        );
      }

      images =
        normalizedImages;
    }

    if (
      body.isAvailable !==
        undefined &&
      typeof body.isAvailable !==
        "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "INVALID_AVAILABILITY",
          message:
            "وضعیت نمایش محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      اطلاعات قبلی تصاویر را هم می‌گیریم
      تا بعد از UPDATE بفهمیم کدام فایل‌ها
      واقعاً حذف شده‌اند.
    */
    const [
      existingProduct,
      category,
    ] = await Promise.all([
      prisma.product.findUnique({
        where: {
          id: productId,
        },

        select: {
          id: true,
          mainImage: true,
          images: true,
        },
      }),

      prisma.category.findUnique({
        where: {
          id: categoryId,
        },

        select: {
          id: true,
        },
      }),
    ]);

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          code:
            "PRODUCT_NOT_FOUND",
          message:
            "محصول موردنظر پیدا نشد.",
        },
        { status: 404 }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          code:
            "CATEGORY_NOT_FOUND",
          message:
            "دسته‌بندی انتخاب‌شده وجود ندارد.",
        },
        { status: 400 }
      );
    }

    const previousGallery =
      parseStoredImages(
        existingProduct.images
      );

    /*
      اول دیتابیس را به وضعیت جدید
      می‌بریم.
    */
    const updatedProduct =
      await prisma.product.update({
        where: {
          id: productId,
        },

        data: {
          name,
          slug,
          categoryId,
          price,
          stock,
          mainImage,

          ...(images !==
          undefined
            ? {
                images:
                  JSON.stringify(
                    images
                  ),
              }
            : {}),

          ...(typeof body.isAvailable ===
          "boolean"
            ? {
                isAvailable:
                  body.isAvailable,
              }
            : {}),
        },

        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stock: true,
          isAvailable: true,
          mainImage: true,
          images: true,
          categoryId: true,
          updatedAt: true,
        },
      });

    let parsedImages:
      string[] = [];

    try {
      const parsed =
        JSON.parse(
          updatedProduct.images
        );

      if (
        Array.isArray(parsed)
      ) {
        parsedImages =
          parsed.filter(
            (
              item
            ): item is string =>
              typeof item ===
              "string"
          );
      }
    } catch {
      parsedImages = [];
    }

    /*
      =====================================================
      CLEANUP REMOVED MEDIA
      =====================================================

      بعد از موفقیت UPDATE:

      - تصویر اصلی قبلی
      - تصاویر قبلی گالری

      را با وضعیت جدید مقایسه می‌کنیم.
    */

    const currentImageUrls =
      new Set([
        updatedProduct.mainImage,
        ...parsedImages,
      ]);

    const cleanupCandidates:
      string[] = [];

    /*
      تصویر اصلی قدیمی فقط زمانی کاندید
      حذف است که دیگر در فرم جدید حضور
      نداشته باشد.
    */
    if (
      existingProduct.mainImage &&
      !currentImageUrls.has(
        existingProduct.mainImage
      )
    ) {
      cleanupCandidates.push(
        existingProduct.mainImage
      );
    }

    /*
      اگر JSON گالری قبلی سالم باشد،
      فایل‌های حذف‌شده را پیدا می‌کنیم.

      اگر JSON خراب باشد، محافظه‌کارانه
      چیزی از آن حذف نمی‌کنیم.
    */
    if (previousGallery) {
      for (
        const previousImage of
        previousGallery
      ) {
        if (
          !currentImageUrls.has(
            previousImage
          )
        ) {
          cleanupCandidates.push(
            previousImage
          );
        }
      }
    }

    /*
      Helper دوباره کل دیتابیس را بررسی
      می‌کند؛ بنابراین اگر همین تصویر در
      محصول یا دسته‌بندی دیگری استفاده شده
      باشد، فایل از Storage پاک نمی‌شود.
    */
    if (
      cleanupCandidates.length >
      0
    ) {
      await cleanupMediaUrls(
        cleanupCandidates
      );
    }

    return NextResponse.json(
      {
        success: true,

        product: {
          id:
            updatedProduct.id,
          name:
            updatedProduct.name,
          slug:
            updatedProduct.slug,
          price:
            updatedProduct.price,
          stock:
            updatedProduct.stock,
          isAvailable:
            updatedProduct.isAvailable,
          mainImage:
            updatedProduct.mainImage,
          images:
            parsedImages,
          categoryId:
            updatedProduct.categoryId,
          updatedAt:
            updatedProduct.updatedAt,
        },
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
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "SLUG_ALREADY_EXISTS",
          message:
            "این Slug قبلاً برای محصول دیگری استفاده شده است.",
        },
        { status: 409 }
      );
    }

    console.error(
      "Admin product update failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code:
          "INTERNAL_ERROR",
        message:
          "ویرایش محصول با خطا روبه‌رو شد.",
      },
      { status: 500 }
    );
  }
}

/*
  =========================================================
  DELETE PRODUCT
  =========================================================

  فعلاً منطق حذف Storage را اینجا
  اضافه نمی‌کنیم؛ قدم بعدی دقیقاً همین است.
*/

export async function DELETE(
  _request: Request,
  { params }: Props
) {
  try {
    const user =
      await getCurrentUser();

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
            "اجازه حذف محصولات را ندارید.",
        },
        { status: 403 }
      );
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
          message:
            "شناسه محصول معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      قبل از حذف محصول، URL تمام تصاویر
      آن را نگه می‌داریم.

      بعد از حذف DB بررسی می‌کنیم آیا
      هنوز جای دیگری به آن‌ها reference
      وجود دارد یا نه.
    */
    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },

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
          message:
            "محصول موردنظر پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const galleryImages =
      parseStoredImages(
        product.images
      );

    /*
      اول محصول از دیتابیس حذف می‌شود.

      این ترتیب مهم است؛ چون تا زمانی
      که محصول هنوز وجود دارد، helper
      تصویر را IN_USE تشخیص می‌دهد.
    */
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    /*
      بعد از موفقیت حذف DB، تصاویر
      کاندید cleanup می‌شوند.

      اگر یک تصویر در محصول یا
      دسته‌بندی دیگری استفاده شده باشد،
      deleteMediaIfUnreferenced آن را
      از Storage حذف نمی‌کند.
    */
    const cleanupCandidates = [
      product.mainImage,

      ...(galleryImages ?? []),
    ];

    await cleanupMediaUrls(
      cleanupCandidates
    );

    return NextResponse.json(
      {
        success: true,

        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
        },
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
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "PRODUCT_DELETE_CONFLICT",
          message:
            "این محصول به اطلاعات دیگری وابسته است و فعلاً امکان حذف دائمی آن وجود ندارد.",
        },
        { status: 409 }
      );
    }

    console.error(
      "Admin product deletion failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message:
          "حذف محصول با خطا روبه‌رو شد.",
      },
      { status: 500 }
    );
  }
}