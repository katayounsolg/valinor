import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

const SESSION_DURATION_DAYS = 30;
const MAX_VERIFY_ATTEMPTS = 5;

type VerifyBody = {
  phone?: unknown;
  code?: unknown;
  otp?: unknown;
  verificationCode?: unknown;
};

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

function normalizeOtp(
  input: string
) {
  return normalizeDigits(input)
    .replace(/\D/g, "")
    .trim();
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

function safelyCompareHashes(
  storedHash: string,
  submittedHash: string
) {
  /*
    OTPهای قدیمی پروژه ممکن است هنوز
    "123456" باشند؛ بنابراین قبل از
    timingSafeEqual طول و فرمت را چک می‌کنیم.
  */
  if (
    !/^[a-f0-9]{64}$/i.test(
      storedHash
    ) ||
    !/^[a-f0-9]{64}$/i.test(
      submittedHash
    )
  ) {
    return false;
  }

  const storedBuffer =
    Buffer.from(
      storedHash,
      "hex"
    );

  const submittedBuffer =
    Buffer.from(
      submittedHash,
      "hex"
    );

  if (
    storedBuffer.length !==
    submittedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    storedBuffer,
    submittedBuffer
  );
}

function generateSessionToken() {
  return randomBytes(32)
    .toString("base64url");
}

function hashSessionToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function clearPendingPhone(
  response: NextResponse
) {
  response.cookies.set(
    "valinor_pending_phone",
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    }
  );
}

function setSessionCookie(
  response: NextResponse,
  sessionToken: string,
  expiresAt: Date
) {
  response.cookies.set(
    "valinor_session",
    sessionToken,
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      expires: expiresAt,

      maxAge:
        SESSION_DURATION_DAYS *
        24 *
        60 *
        60,
    }
  );

  response.headers.set(
    "Cache-Control",
    "no-store"
  );
}

async function registerFailedAttempt(
  otpId: number
) {
  return prisma.$transaction(
    async (tx) => {
      const incrementResult =
        await tx.otpCode.updateMany({
          where: {
            id: otpId,

            used: false,

            expiresAt: {
              gt: new Date(),
            },

            attemptCount: {
              lt:
                MAX_VERIFY_ATTEMPTS,
            },
          },

          data: {
            attemptCount: {
              increment: 1,
            },
          },
        });

      if (
        incrementResult.count !== 1
      ) {
        return {
          locked: true,
        };
      }

      const updatedOtp =
        await tx.otpCode.findUnique({
          where: {
            id: otpId,
          },

          select: {
            attemptCount: true,
          },
        });

      if (
        !updatedOtp ||
        updatedOtp.attemptCount >=
          MAX_VERIFY_ATTEMPTS
      ) {
        await tx.otpCode.updateMany({
          where: {
            id: otpId,
            used: false,
          },

          data: {
            used: true,
          },
        });

        return {
          locked: true,
        };
      }

      return {
        locked: false,
        attemptsRemaining:
          MAX_VERIFY_ATTEMPTS -
          updatedOtp.attemptCount,
      };
    }
  );
}

