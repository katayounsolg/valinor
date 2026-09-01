import {
  createHmac,
  randomInt,
} from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

const OTP_EXPIRY_MINUTES = 5;

const RESEND_COOLDOWN_SECONDS = 60;

const MAX_SENDS_PER_HOUR = 5;

const MAX_SENDS_PER_DAY = 10;

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String(
        "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
      )
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(
        "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
      )
    );
}

function normalizeIranPhone(
  input: string
) {
  const normalized =
    normalizeDigits(input.trim());

  const digits =
    normalized.replace(/\D/g, "");

  if (
    digits.startsWith("0098") &&
    digits.length === 14
  ) {
    return `0${digits.slice(4)}`;
  }

  if (
    digits.startsWith("98") &&
    digits.length === 12
  ) {
    return `0${digits.slice(2)}`;
  }

  if (
    digits.startsWith("9") &&
    digits.length === 10
  ) {
    return `0${digits}`;
  }

  return digits;
}

function getOtpSecret() {
  const secret =
    process.env.OTP_HASH_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "OTP_HASH_SECRET is not configured."
    );
  }

  if (secret.length < 32) {
    throw new Error(
      "OTP_HASH_SECRET must be at least 32 characters."
    );
  }

  return secret;
}

function hashOtp(
  phone: string,
  code: string
) {
  return createHmac(
    "sha256",
    getOtpSecret()
  )
    .update(`${phone}:${code}`)
    .digest("hex");
}

function generateOtp() {
  return randomInt(
    100000,
    1000000
  ).toString();
}

async function deliverOtp(
  phone: string,
  code: string
) {
  /*
    تا وقتی پنل ملی پیامک تأیید نشده،
    فقط در محیط Development اجازه تست داریم.

    وقتی API ملی پیامک آماده شد،
    همین تابع را به سرویس SMS واقعی وصل می‌کنیم.
  */

  if (
    process.env.NODE_ENV !==
      "production" &&
    process.env.OTP_DEV_MODE ===
      "true"
  ) {
    console.log(
      `[VALINOR DEV OTP] ${phone}: ${code}`
    );

    return;
  }

  throw new Error(
    "SMS_PROVIDER_NOT_CONFIGURED"
  );
}

function setPendingPhoneCookie(
  response: NextResponse,
  phone: string
) {
  response.cookies.set(
    "valinor_pending_phone",
    phone,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge:
        OTP_EXPIRY_MINUTES *
        60,
    }
  );

  response.headers.set(
    "Cache-Control",
    "no-store"
  );
}

