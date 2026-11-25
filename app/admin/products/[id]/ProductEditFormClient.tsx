"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  Images,
  AlignLeft,
  AlignRight,
  Package,
  Trash2,
} from "lucide-react";

import ImageUploaderClient from "@/app/admin/components/ImageUploaderClient";
import styles from "./page.module.css";

type Category = {
  id: number;
  title: string;
  slug: string;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  mainImage: string;
  images?: string | string[];
  categoryId: number;

  shortDescription?: string | null;
  fullDescription?: string | null;

  leftDescription?: string | null;
  detailsContent?: string | null;
  shippingContent?: string | null;

  englishName?: string | null;
  seriesTitle?: string | null;
  seriesTagline?: string | null;

  tags?: string;
  material?: string | null;
  dimensions?: string | null;
  weight?: string | null;

  category: {
    id: number;
    title: string;
    slug: string;
  };
};

type Props = {
  product: Product;
  categories: Category[];
};

type FormState = {
  name: string;
  slug: string;
  categoryId: string;

  price: string;
  stock: string;

  mainImage: string;
  images: string[];

  isAvailable: boolean;

  shortDescription: string;
  fullDescription: string;

  leftDescription: string;
  detailsContent: string;
  shippingContent: string;

  englishName: string;
  seriesTitle: string;
  seriesTagline: string;

  tags: string;
  material: string;
  dimensions: string;
  weight: string;
};

function parseImages(value?: string | string[]): string[] {
  if (!value) return [];

  try {
    const parsed: unknown =
      typeof value === "string" ? JSON.parse(value) : value;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}

function parseTags(value?: string): string {
  if (!value) return "";

  try {
    const parsed: unknown = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === "string")
        .join(", ");
    }

    return "";
  } catch {
    return "";
  }
}

function createInitialState(product: Product): FormState {
  return {
    name: product.name || "",
    slug: product.slug || "",
    categoryId: String(product.categoryId),

    price: String(product.price),
    stock: String(product.stock),

    mainImage: product.mainImage || "",
    images: parseImages(product.images),

    isAvailable: product.isAvailable,

    shortDescription: product.shortDescription || "",
    fullDescription: product.fullDescription || "",

    leftDescription: product.leftDescription || "",
    detailsContent: product.detailsContent || "",
    shippingContent: product.shippingContent || "",

    englishName: product.englishName || "",
    seriesTitle: product.seriesTitle || "",
    seriesTagline: product.seriesTagline || "",

    tags: parseTags(product.tags),
    material: product.material || "",
    dimensions: product.dimensions || "",
    weight: product.weight || "",
  };
}

