
import "dotenv/config";
import { prisma } from "../app/lib/prisma";
import { hashAdminPassword } from "../app/lib/admin-password";

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

function askHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdin.setRawMode) {
      reject(new Error("Please run this script in a terminal."));
      return;
    }

    let answer = "";

    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
    };

    const onData = (data: Buffer) => {
      for (const char of data.toString("utf8")) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Operation cancelled."));
          return;
        }

        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(answer);
          return;
        }

        if (char === "\u007f" || char === "\b") {
          answer = answer.slice(0, -1);
          continue;
        }

        if (char >= " " && char !== "\u007f") {
          answer += char;
        }
      }
    };

    process.stdin.on("data", onData);
  });
}

async function getPassword(adminNumber: number): Promise<string> {
  while (true) {
    const password = await askHidden(
      `رمز عبور مدیر ${adminNumber} را وارد کنید: `
    );

    if (password.length < 12 || password.length > 128) {
      console.log("رمز باید بین ۱۲ تا ۱۲۸ کاراکتر باشد.");
      continue;
    }

    const confirmation = await askHidden(
      `رمز مدیر ${adminNumber} را دوباره وارد کنید: `
    );

    if (password !== confirmation) {
      console.log("دو رمز یکسان نیستند. دوباره تلاش کنید.");
      continue;
    }

    return password;
  }
}

async function main() {
  const rawPhones = [
    process.env.ADMIN_PHONE_1,
    process.env.ADMIN_PHONE_2,
  ];

  if (rawPhones.some((phone) => !phone)) {
    throw new Error(
      "ADMIN_PHONE_1 و ADMIN_PHONE_2 باید در فایل .env تنظیم شده باشند."
    );
  }

  const phones = rawPhones.map((phone) =>
    normalizePhone(phone!)
  );

  if (
    phones.some((phone) => !/^09\d{9}$/.test(phone)) ||
    phones[0] === phones[1]
  ) {
    throw new Error("شماره مدیران نامعتبر یا تکراری است.");
  }

  const existingUsers = await prisma.user.findMany({
    where: {
      phone: {
        in: phones,
      },
    },
    select: {
      phone: true,
    },
  });

  if (existingUsers.length > 0) {
    throw new Error(
      "حداقل یکی از شماره‌ها قبلاً در دیتابیس ثبت شده است. هیچ تغییری انجام نشد."
    );
  }

  console.log("\nساخت دو حساب مدیر");
  console.log("رمزها حداقل باید ۱۲ کاراکتر باشند.");
  console.log("هنگام واردکردن رمز، کاراکترها نمایش داده نمی‌شوند.\n");

  const password1 = await getPassword(1);
  const password2 = await getPassword(2);

  const hash1 = await hashAdminPassword(password1);
  const hash2 = await hashAdminPassword(password2);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        phone: phones[0],
        role: "ADMIN",
        passwordHash: hash1,
      },
    }),
    prisma.user.create({
      data: {
        phone: phones[1],
        role: "ADMIN",
        passwordHash: hash2,
      },
    }),
  ]);

  console.log("\nهر دو حساب مدیر با موفقیت ایجاد شدند.");
}

main()
  .catch((error) => {
    console.error("\nخطا:", error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
