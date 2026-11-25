import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";
import { Prisma } from "@/app/generated/prisma/client";

export const runtime = "nodejs";

type CreateCategoryBody = {
  title?: unknown;
  slug?: unknown;
  image?: unknown;
  objectGroupId?: unknown;
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          code: "UNAUTHORIZED",
          message: "برای انجام این عملیات باید وارد حساب کاربری شوید.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          code: "FORBIDDEN",
          message: "اجازه افزودن دسته‌بندی را ندارید.",
        },
        { status: 403 }
      );
    }

    const body: unknown = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_REQUEST",
          message: "اطلاعات ارسال‌شده معتبر نیست.",
        },
        { status: 400 }
      );
    }

    const input = body as CreateCategoryBody;
    const title = cleanText(input.title);
    const slug = cleanText(input.slug);
    const image = cleanText(input.image);

    if (title.length < 2 || title.length > 120) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_TITLE",
          message: "عنوان دسته‌بندی باید بین ۲ تا ۱۲۰ کاراکتر باشد.",
        },
        { status: 400 }
      );
    }

    if (
      slug.length < 2 ||
      slug.length > 120 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_SLUG",
          message: "Slug معتبر نیست. فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است.",
        },
        { status: 400 }
      );
    }

    if (!image || image.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_IMAGE",
          message: "مسیر تصویر دسته‌بندی معتبر نیست.",
        },
        { status: 400 }
      );
    }

    let objectGroupId: number | null = null;

    if (input.objectGroupId !== undefined && input.objectGroupId !== null && input.objectGroupId !== "") {
      const groupId = Number(input.objectGroupId);

      if (!Number.isSafeInteger(groupId) || groupId <= 0) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_OBJECT_GROUP",
            message: "گروه انتخاب‌شده معتبر نیست.",
          },
          { status: 400 }
        );
      }

      const group = await prisma.objectGroup.findUnique({
        where: { id: groupId },
        select: { id: true },
      });

      if (!group) {
        return NextResponse.json(
          {
            success: false,
            code: "OBJECT_GROUP_NOT_FOUND",
            message: "گروه انتخاب‌شده وجود ندارد.",
          },
          { status: 404 }
        );
      }

      objectGroupId = group.id;
    }

    const category = await prisma.category.create({
      data: {
        title,
        slug,
        image,
        objectGroupId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        image: true,
        objectGroupId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, category },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
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
          message: "این Slug قبلاً برای دسته‌بندی دیگری استفاده شده است.",
        },
        { status: 409 }
      );
    }

    console.error("Admin category creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "افزودن دسته‌بندی با خطا روبه‌رو شد.",
      },
      { status: 500 }
    );
  }
}