export async function POST(
  request: Request
) {
  try {
    const contentType =
      request.headers.get(
        "content-type"
      ) || "";

    const accept =
      request.headers.get(
        "accept"
      ) || "";

    let rawPhone = "";

    let isFormSubmit = false;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      const body = await request
        .json()
        .catch(() => ({}));

      rawPhone = String(
        body.phone ||
          body.mobile ||
          body.phoneNumber ||
          ""
      );
    } else {
      const formData =
        await request
          .formData()
          .catch(() => null);

      if (formData) {
        rawPhone = String(
          formData.get("phone") ||
            formData.get("mobile") ||
            formData.get(
              "phoneNumber"
            ) ||
            ""
        );

        isFormSubmit = true;
      }
    }

    const phone =
      normalizeIranPhone(
        rawPhone
      );

    if (!phone) {
      return NextResponse.json(
        {
          success: false,

          code:
            "PHONE_REQUIRED",

          message:
            "شماره موبایل وارد نشده است.",
        },
        { status: 400 }
      );
    }

    if (
      !/^09\d{9}$/.test(phone)
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "INVALID_PHONE",

          message:
            "شماره موبایل معتبر نیست.",
        },
        { status: 400 }
      );
    }

    /*
      قبل از ادامه، وجود Secret
      بررسی می‌شود تا هیچ‌وقت
      OTP خام در دیتابیس نرود.
    */
    getOtpSecret();

    const now = new Date();

    const cooldownSince =
      new Date(
        now.getTime() -
          RESEND_COOLDOWN_SECONDS *
            1000
      );

    const oneHourAgo =
      new Date(
        now.getTime() -
          60 * 60 * 1000
      );

    const oneDayAgo =
      new Date(
        now.getTime() -
          24 *
            60 *
            60 *
            1000
      );

    const [
      lastOtp,
      sendsLastHour,
      sendsLastDay,
    ] = await Promise.all([
      prisma.otpCode.findFirst({
        where: {
          phone,

          createdAt: {
            gte: cooldownSince,
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        select: {
          createdAt: true,
        },
      }),

      prisma.otpCode.count({
        where: {
          phone,

          createdAt: {
            gte: oneHourAgo,
          },
        },
      }),

      prisma.otpCode.count({
        where: {
          phone,

          createdAt: {
            gte: oneDayAgo,
          },
        },
      }),
    ]);

    if (lastOtp) {
      const elapsedSeconds =
        Math.floor(
          (now.getTime() -
            lastOtp.createdAt.getTime()) /
            1000
        );

      const retryAfter =
        Math.max(
          1,
          RESEND_COOLDOWN_SECONDS -
            elapsedSeconds
        );

      return NextResponse.json(
        {
          success: false,

          code:
            "OTP_COOLDOWN",

          message:
            "لطفاً کمی صبر کنید و سپس دوباره درخواست کد بدهید.",

          retryAfter,
        },
        {
          status: 429,

          headers: {
            "Retry-After":
              String(
                retryAfter
              ),

            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (
      sendsLastHour >=
      MAX_SENDS_PER_HOUR
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "OTP_HOURLY_LIMIT",

          message:
            "تعداد درخواست‌های کد تأیید بیش از حد مجاز است. لطفاً بعداً دوباره تلاش کنید.",
        },
        {
          status: 429,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (
      sendsLastDay >=
      MAX_SENDS_PER_DAY
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "OTP_DAILY_LIMIT",

          message:
            "تعداد درخواست‌های امروز بیش از حد مجاز است. لطفاً بعداً دوباره تلاش کنید.",
        },
        {
          status: 429,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const otp =
      generateOtp();

    const otpHash =
      hashOtp(
        phone,
        otp
      );

    const expiresAt =
      new Date(
        Date.now() +
          OTP_EXPIRY_MINUTES *
            60 *
            1000
      );

    /*
      ابتدا رکورد OTP را می‌سازیم.
      اگر ارسال SMS شکست بخورد،
      همین رکورد حذف می‌شود.
    */
    const createdOtp =
      await prisma.otpCode.create({
        data: {
          phone,

          code: otpHash,

          expiresAt,

          used: false,
        },

        select: {
          id: true,
        },
      });

    try {
      await deliverOtp(
        phone,
        otp
      );
    } catch (error) {
      await prisma.otpCode
        .delete({
          where: {
            id: createdOtp.id,
          },
        })
        .catch(
          (cleanupError) => {
            console.error(
              "Failed to remove unsent OTP:",
              cleanupError
            );
          }
        );

      if (
        error instanceof Error &&
        error.message ===
          "SMS_PROVIDER_NOT_CONFIGURED"
      ) {
        return NextResponse.json(
          {
            success: false,

            code:
              "SMS_NOT_CONFIGURED",

            message:
              "سرویس پیامک هنوز فعال نشده است.",
          },
          {
            status: 503,

            headers: {
              "Cache-Control":
                "no-store",
            },
          }
        );
      }

      console.error(
        "OTP delivery failed:",
        error
      );

      return NextResponse.json(
        {
          success: false,

          code:
            "SMS_DELIVERY_FAILED",

          message:
            "ارسال کد تأیید با خطا روبه‌رو شد. لطفاً دوباره تلاش کنید.",
        },
        {
          status: 503,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    /*
      بعد از ارسال موفق،
      OTPهای قبلی همان شماره
      دیگر معتبر نیستند.
    */
    await prisma.otpCode.updateMany({
      where: {
        phone,

        id: {
          not: createdOtp.id,
        },

        used: false,
      },

      data: {
        used: true,
      },
    });

    const verifyUrl =
      new URL(
        "/login/verify",
        request.url
      );

    verifyUrl.searchParams.set(
      "phone",
      phone
    );

    const shouldRedirect =
      isFormSubmit ||
      accept.includes(
        "text/html"
      );

    if (shouldRedirect) {
      const response =
        NextResponse.redirect(
          verifyUrl,
          303
        );

      setPendingPhoneCookie(
        response,
        phone
      );

      return response;
    }

    const response =
      NextResponse.json(
        {
          success: true,

          message:
            "کد تأیید ارسال شد.",

          phone,

          expiresIn:
            OTP_EXPIRY_MINUTES *
            60,
        },
        {
          status: 200,
        }
      );

    setPendingPhoneCookie(
      response,
      phone
    );

    return response;
  } catch (error) {
    console.error(
      "OTP request failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        code:
          "OTP_REQUEST_FAILED",

        message:
          "امکان ارسال کد تأیید وجود ندارد. لطفاً دوباره تلاش کنید.",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}