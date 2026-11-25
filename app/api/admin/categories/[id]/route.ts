import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";
import { deleteMediaIfUnreferenced } from "@/app/lib/mediaCleanup";
import { Prisma } from "@/app/generated/prisma/client";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

type UpdateCategoryBody = {
  title?: unknown;
  slug?: unknown;
  image?: unknown;
  objectGroupId?: unknown;
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, code, message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function parseCategoryId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

async function cleanupCategoryImage(imageUrl: string) {
  if (!imageUrl.trim()) return;

  try {
    await deleteMediaIfUnreferenced(imageUrl);
  } catch (error) {
    // A storage cleanup failure must not undo a successful database change.
    console.error("Category media cleanup failed:", { imageUrl, error });
  }
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError(
        "UNAUTHORIZED",
        "برای انجام این عملیات باید وارد حساب کاربری شوید.",
        401
      );
    }

    if (user.role !== "ADMIN") {
      return jsonError("FORBIDDEN", "اجازه ویرایش دسته‌بندی را ندارید.", 403);
    }

    const { id } = await params;
    const categoryId = parseCategoryId(id);

    if (categoryId === null) {
      return jsonError("INVALID_CATEGORY_ID", "شناسه دسته‌بندی معتبر نیست.", 400);
    }

    const body: unknown = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonError("INVALID_REQUEST", "اطلاعات ارسال‌شده معتبر نیست.", 400);
    }

    const data = body as UpdateCategoryBody;
    const title = cleanText(data.title);
    const slug = cleanText(data.slug);
    const image = cleanText(data.image);

    if (title.length < 2 || title.length > 120) {
      return jsonError(
        "INVALID_TITLE",
        "عنوان دسته‌بندی باید بین ۲ تا ۱۲۰ کاراکتر باشد.",
        400
      );
    }

    if (
      slug.length < 2 ||
      slug.length > 120 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      return jsonError(
        "INVALID_SLUG",
        "Slug معتبر نیست. فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است.",
        400
      );
    }

    if (!image || image.length > 1000) {
      return jsonError("INVALID_IMAGE", "تصویر دسته‌بندی معتبر نیست.", 400);
    }

    // Older API clients may omit this field. In that case, retain the existing group.
    // An explicit null clears the link; a positive integer assigns a group.
    const hasGroupField = Object.prototype.hasOwnProperty.call(
      data,
      "objectGroupId"
    );

    let objectGroupId: number | null | undefined;

    if (hasGroupField) {
      if (data.objectGroupId === null) {
        objectGroupId = null;
      } else if (
        typeof data.objectGroupId === "number" &&
        Number.isSafeInteger(data.objectGroupId) &&
        data.objectGroupId > 0
      ) {
        objectGroupId = data.objectGroupId;
      } else {
        return jsonError(
          "INVALID_OBJECT_GROUP",
          "گروه اصلی دسته‌بندی معتبر نیست.",
          400
        );
      }
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, image: true, objectGroupId: true },
    });

    if (!existingCategory) {
      return jsonError("CATEGORY_NOT_FOUND", "دسته‌بندی موردنظر پیدا نشد.", 404);
    }

    if (typeof objectGroupId === "number") {
      const group = await prisma.objectGroup.findUnique({
        where: { id: objectGroupId },
        select: { id: true, isActive: true },
      });

      if (!group) {
        return jsonError("OBJECT_GROUP_NOT_FOUND", "گروه انتخاب‌شده پیدا نشد.", 404);
      }

      if (!group.isActive && existingCategory.objectGroupId !== group.id) {
        return jsonError(
          "OBJECT_GROUP_INACTIVE",
          "گروه انتخاب‌شده غیرفعال است. یک گروه فعال انتخاب کنید.",
          409
        );
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        title,
        slug,
        image,
        ...(hasGroupField ? { objectGroupId } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        objectGroupId: true,
        updatedAt: true,
      },
    });

    if (existingCategory.image !== updatedCategory.image) {
      await cleanupCategoryImage(existingCategory.image);
    }

    return NextResponse.json(
      { success: true, category: updatedCategory },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return jsonError(
          "SLUG_ALREADY_EXISTS",
          "این Slug قبلاً برای دسته‌بندی دیگری استفاده شده است.",
          409
        );
      }
      if (error.code === "P2003") {
        return jsonError(
          "INVALID_OBJECT_GROUP",
          "گروه انتخاب‌شده دیگر وجود ندارد. صفحه را تازه‌سازی کنید.",
          409
        );
      }
      if (error.code === "P2025") {
        return jsonError("CATEGORY_NOT_FOUND", "دسته‌بندی موردنظر پیدا نشد.", 404);
      }
    }

    console.error("Admin category update failed:", error);
    return jsonError("INTERNAL_ERROR", "ویرایش دسته‌بندی با خطا روبه‌رو شد.", 500);
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError(
        "UNAUTHORIZED",
        "برای انجام این عملیات باید وارد حساب کاربری شوید.",
        401
      );
    }

    if (user.role !== "ADMIN") {
      return jsonError("FORBIDDEN", "اجازه حذف دسته‌بندی را ندارید.", 403);
    }

    const { id } = await params;
    const categoryId = parseCategoryId(id);

    if (categoryId === null) {
      return jsonError("INVALID_CATEGORY_ID", "شناسه دسته‌بندی معتبر نیست.", 400);
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return jsonError("CATEGORY_NOT_FOUND", "دسته‌بندی موردنظر پیدا نشد.", 404);
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        {
          success: false,
          code: "CATEGORY_HAS_PRODUCTS",
          message: `این دسته‌بندی ${category._count.products} محصول دارد. ابتدا محصولات آن را به دسته‌بندی دیگری منتقل کنید.`,
          productCount: category._count.products,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });
    await cleanupCategoryImage(category.image);

    return NextResponse.json(
      {
        success: true,
        category: { id: category.id, title: category.title, slug: category.slug },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return jsonError(
          "CATEGORY_HAS_PRODUCTS",
          "این دسته‌بندی به محصول متصل است و تا زمان انتقال محصولات قابل حذف نیست.",
          409
        );
      }
      if (error.code === "P2025") {
        return jsonError("CATEGORY_NOT_FOUND", "دسته‌بندی موردنظر پیدا نشد.", 404);
      }
    }

    console.error("Admin category deletion failed:", error);
    return jsonError("INTERNAL_ERROR", "حذف دسته‌بندی با خطا روبه‌رو شد.", 500);
  }
}
