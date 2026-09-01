"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Header from "@/app/components/Header";
import { useCart } from "@/src/context/CartContext";

import styles from "./page.module.css";

type CheckoutItem = {
  productId: number;
  slug: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
};

type CheckoutData = {
  items: CheckoutItem[];
  subtotalPrice: number;
  shippingPrice: number;
  discountAmount: number;
  totalPrice: number;
  moneyUnit: "TOMAN";
};

type CustomerData = {
  name: string | null;
  phone: string;
};

type FormData = {
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
};

type CreatedOrder = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotalPrice: number;
  shippingPrice: number;
  discountAmount: number;
  totalPrice: number;
  createdAt: string;
};

const provinces = [
  "آذربایجان شرقی",
  "آذربایجان غربی",
  "اردبیل",
  "اصفهان",
  "البرز",
  "ایلام",
  "بوشهر",
  "تهران",
  "چهارمحال و بختیاری",
  "خراسان جنوبی",
  "خراسان رضوی",
  "خراسان شمالی",
  "خوزستان",
  "زنجان",
  "سمنان",
  "سیستان و بلوچستان",
  "فارس",
  "قزوین",
  "قم",
  "کردستان",
  "کرمان",
  "کرمانشاه",
  "کهگیلویه و بویراحمد",
  "گلستان",
  "گیلان",
  "لرستان",
  "مازندران",
  "مرکزی",
  "هرمزگان",
  "همدان",
  "یزد",
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function normalizeDigits(value: string) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value
    .replace(/[۰-۹]/g, (digit) =>
      String(persianDigits.indexOf(digit))
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(arabicDigits.indexOf(digit))
    );
}