export async function POST(
  request: Request
) {
  try {
    const cookieStore =
      await cookies();

    const contentType =
      request.headers.get(
        "content-type"
      ) || "";

    let body: VerifyBody = {};

    let isFormSubmit = false;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      body = (await request
        .json()
        .catch(
          () => ({})
        )) as VerifyBody;
    } else {
      const formData =
        await request
          .formData()
          .catch(() => null);

      if (formData) {
        body = {
          phone:
            formData.get(
              "phone"
            ),

          code:
            formData.get(
              "code"
            ),

          otp:
            formData.get(
              "otp"
            ),

          verificationCode:
            formData.get(
              "verificationCode"
            ),
        };

        isFormSubmit = true;
      }
    }

    const pendingPhoneRaw =
      cookieStore.get(
        "valinor_pending_phone"
      )?.value || "";

    const bodyPhoneRaw =
      String(
        body.phone ?? ""
      );

    const pendingPhone =
      pendingPhoneRaw
        ? normalizeIranPhone(
            pendingPhoneRaw
          )
        : "";

    const bodyPhone =
      bodyPhoneRaw
        ? normalizeIranPhone(
            bodyPhoneRaw
          )
        : "";

    /*
      اگر هم فرم و هم Cookie شماره داشتند،
      نباید با هم متفاوت باشند.
    */
    if (
      pendingPhone &&
      bodyPhone &&
      pendingPhone !== bodyPhone
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "PHONE_MISMATCH",

          message:
            "درخواست تأیید معتبر نیست. لطفاً دوباره وارد شوید.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const phone =
      pendingPhone ||
      bodyPhone;

    if (
      !phone ||
      !/^09\d{9}$/.test(phone)
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "PHONE_NOT_FOUND",

          message:
            "شماره موبایل پیدا نشد. لطفاً دوباره وارد شوید.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    const code =
      normalizeOtp(
        String(
          body.code ??
            body.otp ??
            body.verificationCode ??
            ""
        )
      );

    if (!code) {
      return NextResponse.json(
        {
          success: false,

          code:
            "OTP_REQUIRED",

          message:
            "کد تأیید وارد نشده است.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,

          code:
            "INVALID_OTP_FORMAT",

          message:
            "کد تأیید باید ۶ رقم باشد.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    /*
      OTP خام هیچ‌وقت از DB خوانده
      یا با مقدار خام مقایسه نمی‌شود.
    */
    const submittedHash =
      hashOtp(
        phone,
        code
      );

    const now =
      new Date();

    const otp =
      await prisma.otpCode.findFirst({
        where: {
          phone,

          used: false,

          expiresAt: {
            gt: now,
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          code: true,
          attemptCount: true,
        },
      });

    if (!otp) {
      return NextResponse.json(
        {
          success: false,

          code:
            "INVALID_OR_EXPIRED_OTP",

          message:
            "کد تأیید اشتباه یا منقضی شده است.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (
      otp.attemptCount >=
      MAX_VERIFY_ATTEMPTS
    ) {
      await prisma.otpCode.updateMany({
        where: {
          id: otp.id,
          used: false,
        },

        data: {
          used: true,
        },
      });

      return NextResponse.json(
        {
          success: false,

          code:
            "OTP_ATTEMPTS_EXCEEDED",

          message:
            "تعداد تلاش‌ها بیش از حد مجاز است. لطفاً کد جدیدی درخواست کنید.",
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

    const isCorrect =
      safelyCompareHashes(
        otp.code,
        submittedHash
      );

    if (!isCorrect) {
      const failure =
        await registerFailedAttempt(
          otp.id
        );

      if (failure.locked) {
        return NextResponse.json(
          {
            success: false,

            code:
              "OTP_ATTEMPTS_EXCEEDED",

            message:
              "تعداد تلاش‌ها بیش از حد مجاز است. لطفاً کد جدیدی درخواست کنید.",
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

      return NextResponse.json(
        {
          success: false,

          code:
            "INVALID_OR_EXPIRED_OTP",

          message:
            "کد تأیید اشتباه یا منقضی شده است.",

          attemptsRemaining:
            failure.attemptsRemaining,
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    /*
      Token خام فقط داخل Cookie می‌رود.
      دیتابیس فقط SHA-256 آن را نگه می‌دارد.
    */
    const sessionToken =
      generateSessionToken();

    const storedSessionHash =
      hashSessionToken(
        sessionToken
      );

    const sessionExpiresAt =
      new Date(
        Date.now() +
          SESSION_DURATION_DAYS *
            24 *
            60 *
            60 *
            1000
      );

    /*
      Claim کردن OTP، ساخت User و Session
      یکجا انجام می‌شود.

      بنابراین دو درخواست همزمان نمی‌توانند
      یک OTP را دوبار مصرف کنند.
    */
    const result =
      await prisma.$transaction(
        async (tx) => {
          const claim =
            await tx.otpCode.updateMany({
              where: {
                id: otp.id,

                phone,

                used: false,

                expiresAt: {
                  gt:
                    new Date(),
                },

                attemptCount: {
                  lt:
                    MAX_VERIFY_ATTEMPTS,
                },
              },

              data: {
                used: true,
              },
            });

          if (
            claim.count !== 1
          ) {
            throw new Error(
              "OTP_ALREADY_CONSUMED"
            );
          }

          /*
            کاربر فقط بعد از OTP صحیح
            ساخته می‌شود.
          */
          const user =
            await tx.user.upsert({
              where: {
                phone,
              },

              update: {},

              create: {
                phone,
              },

              select: {
                id: true,
                name: true,
              },
            });

          await tx.otpCode.update({
            where: {
              id: otp.id,
            },

            data: {
              userId:
                user.id,
            },
          });

          /*
            تمام OTPهای قدیمی همان شماره
            با ورود موفق باطل می‌شوند.
          */
          await tx.otpCode.updateMany({
            where: {
              phone,

              id: {
                not:
                  otp.id,
              },

              used: false,
            },

            data: {
              used: true,
            },
          });

          /*
            Sessionهای منقضی‌شده کاربر
            را همزمان جمع می‌کنیم.
          */
          await tx.session.deleteMany({
            where: {
              userId:
                user.id,

              expiresAt: {
                lte:
                  new Date(),
              },
            },
          });

          await tx.session.create({
            data: {
              token:
                storedSessionHash,

              userId:
                user.id,

              expiresAt:
                sessionExpiresAt,
            },
          });

          return user;
        }
      );

    let response: NextResponse;

    if (isFormSubmit) {
      response =
        NextResponse.redirect(
          new URL(
            result.name
              ? "/profile"
              : "/register",

            request.url
          ),

          303
        );
    } else {
      response =
        NextResponse.json(
          {
            success: true,

            hasName:
              Boolean(
                result.name
              ),
          },
          {
            status: 200,
          }
        );
    }

    setSessionCookie(
      response,
      sessionToken,
      sessionExpiresAt
    );

    clearPendingPhone(
      response
    );

    return response;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "OTP_ALREADY_CONSUMED"
    ) {
      return NextResponse.json(
        {
          success: false,

          code:
            "INVALID_OR_EXPIRED_OTP",

          message:
            "کد تأیید اشتباه یا منقضی شده است.",
        },
        {
          status: 400,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    console.error(
      "OTP verification failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        code:
          "OTP_VERIFICATION_FAILED",

        message:
          "تأیید کد با خطا روبه‌رو شد. لطفاً دوباره تلاش کنید.",
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