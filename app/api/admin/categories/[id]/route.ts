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

type UpdateCategoryBody = {
  title?: unknown;
  slug?: unknown;
  image?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

async function cleanupCategoryImage(
  imageUrl: string
) {
  if (!imageUrl.trim()) {
    return;
  }

  try {
    await deleteMediaIfUnreferenced(
      imageUrl
    );
  } catch (error) {
    /*
      خطای Storage نباید ویرایش یا حذف
      موفق دیتابیس را خراب کند.
    */
    console.error(
      "Category media cleanup failed:",
      {
        imageUrl,
        error,
      }
    );
  }
}

/*
  =========================================================
  UPDATE CATEGORY
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
            "اجازه ویرایش دسته‌بندی را ندارید.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    const categoryId = Number(id);

    if (
      !Number.isInteger(categoryId) ||
      categoryId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CATEGORY_ID",
          message:
            "شناسه دسته‌بندی معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as
      | UpdateCategoryBody
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

    const title =
      cleanText(body.title);

    const slug =
      cleanText(body.slug);

    const image =
      cleanText(body.image);

    if (
      title.length < 2 ||
      title.length > 120
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_TITLE",
          message:
            "عنوان دسته‌بندی باید بین ۲ تا ۱۲۰ کاراکتر باشد.",
        },
        { status: 400 }
      );
    }

    if (
      slug.length < 2 ||
      slug.length > 120 ||
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

    if (
      !image ||
      image.length > 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_IMAGE",
          message:
            "تصویر دسته‌بندی معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      تصویر قبلی را نگه می‌داریم تا
      بعد از UPDATE بتوانیم cleanup کنیم.
    */
    const existingCategory =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },

        select: {
          id: true,
          image: true,
        },
      });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          code: "CATEGORY_NOT_FOUND",
          message:
            "دسته‌بندی موردنظر پیدا نشد.",
        },
        { status: 404 }
      );
    }

    const updatedCategory =
      await prisma.category.update({
        where: {
          id: categoryId,
        },

        data: {
          title,
          slug,
          image,
        },

        select: {
          id: true,
          title: true,
          slug: true,
          image: true,
          updatedAt: true,
        },
      });

    /*
      فقط بعد از موفقیت دیتابیس،
      تصویر قبلی را برای حذف بررسی می‌کنیم.
    */
    if (
      existingCategory.image !==
      updatedCategory.image
    ) {
      await cleanupCategoryImage(
        existingCategory.image
      );
    }

    return NextResponse.json(
      {
        success: true,
        category:
          updatedCategory,
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
            "این Slug قبلاً برای دسته‌بندی دیگری استفاده شده است.",
        },
        { status: 409 }
      );
    }

    console.error(
      "Admin category update failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message:
          "ویرایش دسته‌بندی با خطا روبه‌رو شد.",
      },
      { status: 500 }
    );
  }
}

/*
  =========================================================
  DELETE CATEGORY
  =========================================================
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
            "اجازه حذف دسته‌بندی را ندارید.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    const categoryId = Number(id);

    if (
      !Number.isInteger(categoryId) ||
      categoryId < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_CATEGORY_ID",
          message:
            "شناسه دسته‌بندی معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const category =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },

        select: {
          id: true,
          title: true,
          slug: true,
          image: true,

          _count: {
            select: {
              products: true,
            },
          },
        },
      });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          code: "CATEGORY_NOT_FOUND",
          message:
            "دسته‌بندی موردنظر پیدا نشد.",
        },
        { status: 404 }
      );
    }

    /*
      دسته‌بندی دارای محصول قابل حذف نیست.
    */
    if (
      category._count.products > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "CATEGORY_HAS_PRODUCTS",

          message:
            `این دسته‌بندی ${category._count.products} محصول دارد. ابتدا محصولات آن را به دسته‌بندی دیگری منتقل کنید.`,

          productCount:
            category._count.products,
        },
        { status: 409 }
      );
    }

    /*
      اول دیتابیس حذف می‌شود.
    */
    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });

    /*
      حالا تصویر قبلی دیگر reference
      دسته‌بندی حذف‌شده را ندارد.

      Helper بررسی می‌کند که آیا جای
      دیگری هنوز از آن استفاده می‌شود یا نه.
    */
    await cleanupCategoryImage(
      category.image
    );

    return NextResponse.json(
      {
        success: true,

        category: {
          id: category.id,
          title: category.title,
          slug: category.slug,
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
    /*
      دفاع دوم در سطح دیتابیس:
      اگر همزمان محصولی به دسته‌بندی
      متصل شده باشد Restrict مانع حذف می‌شود.
    */
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          success: false,
          code:
            "CATEGORY_HAS_PRODUCTS",
          message:
            "این دسته‌بندی به محصول متصل است و تا زمان انتقال محصولات قابل حذف نیست.",
        },
        { status: 409 }
      );
    }

    console.error(
      "Admin category deletion failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message:
          "حذف دسته‌بندی با خطا روبه‌رو شد.",
      },
      { status: 500 }
    );
  }
}