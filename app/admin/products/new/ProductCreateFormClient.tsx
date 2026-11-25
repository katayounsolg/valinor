
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ImagePlus,
  Images,
  AlignLeft,
  AlignRight,
  Package,
} from "lucide-react";

import ImageUploaderClient from "@/app/admin/components/ImageUploaderClient";
import styles from "../[id]/page.module.css";

type Category = {
  id: number;
  title: string;
  slug: string;
};

type Props = {
  categories: Category[];
};

type ProductFormState = {
  name: string;
  slug: string;

  shortDescription: string;
  fullDescription: string;

  leftDescription: string;
  detailsContent: string;
  shippingContent: string;

  englishName: string;
  seriesTitle: string;
  seriesTagline: string;

  price: string;
  stock: string;

  mainImage: string;
  images: string[];

  tags: string;

  material: string;
  dimensions: string;
  weight: string;

  categoryId: string;
  isAvailable: boolean;
};

const MAX_IMAGES = 6;

export default function ProductCreateFormClient({
  categories,
}: Props) {
  const router = useRouter();

  const [formData, setFormData] =
    useState<ProductFormState>({
      name: "",
      slug: "",

      shortDescription: "",
      fullDescription: "",

      leftDescription: "",
      detailsContent: "",
      shippingContent: "",

      englishName: "",
      seriesTitle: "",
      seriesTagline: "",

      price: "",
      stock: "0",

      mainImage: "",
      images: [],

      tags: "",

      material: "",
      dimensions: "",
      weight: "",

      categoryId:
        categories.length > 0
          ? String(categories[0].id)
          : "",

      isAvailable: true,
    });

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  function updateField<K extends keyof ProductFormState>(
    field: K,
    value: ProductFormState[K]
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  // تصویر شماره یک
  function updateMainImage(url: string) {
    updateField("mainImage", url);
  }

  // تصاویر شماره دو تا شش؛ جایگاه‌ها ثابت می‌مانند.
  // اگر تصویری حذف شود، جایگاه‌های بعد از آن نیز خالی می‌شوند
  // تا ترتیب تصاویر در گالری به‌هم نریزد.
  function updateGalleryImage(
    index: number,
    url: string
  ) {
    setFormData((current) => {
      const next = Array.from(
        { length: MAX_IMAGES - 1 },
        (_, imageIndex) => current.images[imageIndex] || ""
      );

      next[index] = url;

      if (!url) {
        for (let nextIndex = index + 1; nextIndex < next.length; nextIndex += 1) {
          next[nextIndex] = "";
        }
      }

      return {
        ...current,
        images: next,
      };
    });

    setError("");
  }

  function getImageAt(index: number) {
    return formData.images[index] || "";
  }

  function isImageSlotEnabled(index: number) {
    if (index === 0) return true;

    return Boolean(formData.images[index - 1]);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) return;

    const name = formData.name.trim();
    const slug = formData.slug.trim();

    const price = Number(formData.price);
    const stock = Number(formData.stock);
    const categoryId = Number(formData.categoryId);

    const mainImage = formData.mainImage.trim();

    const images = formData.images
      .slice(0, MAX_IMAGES - 1)
      .map((item) => item.trim())
      .filter(Boolean);

    const tags = formData.tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (name.length < 2 || name.length > 160) {
      setError("نام محصول باید بین ۲ تا ۱۶۰ کاراکتر باشد.");
      return;
    }

    if (
      slug.length < 2 ||
      slug.length > 160 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
    ) {
      setError(
        "Slug معتبر نیست. فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است."
      );
      return;
    }

    if (!Number.isSafeInteger(price) || price < 0) {
      setError("قیمت محصول معتبر نیست.");
      return;
    }

    if (!Number.isSafeInteger(stock) || stock < 0) {
      setError("موجودی محصول معتبر نیست.");
      return;
    }

    if (!Number.isInteger(categoryId) || categoryId < 1) {
      setError("یک دسته‌بندی معتبر انتخاب کنید.");
      return;
    }

    if (!mainImage) {
      setError("تصویر شماره ۱ (تصویر اصلی) را آپلود کنید.");
      return;
    }

    if (images.length > 5) {
      setError("حداکثر پنج تصویر تکمیلی مجاز است.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(
        "/api/admin/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            slug,

            shortDescription:
              formData.shortDescription.trim(),

            fullDescription:
              formData.fullDescription.trim(),

            // ستون چپ
            leftDescription:
              formData.leftDescription.trim(),

            detailsContent:
              formData.detailsContent.trim(),

            shippingContent:
              formData.shippingContent.trim(),

            // ستون راست
            englishName:
              formData.englishName.trim(),

            seriesTitle:
              formData.seriesTitle.trim(),

            seriesTagline:
              formData.seriesTagline.trim(),

            price,
            stock,

            mainImage,
            images,

            tags,

            material: formData.material.trim(),
            dimensions: formData.dimensions.trim(),
            weight: formData.weight.trim(),

            categoryId,
            isAvailable: formData.isAvailable,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!data) {
        setError("پاسخ نامعتبر از سرور دریافت شد.");
        return;
      }

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok || !data.success) {
        setError(
          data.message || "افزودن محصول انجام نشد."
        );
        return;
      }

      router.push(`/admin/products/${data.product.id}`);
      router.refresh();

    } catch (submitError) {
      console.error(
        "Product creation failed:",
        submitError
      );

      setError(
        "ارتباط با سرور برقرار نشد. دوباره تلاش کنید."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className={styles.layout}
      onSubmit={handleSubmit}
    >
      <div className={styles.main}>

        {/* اطلاعات اصلی */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              اطلاعات اصلی محصول
            </h2>
            <p className={styles.panelSub}>
              نام، آدرس و دسته‌بندی محصول
            </p>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.gridTwo}>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>نام محصول</span>
                <input
                  className={styles.input}
                  value={formData.name}
                  maxLength={160}
                  disabled={submitting}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Slug</span>
                <input
                  className={`${styles.input} ${styles.ltr}`}
                  value={formData.slug}
                  maxLength={160}
                  spellCheck={false}
                  placeholder="leather-wallet"
                  disabled={submitting}
                  onChange={(e) =>
                    updateField("slug", e.target.value)
                  }
                />
                <p className={styles.help}>
                  حروف انگلیسی کوچک، عدد و خط تیره.
                </p>
              </label>

              <label className={styles.field}>
                <span className={styles.label}>دسته‌بندی</span>
                <select
                  className={styles.select}
                  value={formData.categoryId}
                  disabled={submitting || categories.length === 0}
                  onChange={(e) =>
                    updateField("categoryId", e.target.value)
                  }
                >
                  {categories.length === 0 ? (
                    <option value="">
                      دسته‌بندی‌ای وجود ندارد
                    </option>
                  ) : (
                    categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.title}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>
          </div>
        </article>

        {/* تصاویر */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <Images size={19} style={{ verticalAlign: "middle" }} />
              {" "}گالری تصاویر محصول
            </h2>

            <p className={styles.panelSub}>
              شش جایگاه مشخص برای تصاویر محصول
            </p>
          </header>

          <div className={styles.panelBody}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "18px",
              }}
            >
              {Array.from(
                { length: MAX_IMAGES },
                (_, index) => {
                  const isMain = index === 0;
                  const imageValue = isMain
                    ? formData.mainImage
                    : getImageAt(index - 1);

                  const enabled =
                    isMain ||
                    isImageSlotEnabled(index - 1);

                  return (
                    <div
                      key={index}
                      className={styles.field}
                      style={{
                        gridColumn: isMain
                          ? "1 / -1"
                          : undefined,
                        padding: "16px",
                        border: "1px solid #e8e4df",
                        borderRadius: "10px",
                        background: "#fffdf9",
                        opacity: enabled ? 1 : 0.45,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "12px",
                          gap: "8px",
                        }}
                      >
                        <span className={styles.label}>
                          تصویر شماره {index + 1}
                        </span>

                        <span
                          style={{
                            fontSize: "10px",
                            color: "#898078",
                          }}
                        >
                          {isMain
                            ? "تصویر اصلی"
                            : "تصویر گالری"}
                        </span>
                      </div>

                      <ImageUploaderClient
                        value={imageValue}
                        scope="products"
                        disabled={
                          submitting || !enabled
                        }
                        onChange={(url) => {
                          if (isMain) {
                            updateMainImage(url);
                          } else {
                            updateGalleryImage(
                              index - 1,
                              url
                            );
                          }
                        }}
                      />

                      {!enabled && (
                        <p className={styles.help}>
                          ابتدا تصویر جایگاه قبلی را انتخاب کنید.
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            <p className={styles.help}>
              تصویر اول عکس اصلی محصول است. پنج تصویر بعدی
              به ترتیب در گالری نمایش داده می‌شوند.
              برای حفظ ترتیب، تصاویر را از شماره ۱ به ۶
              انتخاب کنید.
            </p>
          </div>
        </article>

        {/* متن سمت راست */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <AlignRight
                size={18}
                style={{ verticalAlign: "middle" }}
              />
              {" "}محتوای سمت راست صفحه محصول
            </h2>

            <p className={styles.panelSub}>
              عنوان‌ها و توضیحات کنار گالری
            </p>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.gridTwo}>

              <label className={styles.field}>
                <span className={styles.label}>
                  نام انگلیسی محصول
                </span>
                <input
                  className={styles.input}
                  value={formData.englishName}
                  maxLength={160}
                  disabled={submitting}
                  placeholder="Silver Ash"
                  onChange={(e) =>
                    updateField("englishName", e.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>
                  عنوان مجموعه
                </span>
                <input
                  className={styles.input}
                  value={formData.seriesTitle}
                  maxLength={160}
                  disabled={submitting}
                  placeholder="Palette"
                  onChange={(e) =>
                    updateField("seriesTitle", e.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>
                  زیرعنوان مجموعه
                </span>
                <input
                  className={styles.input}
                  value={formData.seriesTagline}
                  maxLength={300}
                  disabled={submitting}
                  placeholder="Soft tones."
                  onChange={(e) =>
                    updateField("seriesTagline", e.target.value)
                  }
                />
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>
                  توضیح کوتاه سمت راست
                </span>
                <textarea
                  className={styles.textarea}
                  value={formData.shortDescription}
                  maxLength={500}
                  disabled={submitting}
                  onChange={(e) =>
                    updateField(
                      "shortDescription",
                      e.target.value
                    )
                  }
                />
              </label>

            </div>
          </div>
        </article>

        {/* متن سمت چپ */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <AlignLeft
                size={18}
                style={{ verticalAlign: "middle" }}
              />
              {" "}محتوای سمت چپ صفحه محصول
            </h2>

            <p className={styles.panelSub}>
              توضیحات، جزئیات و اطلاعات ارسال
            </p>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.gridTwo}>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>
                  توضیحات اصلی سمت چپ
                </span>
                <textarea
                  className={styles.textarea}
                  value={formData.leftDescription}
                  maxLength={5000}
                  disabled={submitting}
                  onChange={(e) =>
                    updateField(
                      "leftDescription",
                      e.target.value
                    )
                  }
                />
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>
                  محتوای DETAILS
                </span>
                <textarea
                  className={styles.textarea}
                  value={formData.detailsContent}
                  maxLength={5000}
                  disabled={submitting}
                  placeholder={
                    "Leather: Veg-tan Cow Leather\nSize: A5\nFinish: Handcrafted"
                  }
                  onChange={(e) =>
                    updateField(
                      "detailsContent",
                      e.target.value
                    )
                  }
                />
                <p className={styles.help}>
                  هر مشخصه را در یک خط بنویس.
                </p>
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>
                  محتوای PREPARATION & SHIPPING
                </span>
                <textarea
                  className={styles.textarea}
                  value={formData.shippingContent}
                  maxLength={5000}
                  disabled={submitting}
                  placeholder={
                    "Orders are prepared within 7 working days."
                  }
                  onChange={(e) =>
                    updateField(
                      "shippingContent",
                      e.target.value
                    )
                  }
                />
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>
                  توضیحات کامل قدیمی
                </span>
                <textarea
                  className={styles.textarea}
                  value={formData.fullDescription}
                  maxLength={5000}
                  disabled={submitting}
                  onChange={(e) =>
                    updateField(
                      "fullDescription",
                      e.target.value
                    )
                  }
                />
              </label>

            </div>
          </div>
        </article>

        {/* قیمت و موجودی */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              قیمت و موجودی
            </h2>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.gridTwo}>

              <label className={styles.field}>
                <span className={styles.label}>
                  قیمت (تومان)
                </span>
                <input
                  className={`${styles.input} ${styles.ltr}`}
                  type="number"
                  min={0}
                  step={1}
                  value={formData.price}
                  disabled={submitting}
                  onChange={(e) =>
                    updateField("price", e.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>
                  موجودی اولیه
                </span>
                <input
                  className={`${styles.input} ${styles.ltr}`}
                  type="number"
                  min={0}
                  step={1}
                  value={formData.stock}
                  disabled={submitting}
                  onChange={(e) =>
                    updateField("stock", e.target.value)
                  }
                />
              </label>

            </div>
          </div>
        </article>

        {/* مشخصات */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <Package
                size={18}
                style={{ verticalAlign: "middle" }}
              />
              {" "}مشخصات محصول
            </h2>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.gridTwo}>

              <label className={styles.field}>
                <span className={styles.label}>متریال</span>
                <input
                  className={styles.input}
                  value={formData.material}
                  maxLength={200}
                  disabled={submitting}
                  onChange={(e) =>
                    updateField("material", e.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>ابعاد</span>
                <input
                  className={styles.input}
                  value={formData.dimensions}
                  maxLength={200}
                  disabled={submitting}
                  onChange={(e) =>
                    updateField("dimensions", e.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>وزن</span>
                <input
                  className={styles.input}
                  value={formData.weight}
                  maxLength={100}
                  disabled={submitting}
                  onChange={(e) =>
                    updateField("weight", e.target.value)
                  }
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>تگ‌ها</span>
                <input
                  className={styles.input}
                  value={formData.tags}
                  disabled={submitting}
                  placeholder="چرم, کیف, دست‌دوز"
                  onChange={(e) =>
                    updateField("tags", e.target.value)
                  }
                />
                <p className={styles.help}>
                  تگ‌ها را با کاما جدا کن.
                </p>
              </label>

            </div>
          </div>
        </article>

        {/* وضعیت */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              وضعیت فروشگاه
            </h2>
          </header>

          <div className={styles.panelBody}>
            <label className={styles.field}>
              <span className={styles.label}>
                وضعیت محصول
              </span>

              <select
                className={styles.select}
                value={
                  formData.isAvailable
                    ? "available"
                    : "unavailable"
                }
                disabled={submitting}
                onChange={(e) =>
                  updateField(
                    "isAvailable",
                    e.target.value === "available"
                  )
                }
              >
                <option value="available">
                  فعال در فروشگاه
                </option>
                <option value="unavailable">
                  غیرفعال
                </option>
              </select>
            </label>
          </div>
        </article>

        {/* پیش‌نمایش متن */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              پیش‌نمایش محتوای محصول
            </h2>
          </header>

          <div className={styles.panelBody}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <div>
                <p className={styles.label}>سمت چپ</p>
                <p className={styles.description}>
                  {formData.leftDescription ||
                    "توضیحات سمت چپ اینجا نمایش داده می‌شود."}
                </p>
              </div>

              <div>
                <p className={styles.label}>سمت راست</p>
                <p className={styles.description}>
                  {formData.englishName || "نام انگلیسی"}
                </p>
                <h3>{formData.seriesTitle || "عنوان مجموعه"}</h3>
                <p>{formData.seriesTagline || "زیرعنوان"}</p>
                <p className={styles.description}>
                  {formData.shortDescription ||
                    "توضیحات کوتاه محصول"}
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* خطا */}
        {error && (
          <article className={styles.panel}>
            <div className={styles.panelBody}>
              <p
                className={styles.description}
                style={{ color: "#b42318" }}
              >
                {error}
              </p>
            </div>
          </article>
        )}

        {/* دکمه‌ها */}
        <article className={styles.panel}>
          <div className={styles.actions}>
            <Link
              href="/admin/products"
              className={styles.cancelLink}
            >
              انصراف
            </Link>

            <button
              type="submit"
              className={styles.saveButton}
              disabled={
                submitting || categories.length === 0
              }
            >
              {submitting
                ? "در حال افزودن..."
                : "افزودن محصول"}
            </button>
          </div>
        </article>

      </div>

      {/* ستون پیش‌نمایش */}
      <aside className={styles.side}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              پیش‌نمایش تصاویر
            </h2>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.imagePreview}>
              {formData.mainImage ? (
                <img
                  src={formData.mainImage}
                  alt={formData.name || "Product"}
                />
              ) : (
                <div className={styles.imageFallback}>
                  <ImagePlus size={28} />
                </div>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "5px",
                marginTop: "10px",
              }}
            >
              {Array.from({ length: 5 }, (_, index) => {
                const url = getImageAt(index);

                return (
                  <div
                    key={index}
                    style={{
                      aspectRatio: "1 / 1",
                      overflow: "hidden",
                      background: "#f4f0eb",
                      border: "1px solid #e8e4df",
                    }}
                  >
                    {url ? (
                      <img
                        src={url}
                        alt={`تصویر ${index + 2}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                          color: "#aaa",
                          fontSize: "11px",
                        }}
                      >
                        {index + 2}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              وضعیت اولیه
            </h2>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.statusBox}>
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>
                  نمایش
                </span>

                <strong
                  className={`${styles.statusValue} ${
                    formData.isAvailable
                      ? styles.available
                      : styles.unavailable
                  }`}
                >
                  {formData.isAvailable ? "فعال" : "غیرفعال"}
                </strong>
              </div>

              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>
                  موجودی
                </span>

                <strong className={styles.statusValue}>
                  {formData.stock || "۰"}
                </strong>
              </div>

              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>
                  تصاویر انتخاب‌شده
                </span>

                <strong className={styles.statusValue}>
                  {Number(Boolean(formData.mainImage)) +
                    formData.images.length} / 6
                </strong>
              </div>
            </div>
          </div>
        </article>
      </aside>
    </form>
  );
}