export default function ProductEditFormClient({
  product,
  categories,
}: Props) {
  const router = useRouter();

  const [formData, setFormData] = useState<FormState>(
    () => createInitialState(product)
  );

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [deleteArmed, setDeleteArmed] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const busy = submitting || deleting;

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
    setDeleteError("");
  }

  function updateGalleryImage(index: number, url: string) {
    setFormData((current) => {
      const next = [...current.images];

      if (url) {
        next[index] = url;
      } else {
        next.splice(index, 1);
      }

      return {
        ...current,
        images: next.slice(0, 5),
      };
    });

    setError("");
    setSuccess("");
  }

  function getGalleryImage(index: number) {
    return formData.images[index] || "";
  }

  function gallerySlotEnabled(index: number) {
    return index === 0 || Boolean(formData.images[index - 1]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    const name = formData.name.trim();
    const slug = formData.slug.trim();

    const categoryId = Number(formData.categoryId);
    const price = Number(formData.price);
    const stock = Number(formData.stock);

    const mainImage = formData.mainImage.trim();

    const images = formData.images
      .map((image) => image.trim())
      .filter(Boolean)
      .slice(0, 5);

    const tags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
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
      setError("Slug معتبر نیست. فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است.");
      return;
    }

    if (!Number.isInteger(categoryId) || categoryId < 1) {
      setError("یک دسته‌بندی معتبر انتخاب کنید.");
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

    if (!mainImage || mainImage.length > 1000) {
      setError("تصویر اصلی محصول معتبر نیست.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            slug,
            categoryId,
            price,
            stock,

            mainImage,
            images,

            isAvailable: formData.isAvailable,

            shortDescription: formData.shortDescription.trim(),
            fullDescription: formData.fullDescription.trim(),

            leftDescription: formData.leftDescription.trim(),
            detailsContent: formData.detailsContent.trim(),
            shippingContent: formData.shippingContent.trim(),

            englishName: formData.englishName.trim(),
            seriesTitle: formData.seriesTitle.trim(),
            seriesTagline: formData.seriesTagline.trim(),

            tags,

            material: formData.material.trim(),
            dimensions: formData.dimensions.trim(),
            weight: formData.weight.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!data) {
        setError("پاسخ نامعتبر از سرور دریافت شد.");
        return;
      }

      if (!response.ok || !data.success) {
        setError(data.message || "ذخیره تغییرات انجام نشد.");
        return;
      }

      setSuccess("تغییرات محصول با موفقیت ذخیره شد.");

      // مقادیر فرم را از پاسخ سرور تازه می‌کنیم.
      const savedProduct = data.product;

      if (savedProduct) {
        setFormData({
          name: savedProduct.name,
          slug: savedProduct.slug,
          categoryId: String(savedProduct.categoryId),

          price: String(savedProduct.price),
          stock: String(savedProduct.stock),

          mainImage: savedProduct.mainImage,
          images: parseImages(savedProduct.images),

          isAvailable: savedProduct.isAvailable,

          shortDescription: savedProduct.shortDescription || "",
          fullDescription: savedProduct.fullDescription || "",

          leftDescription: savedProduct.leftDescription || "",
          detailsContent: savedProduct.detailsContent || "",
          shippingContent: savedProduct.shippingContent || "",

          englishName: savedProduct.englishName || "",
          seriesTitle: savedProduct.seriesTitle || "",
          seriesTagline: savedProduct.seriesTagline || "",

          tags: parseTags(
            typeof savedProduct.tags === "string"
              ? savedProduct.tags
              : JSON.stringify(savedProduct.tags || [])
          ),

          material: savedProduct.material || "",
          dimensions: savedProduct.dimensions || "",
          weight: savedProduct.weight || "",
        });
      }

      router.refresh();
    } catch (submitError) {
      console.error("Product update failed:", submitError);
      setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (busy) return;

    try {
      setDeleting(true);
      setDeleteError("");
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/products/${product.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!data) {
        setDeleteError("پاسخ نامعتبر از سرور دریافت شد.");
        return;
      }

      if (!response.ok || !data.success) {
        setDeleteError(data.message || "حذف محصول انجام نشد.");
        return;
      }

      router.replace("/admin/products");
      router.refresh();
    } catch (deleteException) {
      console.error("Product deletion failed:", deleteException);
      setDeleteError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setDeleting(false);
    }
  }

  const selectedCategory = categories.find(
    (category) => category.id === Number(formData.categoryId)
  );

  return (
    <form onSubmit={handleSubmit} className={styles.layout}>
      <div className={styles.main}>

        {/* اطلاعات اصلی */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>اطلاعات اصلی محصول</h2>
            <p className={styles.panelSub}>نام، شناسه و دسته‌بندی محصول</p>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.gridTwo}>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>نام محصول</span>
                <input
                  className={styles.input}
                  value={formData.name}
                  maxLength={160}
                  disabled={busy}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Slug</span>
                <input
                  className={`${styles.input} ${styles.ltr}`}
                  value={formData.slug}
                  maxLength={160}
                  spellCheck={false}
                  disabled={busy}
                  onChange={(event) => updateField("slug", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>دسته‌بندی</span>
                <select
                  className={styles.select}
                  value={formData.categoryId}
                  disabled={busy}
                  onChange={(event) => updateField("categoryId", event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </article>

        {/* گالری شش‌تصویری */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <Images size={18} style={{ verticalAlign: "middle" }} /> گالری تصاویر محصول
            </h2>
            <p className={styles.panelSub}>
              تصویر اول اصلی و پنج تصویر بعدی گالری هستند.
            </p>
          </header>

          <div className={styles.panelBody}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 16,
              }}
            >
              {Array.from({ length: 6 }, (_, index) => {
                const isMain = index === 0;
                const imageValue = isMain
                  ? formData.mainImage
                  : getGalleryImage(index - 1);

                const enabled = isMain || gallerySlotEnabled(index - 1);

                return (
                  <div
                    key={index}
                    style={{
                      gridColumn: isMain ? "1 / -1" : undefined,
                      padding: 16,
                      border: "1px solid #e8e4df",
                      borderRadius: 10,
                      background: "#fffdf9",
                      opacity: enabled ? 1 : 0.5,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <strong className={styles.label}>
                        تصویر شماره {index + 1}
                      </strong>
                      <span className={styles.help}>
                        {isMain ? "تصویر اصلی" : "تصویر گالری"}
                      </span>
                    </div>

                    <ImageUploaderClient
                      value={imageValue}
                      scope="products"
                      disabled={busy || !enabled}
                      onChange={(url) => {
                        if (isMain) {
                          updateField("mainImage", url);
                        } else {
                          updateGalleryImage(index - 1, url);
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
              })}
            </div>
          </div>
        </article>

        {/* ستون راست */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <AlignRight size={18} style={{ verticalAlign: "middle" }} /> متن‌های سمت راست
            </h2>
            <p className={styles.panelSub}>
              عنوان و اطلاعات کنار تصویر محصول
            </p>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span className={styles.label}>نام انگلیسی محصول</span>
                <input
                  className={styles.input}
                  value={formData.englishName}
                  maxLength={160}
                  disabled={busy}
                  onChange={(event) => updateField("englishName", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>عنوان مجموعه</span>
                <input
                  className={styles.input}
                  value={formData.seriesTitle}
                  maxLength={160}
                  disabled={busy}
                  onChange={(event) => updateField("seriesTitle", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>زیرعنوان مجموعه</span>
                <input
                  className={styles.input}
                  value={formData.seriesTagline}
                  maxLength={300}
                  disabled={busy}
                  onChange={(event) => updateField("seriesTagline", event.target.value)}
                />
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>توضیح کوتاه سمت راست</span>
                <textarea
                  className={styles.textarea}
                  value={formData.shortDescription}
                  maxLength={500}
                  disabled={busy}
                  onChange={(event) => updateField("shortDescription", event.target.value)}
                />
              </label>
            </div>
          </div>
        </article>

        {/* ستون چپ */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <AlignLeft size={18} style={{ verticalAlign: "middle" }} /> متن‌های سمت چپ
            </h2>
            <p className={styles.panelSub}>
              توضیحات و اطلاعات تکمیلی محصول
            </p>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.gridTwo}>
              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>توضیحات اصلی سمت چپ</span>
                <textarea
                  className={styles.textarea}
                  value={formData.leftDescription}
                  maxLength={5000}
                  disabled={busy}
                  onChange={(event) => updateField("leftDescription", event.target.value)}
                />
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>محتوای DETAILS</span>
                <textarea
                  className={styles.textarea}
                  value={formData.detailsContent}
                  maxLength={5000}
                  disabled={busy}
                  placeholder={"Leather: Veg-tan Cow Leather\nSize: A5"}
                  onChange={(event) => updateField("detailsContent", event.target.value)}
                />
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>
                  محتوای PREPARATION & SHIPPING
                </span>
                <textarea
                  className={styles.textarea}
                  value={formData.shippingContent}
                  maxLength={5000}
                  disabled={busy}
                  onChange={(event) => updateField("shippingContent", event.target.value)}
                />
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span className={styles.label}>توضیحات کامل قدیمی</span>
                <textarea
                  className={styles.textarea}
                  value={formData.fullDescription}
                  maxLength={5000}
                  disabled={busy}
                  onChange={(event) => updateField("fullDescription", event.target.value)}
                />
              </label>
            </div>
          </div>
        </article>

        {/* قیمت و موجودی */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>قیمت و موجودی</h2>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span className={styles.label}>قیمت محصول — تومان</span>
                <input
                  className={`${styles.input} ${styles.ltr}`}
                  type="number"
                  min={0}
                  step={1}
                  value={formData.price}
                  disabled={busy}
                  onChange={(event) => updateField("price", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>موجودی</span>
                <input
                  className={`${styles.input} ${styles.ltr}`}
                  type="number"
                  min={0}
                  step={1}
                  value={formData.stock}
                  disabled={busy}
                  onChange={(event) => updateField("stock", event.target.value)}
                />
              </label>
            </div>
          </div>
        </article>

        {/* مشخصات فیزیکی */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <Package size={18} style={{ verticalAlign: "middle" }} /> مشخصات محصول
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
                  disabled={busy}
                  onChange={(event) => updateField("material", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>ابعاد</span>
                <input
                  className={styles.input}
                  value={formData.dimensions}
                  maxLength={200}
                  disabled={busy}
                  onChange={(event) => updateField("dimensions", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>وزن</span>
                <input
                  className={styles.input}
                  value={formData.weight}
                  maxLength={100}
                  disabled={busy}
                  onChange={(event) => updateField("weight", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>تگ‌ها</span>
                <input
                  className={styles.input}
                  value={formData.tags}
                  disabled={busy}
                  placeholder="چرم, کیف, دست‌دوز"
                  onChange={(event) => updateField("tags", event.target.value)}
                />
              </label>
            </div>
          </div>
        </article>

        {/* وضعیت */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>وضعیت فروشگاه</h2>
          </header>

          <div className={styles.panelBody}>
            <label className={styles.field}>
              <span className={styles.label}>وضعیت محصول</span>
              <select
                className={styles.select}
                value={formData.isAvailable ? "available" : "unavailable"}
                disabled={busy}
                onChange={(event) =>
                  updateField("isAvailable", event.target.value === "available")
                }
              >
                <option value="available">فعال در فروشگاه</option>
                <option value="unavailable">غیرفعال</option>
              </select>
            </label>
          </div>
        </article>

        {/* نتیجه عملیات */}
        {(error || success) && (
          <article className={styles.panel}>
            <div className={styles.panelBody}>
              <p
                className={styles.description}
                style={{ color: error ? "#b42318" : "#16803c" }}
              >
                {error || success}
              </p>
            </div>
          </article>
        )}

        {/* دکمه ذخیره */}
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
              disabled={busy}
            >
              {submitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>
        </article>

        {/* حذف محصول */}
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>حذف محصول</h2>
            <p className={styles.panelSub}>این عملیات دائمی است.</p>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.dangerZone}>
              <h3 className={styles.dangerTitle}>
                حذف دائمی محصول
              </h3>

              <p className={styles.dangerText}>
                با حذف این محصول، دیگر در پنل و فروشگاه نمایش داده نمی‌شود.
                اطلاعات snapshot سفارش‌های قدیمی حفظ خواهد شد.
              </p>

              {deleteError && (
                <p className={styles.dangerText}>
                  {deleteError}
                </p>
              )}

              {!deleteArmed ? (
                <button
                  type="button"
                  className={styles.deleteButton}
                  disabled={busy}
                  onClick={() => setDeleteArmed(true)}
                >
                  <Trash2 size={15} style={{ verticalAlign: "middle" }} />
                  {" "}حذف دائمی محصول
                </button>
              ) : (
                <div className={styles.deleteConfirm}>
                  <p className={styles.deleteConfirmText}>
                    آیا مطمئن هستید که می‌خواهید «{product.name}» را حذف کنید؟
                  </p>

                  <div className={styles.deleteConfirmActions}>
                    <button
                      type="button"
                      className={styles.deleteConfirmButton}
                      disabled={busy}
                      onClick={handleDelete}
                    >
                      {deleting ? "در حال حذف..." : "بله، حذف شود"}
                    </button>

                    <button
                      type="button"
                      className={styles.deleteCancelButton}
                      disabled={busy}
                      onClick={() => {
                        setDeleteArmed(false);
                        setDeleteError("");
                      }}
                    >
                      منصرف شدم
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>
      </div>

      {/* ستون پیش‌نمایش */}
      <aside className={styles.side}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>پیش‌نمایش گالری</h2>
            <p className={styles.panelSub}>شش تصویر محصول</p>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.imagePreview}>
              {formData.mainImage ? (
                <img
                  src={formData.mainImage}
                  alt={formData.name}
                />
              ) : (
                <div className={styles.imageFallback}>V</div>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 5,
                marginTop: 10,
              }}
            >
              {Array.from({ length: 5 }, (_, index) => {
                const url = getGalleryImage(index);

                return (
                  <div
                    key={index}
                    style={{
                      aspectRatio: "1",
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
                          width: "100%",
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                          color: "#aaa",
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
            <h2 className={styles.panelTitle}>وضعیت فعلی محصول</h2>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.statusBox}>
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>نمایش</span>
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
                <span className={styles.statusLabel}>موجودی</span>
                <strong className={styles.statusValue}>
                  {formData.stock || "۰"}
                </strong>
              </div>

              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>دسته‌بندی</span>
                <strong className={styles.statusValue}>
                  {selectedCategory?.title || "—"}
                </strong>
              </div>

              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>تصاویر</span>
                <strong className={styles.statusValue}>
                  {Number(Boolean(formData.mainImage)) +
                    formData.images.length} / 6
                </strong>
              </div>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>پیش‌نمایش متن‌ها</h2>
          </header>

          <div className={styles.panelBody}>
            <p className={styles.label}>سمت راست</p>
            <p>{formData.englishName || "نام انگلیسی محصول"}</p>
            <h3>{formData.seriesTitle || "عنوان مجموعه"}</h3>
            <p>{formData.seriesTagline || "زیرعنوان مجموعه"}</p>
            <p className={styles.description}>
              {formData.shortDescription || "توضیحات کوتاه محصول"}
            </p>

            <hr />

            <p className={styles.label}>سمت چپ</p>
            <p className={styles.description}>
              {formData.leftDescription || "توضیحات سمت چپ محصول"}
            </p>
          </div>
        </article>
      </aside>
    </form>
  );
}
