import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";
import CategoryEditFormClient from "./CategoryEditFormClient";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminCategoryEditPage({
  params,
}: Props) {
  const { id } = await params;

  const categoryId = Number(id);

  if (
    !Number.isInteger(categoryId) ||
    categoryId < 1
  ) {
    notFound();
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
    notFound();
  }

  return (
    <div>
      <header
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "24px",
          marginBottom: "28px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              margin: "0 0 7px",
              fontFamily:
                'Georgia, "Times New Roman", serif',
              fontSize: "11px",
              letterSpacing: "0.16em",
              color: "#8a837d",
            }}
          >
            CATEGORY EDITOR
          </p>

          <h1
            style={{
              margin: 0,
              color: "#202020",
              fontSize: "34px",
              fontWeight: 500,
            }}
          >
            ویرایش دسته‌بندی
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#746e68",
              fontSize: "13px",
            }}
          >
            {category.title}
          </p>
        </div>

        <Link
          href="/admin/categories"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            color: "#625c57",
            fontSize: "11px",
            textDecoration: "none",
          }}
        >
          <ArrowRight
            size={14}
            strokeWidth={1.4}
          />

          بازگشت به دسته‌بندی‌ها
        </Link>
      </header>

      <CategoryEditFormClient
        category={{
          id: category.id,
          title: category.title,
          slug: category.slug,
          image: category.image,
          productCount:
            category._count.products,
        }}
      />
    </div>
  );
}