function createRequestKey() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export default function CheckoutPage() {
  const router = useRouter();

  const { items, loaded } = useCart();

  const requestKeyRef = useRef<string | null>(null);

  const [checkout, setCheckout] =
    useState<CheckoutData | null>(null);

  const [loadingCheckout, setLoadingCheckout] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [pageError, setPageError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [createdOrder, setCreatedOrder] =
    useState<CreatedOrder | null>(null);

  const [formData, setFormData] =
    useState<FormData>({
      recipientName: "",
      recipientPhone: "",
      province: "",
      city: "",
      addressLine: "",
      postalCode: "",
    });

  useEffect(() => {
    if (!loaded) {
      return;
    }

    /*
      اگر محتوای سبد تغییر کند،
      تلاش بعدی برای ثبت سفارش باید
      requestKey جدید داشته باشد.
    */
    requestKeyRef.current = null;
    setCreatedOrder(null);

    if (items.length === 0) {
      setLoadingCheckout(false);
      setCheckout(null);
      return;
    }

    let cancelled = false;

    async function validateCheckout() {
      try {
        setLoadingCheckout(true);
        setPageError("");

        const response = await fetch(
          "/api/checkout",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              items: items.map((item) => ({
                slug: item.slug,
                quantity: item.quantity,
              })),
            }),
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (cancelled) {
          return;
        }

        if (!data) {
          setCheckout(null);
          setPageError(
            "پاسخ نامعتبر از سرور دریافت شد."
          );
          return;
        }

        if (
          response.status === 401 ||
          data.code === "UNAUTHORIZED"
        ) {
          router.replace("/login");
          return;
        }

        if (!response.ok || !data.success) {
          setCheckout(null);

          setPageError(
            data.message ||
              "امکان بررسی سبد خرید وجود ندارد."
          );

          return;
        }

        setCheckout(data.checkout);

        const customer =
          data.customer as CustomerData;

        setFormData((current) => ({
          ...current,

          recipientName:
            current.recipientName ||
            customer.name ||
            "",

          recipientPhone:
            current.recipientPhone ||
            customer.phone ||
            "",
        }));
      } catch (error) {
        console.error(
          "Checkout load failed:",
          error
        );

        if (!cancelled) {
          setCheckout(null);

          setPageError(
            "ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCheckout(false);
        }
      }
    }

    validateCheckout();

    return () => {
      cancelled = true;
    };
  }, [items, loaded, router]);

  function updateField(
    field: keyof FormData,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    /*
      اگر کاربر اطلاعات سفارش را عوض کند،
      درخواست بعدی یک سفارش جدید محسوب می‌شود.
    */
    requestKeyRef.current = null;

    if (formError) {
      setFormError("");
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!checkout) {
      setFormError(
        "اطلاعات سبد خرید آماده نیست. صفحه را دوباره بارگذاری کنید."
      );
      return;
    }

    const recipientName =
      formData.recipientName.trim();

    const recipientPhone =
      normalizeDigits(
        formData.recipientPhone
      )
        .replace(/\s+/g, "")
        .replace(/-/g, "")
        .trim();

    const province =
      formData.province.trim();

    const city =
      formData.city.trim();

    const addressLine =
      formData.addressLine.trim();

    const postalCode =
      normalizeDigits(
        formData.postalCode
      )
        .replace(/\D/g, "")
        .trim();

    if (
      !recipientName ||
      !recipientPhone ||
      !province ||
      !city ||
      !addressLine ||
      !postalCode
    ) {
      setFormError(
        "لطفاً تمام اطلاعات گیرنده و آدرس را کامل کنید."
      );

      return;
    }

    if (
      recipientName.length < 2 ||
      recipientName.length > 120
    ) {
      setFormError(
        "نام و نام خانوادگی گیرنده معتبر نیست."
      );

      return;
    }

    if (!/^09\d{9}$/.test(recipientPhone)) {
      setFormError(
        "شماره موبایل گیرنده معتبر نیست."
      );

      return;
    }

    if (
      city.length < 2 ||
      city.length > 80
    ) {
      setFormError(
        "نام شهر معتبر نیست."
      );

      return;
    }

    if (
      addressLine.length < 10 ||
      addressLine.length > 500
    ) {
      setFormError(
        "لطفاً آدرس کامل‌تری وارد کنید."
      );

      return;
    }

    if (!/^\d{10}$/.test(postalCode)) {
      setFormError(
        "کد پستی باید ۱۰ رقم باشد."
      );

      return;
    }

    if (!requestKeyRef.current) {
      requestKeyRef.current =
        createRequestKey();
    }

    const requestKey =
      requestKeyRef.current;

    try {
      setSubmitting(true);
      setFormError("");

      const response = await fetch(
        "/api/orders/create",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            requestKey,

            items: items.map((item) => ({
              slug: item.slug,
              quantity: item.quantity,
            })),

            recipientName,
            recipientPhone,

            province,
            city,
            addressLine,
            postalCode,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!data) {
        setFormError(
          "پاسخ نامعتبر از سرور دریافت شد. لطفاً دوباره تلاش کنید."
        );

        return;
      }

      if (
        response.status === 401 ||
        data.code === "UNAUTHORIZED"
      ) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !data.success) {
        /*
          اگر سفارش ساخته نشده باشد،
          برای خطاهای validation می‌توانیم
          requestKey جدید تولید کنیم.
        */
        if (
          response.status === 400 ||
          response.status === 409
        ) {
          requestKeyRef.current = null;
        }

        setFormError(
          data.message ||
            "ثبت سفارش انجام نشد. لطفاً دوباره تلاش کنید."
        );

        return;
      }

      setCreatedOrder(
        data.order as CreatedOrder
      );
    } catch (error) {
      console.error(
        "Order submit failed:",
        error
      );

      /*
        در خطای شبکه requestKey را نگه می‌داریم.
        ممکن است سفارش در سرور ساخته شده باشد
        ولی پاسخ به مرورگر نرسیده باشد.

        در تلاش دوباره، همان requestKey باعث
        می‌شود سفارش تکراری ساخته نشود.
      */
      setFormError(
        "ارتباط با سرور قطع شد. دوباره تلاش کنید؛ سفارش تکراری ثبت نخواهد شد."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded || loadingCheckout) {
    return (
      <main className={styles.page}>
        <Header />

        <div
          className={styles.inner}
          dir="rtl"
        >
          <section
            className={styles.statePanel}
          >
            <h1
              className={styles.stateTitle}
            >
              در حال بررسی سفارش
            </h1>

            <p
              className={styles.stateText}
            >
              قیمت و موجودی محصولات از
              فروشگاه بررسی می‌شود.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (createdOrder) {
    return (
      <main className={styles.page}>
        <Header />

        <div
          className={styles.inner}
          dir="rtl"
        >
          <section
            className={styles.statePanel}
          >
            <p className={styles.eyebrow}>
              ORDER CREATED
            </p>

            <h1
              className={styles.stateTitle}
            >
              سفارش ثبت شد
            </h1>

            <p
              className={styles.stateText}
            >
              شماره سفارش شما:
              <br />
              <strong dir="ltr">
                {createdOrder.orderNumber}
              </strong>
            </p>

            <p
              className={styles.stateText}
            >
              مبلغ سفارش{" "}
              {formatPrice(
                createdOrder.totalPrice
              )}{" "}
              تومان است.
            </p>

            <p
              className={styles.stateText}
            >
              این سفارش هنوز پرداخت نشده است.
              درگاه پرداخت در مرحله بعد به
              همین سفارش متصل خواهد شد.
            </p>

            <Link
              href="/profile"
              className={styles.stateLink}
            >
              بازگشت به حساب کاربری
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <Header />

        <div
          className={styles.inner}
          dir="rtl"
        >
          <section
            className={styles.statePanel}
          >
            <h1
              className={styles.stateTitle}
            >
              سبد خرید خالی است
            </h1>

            <p
              className={styles.stateText}
            >
              برای ادامه فرایند خرید ابتدا
              یکی از محصولات والینور را به
              سبد اضافه کنید.
            </p>

            <Link
              href="/products"
              className={styles.stateLink}
            >
              مشاهده محصولات
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (pageError || !checkout) {
    return (
      <main className={styles.page}>
        <Header />

        <div
          className={styles.inner}
          dir="rtl"
        >
          <section
            className={styles.statePanel}
          >
            <h1
              className={styles.stateTitle}
            >
              سبد خرید نیاز به بررسی دارد
            </h1>

            <p
              className={styles.stateText}
            >
              {pageError ||
                "امکان ادامه فرایند خرید وجود ندارد."}
            </p>

            <Link
              href="/cart"
              className={styles.stateLink}
            >
              بازگشت به سبد خرید
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Header />

      <div
        className={styles.inner}
        dir="rtl"
      >
        <section
          className={styles.checkoutHeader}
        >
          <p className={styles.eyebrow}>
            CHECKOUT
          </p>

          <h1>تکمیل سفارش</h1>

          <p>
            اطلاعات گیرنده و آدرس ارسال را
            وارد کنید. آدرس فقط برای همین
            سفارش استفاده خواهد شد.
          </p>
        </section>

        <form
          className={styles.layout}
          onSubmit={handleSubmit}
        >
          <section
            className={styles.formPanel}
          >
            <div className={styles.section}>
              <header
                className={
                  styles.sectionHeader
                }
              >
                <p
                  className={
                    styles.sectionEyebrow
                  }
                >
                  RECIPIENT
                </p>

                <h2>اطلاعات گیرنده</h2>

                <p>
                  سفارش به نام و شماره این
                  شخص ثبت خواهد شد.
                </p>
              </header>

              {formError && (
                <div
                  className={
                    styles.errorBox
                  }
                >
                  {formError}
                </div>
              )}

              <div className={styles.fields}>
                <label
                  className={styles.field}
                >
                  <span
                    className={styles.label}
                  >
                    نام و نام خانوادگی{" "}
                    <span
                      className={
                        styles.required
                      }
                    >
                      *
                    </span>
                  </span>

                  <input
                    type="text"
                    autoComplete="name"
                    className={styles.input}
                    value={
                      formData.recipientName
                    }
                    onChange={(event) =>
                      updateField(
                        "recipientName",
                        event.target.value
                      )
                    }
                    placeholder="نام گیرنده"
                    maxLength={120}
                    disabled={submitting}
                    required
                  />
                </label>

                <label
                  className={styles.field}
                >
                  <span
                    className={styles.label}
                  >
                    شماره موبایل{" "}
                    <span
                      className={
                        styles.required
                      }
                    >
                      *
                    </span>
                  </span>

                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    className={styles.input}
                    value={
                      formData.recipientPhone
                    }
                    onChange={(event) =>
                      updateField(
                        "recipientPhone",
                        event.target.value
                      )
                    }
                    placeholder="09xxxxxxxxx"
                    maxLength={11}
                    disabled={submitting}
                    required
                  />
                </label>
              </div>
            </div>

            <div className={styles.section}>
              <header
                className={
                  styles.sectionHeader
                }
              >
                <p
                  className={
                    styles.sectionEyebrow
                  }
                >
                  SHIPPING ADDRESS
                </p>

                <h2>آدرس ارسال</h2>

                <p>
                  این آدرس در حساب کاربری
                  ذخیره نمی‌شود.
                </p>
              </header>

              <div className={styles.fields}>
                <label
                  className={styles.field}
                >
                  <span
                    className={styles.label}
                  >
                    استان{" "}
                    <span
                      className={
                        styles.required
                      }
                    >
                      *
                    </span>
                  </span>

                  <select
                    className={styles.select}
                    value={formData.province}
                    onChange={(event) =>
                      updateField(
                        "province",
                        event.target.value
                      )
                    }
                    disabled={submitting}
                    required
                  >
                    <option value="">
                      انتخاب استان
                    </option>

                    {provinces.map(
                      (province) => (
                        <option
                          key={province}
                          value={province}
                        >
                          {province}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label
                  className={styles.field}
                >
                  <span
                    className={styles.label}
                  >
                    شهر{" "}
                    <span
                      className={
                        styles.required
                      }
                    >
                      *
                    </span>
                  </span>

                  <input
                    type="text"
                    autoComplete="address-level2"
                    className={styles.input}
                    value={formData.city}
                    onChange={(event) =>
                      updateField(
                        "city",
                        event.target.value
                      )
                    }
                    placeholder="نام شهر"
                    maxLength={80}
                    disabled={submitting}
                    required
                  />
                </label>

                <label
                  className={`${styles.field} ${styles.fieldFull}`}
                >
                  <span
                    className={styles.label}
                  >
                    آدرس کامل{" "}
                    <span
                      className={
                        styles.required
                      }
                    >
                      *
                    </span>
                  </span>

                  <textarea
                    autoComplete="street-address"
                    className={styles.textarea}
                    value={
                      formData.addressLine
                    }
                    onChange={(event) =>
                      updateField(
                        "addressLine",
                        event.target.value
                      )
                    }
                    placeholder="خیابان، کوچه، پلاک، واحد و توضیحات لازم برای تحویل"
                    maxLength={500}
                    disabled={submitting}
                    required
                  />
                </label>

                <label
                  className={styles.field}
                >
                  <span
                    className={styles.label}
                  >
                    کد پستی{" "}
                    <span
                      className={
                        styles.required
                      }
                    >
                      *
                    </span>
                  </span>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    className={styles.input}
                    value={formData.postalCode}
                    onChange={(event) =>
                      updateField(
                        "postalCode",
                        event.target.value
                      )
                    }
                    placeholder="کد پستی ۱۰ رقمی"
                    maxLength={10}
                    disabled={submitting}
                    required
                  />
                </label>
              </div>
            </div>
          </section>

          <aside className={styles.summary}>
            <header
              className={
                styles.summaryHeader
              }
            >
              <p
                className={
                  styles.summaryEyebrow
                }
              >
                ORDER SUMMARY
              </p>

              <h2>خلاصه سفارش</h2>
            </header>

            <div className={styles.items}>
              {checkout.items.map(
                (item) => (
                  <article
                    key={item.slug}
                    className={styles.item}
                  >
                    <div
                      className={
                        styles.itemImage
                      }
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                      />
                    </div>

                    <div
                      className={
                        styles.itemInfo
                      }
                    >
                      <span
                        className={
                          styles.itemName
                        }
                      >
                        {item.name}
                      </span>

                      <span
                        className={
                          styles.itemQuantity
                        }
                      >
                        تعداد:{" "}
                        {new Intl.NumberFormat(
                          "fa-IR"
                        ).format(
                          item.quantity
                        )}
                      </span>
                    </div>

                    <span
                      className={
                        styles.itemPrice
                      }
                    >
                      {formatPrice(
                        item.lineTotal
                      )}{" "}
                      تومان
                    </span>
                  </article>
                )
              )}
            </div>

            <div
              className={
                styles.priceSummary
              }
            >
              <div
                className={
                  styles.summaryRow
                }
              >
                <span>جمع محصولات</span>

                <span>
                  {formatPrice(
                    checkout.subtotalPrice
                  )}{" "}
                  تومان
                </span>
              </div>

              <div
                className={
                  styles.summaryRow
                }
              >
                <span>هزینه ارسال</span>

                <span>
                  {formatPrice(
                    checkout.shippingPrice
                  )}{" "}
                  تومان
                </span>
              </div>

              {checkout.discountAmount >
                0 && (
                <div
                  className={
                    styles.summaryRow
                  }
                >
                  <span>تخفیف</span>

                  <span>
                    −{" "}
                    {formatPrice(
                      checkout.discountAmount
                    )}{" "}
                    تومان
                  </span>
                </div>
              )}

              <div
                className={
                  styles.totalRow
                }
              >
                <div
                  className={
                    styles.totalLabel
                  }
                >
                  <span>
                    مبلغ قابل پرداخت
                  </span>

                  <span>
                    شامل هزینه ارسال
                  </span>
                </div>

                <strong
                  className={
                    styles.totalPrice
                  }
                >
                  {formatPrice(
                    checkout.totalPrice
                  )}{" "}
                  تومان
                </strong>
              </div>
            </div>

            <div
              className={
                styles.submitArea
              }
            >
              <button
                type="submit"
                disabled={submitting}
                className={
                  styles.submitButton
                }
              >
                {submitting
                  ? "در حال ثبت سفارش..."
                  : "ادامه به پرداخت"}
              </button>

              <p
                className={
                  styles.submitNote
                }
              >
                قیمت و موجودی هنگام ثبت سفارش
                دوباره از سرور بررسی می‌شود.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}