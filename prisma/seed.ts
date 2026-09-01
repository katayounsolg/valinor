import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const categories = await Promise.all([
    prisma.category.create({ data: { slug: "sabet", title: "قفل ثابت", image: "/images/products/sabet/pink.png" } }),
    prisma.category.create({ data: { slug: "moteharek", title: "قفل متحرک", image: "/images/products/moteharek/green.png" } }),
    prisma.category.create({ data: { slug: "mini", title: "مینی دار", image: "/images/products/mini/yellow.png" } }),
    prisma.category.create({ data: { slug: "baft", title: "بافت", image: "/images/products/baft/navyblue.png" } }),
    prisma.category.create({ data: { slug: "boresh", title: "برش", image: "/images/products/boresh/bozan.png" } }),
    prisma.category.create({ data: { slug: "tikeh", title: "تیکه کاری", image: "/images/products/tikeh/boat.png" } }),
  ]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  await prisma.product.createMany({
    data: [
      { slug: "sabet-banafsh", name: "قفل ثابت بنفش", price: 680000, mainImage: "/images/products/sabet/banafsh.png", categoryId: categoryMap.sabet, stock: 10 },
      { slug: "sabet-banafshtireh", name: "قفل ثابت بنفش تیره", price: 680000, mainImage: "/images/products/sabet/banafshtireh.png", categoryId: categoryMap.sabet, stock: 10 },
      { slug: "sabet-blue", name: "قفل ثابت آبی", price: 680000, mainImage: "/images/products/sabet/blue.png", categoryId: categoryMap.sabet, stock: 10 },
      { slug: "sabet-coffee", name: "قفل ثابت کافی", price: 680000, mainImage: "/images/products/sabet/coffee.png", categoryId: categoryMap.sabet, stock: 10 },
      { slug: "sabet-gray", name: "قفل ثابت طوسی", price: 680000, mainImage: "/images/products/sabet/gray.png", categoryId: categoryMap.sabet, stock: 10 },
      { slug: "sabet-green", name: "قفل ثابت سبز", price: 680000, mainImage: "/images/products/sabet/green.png", categoryId: categoryMap.sabet, stock: 10 },
      { slug: "sabet-kerem", name: "قفل ثابت کرم", price: 680000, mainImage: "/images/products/sabet/kerem.png", categoryId: categoryMap.sabet, stock: 10 },
      { slug: "sabet-marjani", name: "قفل ثابت مرجانی", price: 680000, mainImage: "/images/products/sabet/marjani.png", categoryId: categoryMap.sabet, stock: 10 },
      { slug: "sabet-pink", name: "قفل ثابت صورتی", price: 680000, mainImage: "/images/products/sabet/pink.png", categoryId: categoryMap.sabet, stock: 10 },
      { slug: "sabet-yellow", name: "قفل ثابت زرد", price: 680000, mainImage: "/images/products/sabet/yellow.png", categoryId: categoryMap.sabet, stock: 10 },

      { slug: "moteharek-blue", name: "قفل متحرک آبی", price: 720000, mainImage: "/images/products/moteharek/blue.png", categoryId: categoryMap.moteharek, stock: 10 },
      { slug: "moteharek-dorangkeremghahveee", name: "قفل متحرک دو رنگ کرم قهوه‌ای", price: 720000, mainImage: "/images/products/moteharek/dorangkeremghahveee.png", categoryId: categoryMap.moteharek, stock: 10 },
      { slug: "moteharek-dorangnavyblue", name: "قفل متحرک دو رنگ سرمه‌ای", price: 720000, mainImage: "/images/products/moteharek/dorangnavyblue.png", categoryId: categoryMap.moteharek, stock: 10 },
      { slug: "moteharek-dorangpink", name: "قفل متحرک دو رنگ صورتی", price: 720000, mainImage: "/images/products/moteharek/dorangpink.png", categoryId: categoryMap.moteharek, stock: 10 },
      { slug: "moteharek-dorangred", name: "قفل متحرک دو رنگ قرمز", price: 720000, mainImage: "/images/products/moteharek/dorangred.png", categoryId: categoryMap.moteharek, stock: 10 },
      { slug: "moteharek-gray", name: "قفل متحرک طوسی", price: 720000, mainImage: "/images/products/moteharek/gray.png", categoryId: categoryMap.moteharek, stock: 10 },
      { slug: "moteharek-green", name: "قفل متحرک سبز", price: 720000, mainImage: "/images/products/moteharek/green.png", categoryId: categoryMap.moteharek, stock: 10 },
      { slug: "moteharek-pink", name: "قفل متحرک صورتی", price: 720000, mainImage: "/images/products/moteharek/pink.png", categoryId: categoryMap.moteharek, stock: 10 },
      { slug: "moteharek-sadeh", name: "قفل متحرک ساده", price: 720000, mainImage: "/images/products/moteharek/sadeh.png", categoryId: categoryMap.moteharek, stock: 10 },

      { slug: "mini-blue", name: "مینی دار آبی", price: 760000, mainImage: "/images/products/mini/blue.png", categoryId: categoryMap.mini, stock: 10 },
      { slug: "mini-darkbanafsh", name: "مینی دار بنفش تیره", price: 760000, mainImage: "/images/products/mini/darkbanafsh.png", categoryId: categoryMap.mini, stock: 10 },
      { slug: "mini-gray", name: "مینی دار طوسی", price: 760000, mainImage: "/images/products/mini/gray.png", categoryId: categoryMap.mini, stock: 10 },
      { slug: "mini-green", name: "مینی دار سبز", price: 760000, mainImage: "/images/products/mini/green.png", categoryId: categoryMap.mini, stock: 10 },
      { slug: "mini-kerem", name: "مینی دار کرم", price: 760000, mainImage: "/images/products/mini/kerem.png", categoryId: categoryMap.mini, stock: 10 },
      { slug: "mini-lightbanafsh", name: "مینی دار بنفش روشن", price: 760000, mainImage: "/images/products/mini/lightbanafsh.png", categoryId: categoryMap.mini, stock: 10 },
      { slug: "mini-pink", name: "مینی دار صورتی", price: 760000, mainImage: "/images/products/mini/pink.png", categoryId: categoryMap.mini, stock: 10 },
      { slug: "mini-yellow", name: "مینی دار زرد", price: 760000, mainImage: "/images/products/mini/yellow.png", categoryId: categoryMap.mini, stock: 10 },
      { slug: "mini-zeitooni", name: "مینی دار زیتونی", price: 760000, mainImage: "/images/products/mini/zeitooni.png", categoryId: categoryMap.mini, stock: 10 },

      { slug: "baft-darkbrown", name: "بافت قهوه‌ای تیره", price: 820000, mainImage: "/images/products/baft/darkbrown.png", categoryId: categoryMap.baft, stock: 10 },
      { slug: "baft-darkgreen", name: "بافت سبز تیره", price: 820000, mainImage: "/images/products/baft/darkgreen.png", categoryId: categoryMap.baft, stock: 10 },
      { slug: "baft-green", name: "بافت سبز", price: 820000, mainImage: "/images/products/baft/green.png", categoryId: categoryMap.baft, stock: 10 },
      { slug: "baft-kerem", name: "بافت کرم", price: 820000, mainImage: "/images/products/baft/kerem.png", categoryId: categoryMap.baft, stock: 10 },
      { slug: "baft-lightbrown", name: "بافت قهوه‌ای روشن", price: 820000, mainImage: "/images/products/baft/lightbrown.png", categoryId: categoryMap.baft, stock: 10 },
      { slug: "baft-narenji", name: "بافت نارنجی", price: 820000, mainImage: "/images/products/baft/narenji.png", categoryId: categoryMap.baft, stock: 10 },
      { slug: "baft-navyblue", name: "بافت سرمه‌ای", price: 820000, mainImage: "/images/products/baft/navyblue.png", categoryId: categoryMap.baft, stock: 10 },
      { slug: "baft-verydarkbrown", name: "بافت قهوه‌ای خیلی تیره", price: 820000, mainImage: "/images/products/baft/verydarkbrown.png", categoryId: categoryMap.baft, stock: 10 },

      { slug: "boresh-bozan", name: "برش بُزان", price: 740000, mainImage: "/images/products/boresh/bozan.png", categoryId: categoryMap.boresh, stock: 10 },
      { slug: "boresh-ezhdeha", name: "برش اژدها", price: 740000, mainImage: "/images/products/boresh/ezhdeha.png", categoryId: categoryMap.boresh, stock: 10 },
      { slug: "boresh-homa", name: "برش هما", price: 740000, mainImage: "/images/products/boresh/homa.png", categoryId: categoryMap.boresh, stock: 10 },
      { slug: "boresh-khonejepan", name: "برش خانه ژاپن", price: 740000, mainImage: "/images/products/boresh/khonejepan.png", categoryId: categoryMap.boresh, stock: 10 },
      { slug: "boresh-lotus", name: "برش لوتوس", price: 740000, mainImage: "/images/products/boresh/lotus.png", categoryId: categoryMap.boresh, stock: 10 },

      { slug: "tikeh-boat", name: "تیکه کاری قایق", price: 790000, mainImage: "/images/products/tikeh/boat.png", categoryId: categoryMap.tikeh, stock: 10 },
      { slug: "tikeh-cat", name: "تیکه کاری گربه", price: 790000, mainImage: "/images/products/tikeh/cat.png", categoryId: categoryMap.tikeh, stock: 10 },
      { slug: "tikeh-egg", name: "تیکه کاری تخم مرغ", price: 790000, mainImage: "/images/products/tikeh/egg.png", categoryId: categoryMap.tikeh, stock: 10 },
      { slug: "tikeh-fill", name: "تیکه کاری فیل", price: 790000, mainImage: "/images/products/tikeh/fill.png", categoryId: categoryMap.tikeh, stock: 10 },
      { slug: "tikeh-woman", name: "تیکه کاری زن", price: 790000, mainImage: "/images/products/tikeh/woman.png", categoryId: categoryMap.tikeh, stock: 10 },
    ],
  });

  console.log("Seed completed ✅");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });