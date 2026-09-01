import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";
import ProductEditFormClient from "./ProductEditFormClient";
import styles from "./page.module.css";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function parseProductImages(
  value: string
): string[] {
  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is string =>
          typeof item === "string"
      )
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export default async function AdminProductEditPage({
  params,
}: Props) {
  const { id } = await params;

  const productId = Number(id);

  if (
    !Number.isInteger(productId) ||
    productId < 1
  ) {
    notFound();
  }

  const [product, categories] =
    await Promise.all([
      prisma.product.findUnique({
        where: {
          id: productId,
        },

        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stock: true,
          isAvailable: true,
          mainImage: true,

          /*
            در دیتابیس به‌صورت JSON String
            ذخیره شده است.
          */
          images: true,

          categoryId: true,

          category: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),

      prisma.category.findMany({
        orderBy: {
          title: "asc",
        },

        select: {
          id: true,
          title: true,
          slug: true,
        },
      }),
    ]);

  if (!product) {
    notFound();
  }

  /*
    Prisma فیلد images را String برمی‌گرداند،
    ولی فرم ویرایش باید آرایه واقعی دریافت کند.
  */
  const parsedImages =
    parseProductImages(
      product.images
    );

  /*
    عمداً یک متغیر جدا می‌سازیم تا در مرحله
    بعد ProductEditFormClient بتواند images
    را به‌صورت string[] دریافت کند.
  */
  const productForForm = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    stock: product.stock,
    isAvailable:
      product.isAvailable,
    mainImage:
      product.mainImage,
    images: parsedImages,
    categoryId:
      product.categoryId,

    category: {
      id: product.category.id,
      title:
        product.category.title,
      slug:
        product.category.slug,
    },
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div
          className={styles.headerText}
        >
          <p
            className={styles.eyebrow}
          >
            PRODUCT EDITOR
          </p>

          <h1
            className={styles.title}
          >
            ویرایش محصول
          </h1>

          <p
            className={
              styles.description
            }
          >
            {product.name}
          </p>
        </div>

        <Link
          href="/admin/products"
          className={styles.backLink}
        >
          <ArrowRight
            size={14}
            strokeWidth={1.4}
          />

          بازگشت به محصولات
        </Link>
      </header>

      <ProductEditFormClient
        product={productForForm}
        categories={categories}
      />
    </div>
  );
}