
import "dotenv/config";
import { prisma } from "../app/lib/prisma";

function normalizePhone(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  let phone = value
    .replace(/[۰-۹]/g, (digit) =>
      String(persianDigits.indexOf(digit))
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(arabicDigits.indexOf(digit))
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(arabicDigits.indexOf(digit))
    )
    .replace(/\D/g, "");

  if (phone.startsWith("0098")) {
    phone = "0" + phone.slice(4);
  } else if (phone.startsWith("98")) {
    phone = "0" + phone.slice(2);
  } else if (phone.length === 10 && phone.startsWith("9")) {
    phone = "0" + phone;
  }

  return phone;
}

async function main() {
  const rawPhones = [
    process.env.ADMIN_PHONE_1,
    process.env.ADMIN_PHONE_2,
  ];

  if (rawPhones.some((phone) => !phone)) {
    throw new Error("ADMIN_PHONE_1 and ADMIN_PHONE_2 must be set in .env");
  }

  const phones = rawPhones.map((phone) =>
    normalizePhone(phone!)
  );

  if (
    phones.some((phone) => !/^09\d{9}$/.test(phone)) ||
    phones[0] === phones[1]
  ) {
    throw new Error("Admin phone numbers are invalid or duplicated.");
  }

  for (let index = 0; index < phones.length; index++) {
    const phone = phones[index];

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    console.log(`\nمدیر ${index + 1}:`);

    if (!user) {
      console.log("حساب کاربری وجود ندارد.");
      continue;
    }

    console.log("حساب کاربری وجود دارد.");
    console.log("نقش:", user.role);
    console.log(
      "رمز عبور:",
      user.passwordHash ? "ثبت شده" : "ثبت نشده"
    );
  }
}

main()
  .catch((error) => {
    console.error("خطا:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
