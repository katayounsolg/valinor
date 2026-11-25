
import { prisma } from "@/app/lib/prisma";

export const productService = {
  // =========================================
  // دریافت محصولات یک دسته‌بندی
  // =========================================

  async getProductsByCategory(categorySlug: string) {
    return prisma.product.findMany({
      where: {
        category: {
          slug: categorySlug,
        },
        isAvailable: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  // =========================================
  // دریافت اطلاعات یک دسته‌بندی
  // =========================================

  async getCategoryBySlug(categorySlug: string) {
    return prisma.category.findUnique({
      where: {
        slug: categorySlug,
      },
    });
  },

  // =========================================
  // دریافت کامل اطلاعات محصول
  // برای صفحه جزئیات محصول
  // =========================================

  async getProductBySlug(slug: string) {
    return prisma.product.findUnique({
      where: {
        slug,
      },

      select: {
        // شناسه و اطلاعات اصلی
        id: true,
        name: true,
        slug: true,

        // توضیحات
        shortDescription: true,
        fullDescription: true,

        // ستون سمت چپ
        leftDescription: true,
        detailsContent: true,
        shippingContent: true,

        // ستون سمت راست
        englishName: true,
        seriesTitle: true,
        seriesTagline: true,

        // قیمت
        price: true,

        // تصاویر
        mainImage: true,
        images: true,

        // موجودی و وضعیت
        stock: true,
        isAvailable: true,

        // تگ‌ها
        tags: true,

        // مشخصات فیزیکی
        material: true,
        dimensions: true,
        weight: true,

        // دسته‌بندی
        category: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },

        // تاریخ‌ها
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  // =========================================
  // دریافت تمام دسته‌بندی‌ها
  // =========================================

  async getAllCategories() {
    return prisma.category.findMany({
      include: {
        products: true,
      },
      orderBy: {
        id: "asc",
      },
    });
  },
};
