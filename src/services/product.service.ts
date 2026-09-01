import { prisma } from "@/app/lib/prisma";

export const productService = {
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

  async getCategoryBySlug(categorySlug: string) {
    return prisma.category.findUnique({
      where: {
        slug: categorySlug,
      },
    });
  },

  async getProductBySlug(slug: string) {
    return prisma.product.findUnique({
      where: {
        slug,
      },
      include: {
        category: true,
      },
    });
  },

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