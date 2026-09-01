"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useState,
} from "react";

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

  const [error, setError] =
    useState("");

  function updateField<
    K extends keyof ProductFormState
  >(
    field: K,
    value: ProductFormState[K]
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function addGalleryImage(
    publicUrl: string
  ) {
    const cleanUrl = publicUrl.trim();

    if (!cleanUrl) {
      return;
    }

    setFormData((current) => {
      if (
        current.images.includes(cleanUrl)
      ) {
        return current;
      }

      return {
        ...current,
        images: [
          ...current.images,
          cleanUrl,
        ],
      };
    });

    if (error) {
      setError("");
    }
  }

  function removeGalleryImage(
    imageIndex: number
  ) {
    setFormData((current) => ({
      ...current,
      images: current.images.filter(
        (_image, index) =>
          index !== imageIndex
      ),
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const name =
      formData.name.trim();

    const slug =
      formData.slug.trim();

    const price = Number(
      formData.price
    );

    const stock = Number(
      formData.stock
    );

    const categoryId = Number(
      formData.categoryId
    );

    const mainImage =
      formData.mainImage.trim();

    const images =
      formData.images
        .map((item) => item.trim())
        .filter(Boolean);

    /*
      تگ‌ها با کاما جدا می‌شوند.
    */
    const tags =
      formData.tags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    if (
      name.length < 2 ||
      name.length > 160
    ) {
      setError(
        "نام محصول باید بین ۲ تا ۱۶۰ کاراکتر باشد."
      );
      return;
    }

    if (
      slug.length < 2 ||
      slug.length > 160 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
        slug
      )
    ) {
      setError(
        "Slug معتبر نیست. فقط حروف انگلیسی کوچک، عدد و خط تیره مجاز است."
      );
      return;
    }

    if (
      !Number.isSafeInteger(price) ||
      price < 0
    ) {
      setError(
        "قیمت محصول معتبر نیست."
      );
      return;
    }

    if (
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      setError(
        "موجودی محصول معتبر نیست."
      );
      return;
    }

    if (
      !Number.isInteger(categoryId) ||
      categoryId < 1
    ) {
      setError(
        "یک دسته‌بندی معتبر انتخاب کنید."
      );
      return;
    }

    if (!mainImage) {
      setError(
        "ابتدا تصویر اصلی محصول را آپلود کنید."
      );
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
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            slug,

            shortDescription:
              formData.shortDescription.trim(),

            fullDescription:
              formData.fullDescription.trim(),

            price,
            stock,

            mainImage,
            images,

            tags,

            material:
              formData.material.trim(),

            dimensions:
              formData.dimensions.trim(),

            weight:
              formData.weight.trim(),

            categoryId,

            isAvailable:
              formData.isAvailable,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!data) {
        setError(
          "پاسخ نامعتبر از سرور دریافت شد."
        );
        return;
      }

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.message ||
            "افزودن محصول انجام نشد."
        );
        return;
      }

      /*
        بعد از ساخت موفق،
        مستقیم وارد صفحه ویرایش همان محصول می‌شویم.
      */
      router.push(
        `/admin/products/${data.product.id}`
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Product creation failed:",
        error
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
      {/* MAIN */}
      <div className={styles.main}>
        {/* BASIC */}
        <article className={styles.panel}>
          <header
            className={
              styles.panelHeader
            }
          >
            <h2
              className={
                styles.panelTitle
              }
            >
              اطلاعات اصلی
            </h2>

            <p
              className={styles.panelSub}
            >
              نام، آدرس محصول و دسته‌بندی
            </p>
          </header>

          <div
            className={styles.panelBody}
          >
            <div
              className={styles.gridTwo}
            >
              <label
                className={`${styles.field} ${styles.fieldFull}`}
              >
                <span
                  className={styles.label}
                >
                  نام محصول
                </span>

                <input
                  className={styles.input}
                  type="text"
                  value={formData.name}
                  maxLength={160}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                />
              </label>

              <label
                className={styles.field}
              >
                <span
                  className={styles.label}
                >
                  Slug
                </span>

                <input
                  className={`${styles.input} ${styles.ltr}`}
                  type="text"
                  value={formData.slug}
                  maxLength={160}
                  spellCheck={false}
                  disabled={submitting}
                  placeholder="leather-wallet"
                  onChange={(event) =>
                    updateField(
                      "slug",
                      event.target.value
                    )
                  }
                />

                <p className={styles.help}>
                  فقط حروف انگلیسی کوچک،
                  عدد و خط تیره.
                </p>
              </label>

              <label
                className={styles.field}
              >
                <span
                  className={styles.label}
                >
                  دسته‌بندی
                </span>

                <select
                  className={styles.select}
                  value={
                    formData.categoryId
                  }
                  disabled={
                    submitting ||
                    categories.length === 0
                  }
                  onChange={(event) =>
                    updateField(
                      "categoryId",
                      event.target.value
                    )
                  }
                >
                  {categories.length ===
                  0 ? (
                    <option value="">
                      دسته‌بندی‌ای وجود ندارد
                    </option>
                  ) : (
                    categories.map(
                      (category) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {
                            category.title
                          }
                        </option>
                      )
                    )
                  )}
                </select>
              </label>
            </div>
          </div>
        </article>

        {/* DESCRIPTION */}
        <article className={styles.panel}>
          <header
            className={
              styles.panelHeader
            }
          >
            <h2
              className={
                styles.panelTitle
              }
            >
              توضیحات محصول
            </h2>

            <p
              className={styles.panelSub}
            >
              متن کوتاه و توضیحات کامل
              صفحه محصول
            </p>
          </header>

          <div
            className={styles.panelBody}
          >
            <div
              className={styles.gridTwo}
            >
              <label
                className={`${styles.field} ${styles.fieldFull}`}
              >
                <span
                  className={styles.label}
                >
                  توضیح کوتاه
                </span>

                <textarea
                  className={
                    styles.textarea
                  }
                  value={
                    formData.shortDescription
                  }
                  maxLength={500}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField(
                      "shortDescription",
                      event.target.value
                    )
                  }
                />
              </label>

              <label
                className={`${styles.field} ${styles.fieldFull}`}
              >
                <span
                  className={styles.label}
                >
                  توضیحات کامل
                </span>

                <textarea
                  className={
                    styles.textarea
                  }
                  value={
                    formData.fullDescription
                  }
                  maxLength={5000}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField(
                      "fullDescription",
                      event.target.value
                    )
                  }
                />
              </label>
            </div>
          </div>
        </article>

        {/* PRICE + STOCK */}
        <article className={styles.panel}>
          <header
            className={
              styles.panelHeader
            }
          >
            <h2
              className={
                styles.panelTitle
              }
            >
              قیمت و موجودی
            </h2>
          </header>

          <div
            className={styles.panelBody}
          >
            <div
              className={styles.gridTwo}
            >
              <label
                className={styles.field}
              >
                <span
                  className={styles.label}
                >
                  قیمت — تومان
                </span>

                <input
                  className={`${styles.input} ${styles.ltr}`}
                  type="number"
                  min={0}
                  step={1}
                  value={formData.price}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField(
                      "price",
                      event.target.value
                    )
                  }
                />
              </label>

              <label
                className={styles.field}
              >
                <span
                  className={styles.label}
                >
                  موجودی اولیه
                </span>

                <input
                  className={`${styles.input} ${styles.ltr}`}
                  type="number"
                  min={0}
                  step={1}
                  value={formData.stock}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField(
                      "stock",
                      event.target.value
                    )
                  }
                />
              </label>
            </div>
          </div>
        </article>

        {/* IMAGES */}
        <article className={styles.panel}>
          <header
            className={
              styles.panelHeader
            }
          >
            <h2
              className={
                styles.panelTitle
              }
            >
              تصاویر
            </h2>

            <p
              className={styles.panelSub}
            >
              تصویر اصلی و تصاویر تکمیلی
              مستقیماً در فضای ابری Valinor
              آپلود می‌شوند.
            </p>
          </header>

          <div
            className={styles.panelBody}
          >
            <div
              className={styles.gridTwo}
            >
              <div
                className={`${styles.field} ${styles.fieldFull}`}
              >
                <span
                  className={styles.label}
                >
                  تصویر اصلی
                </span>

                <ImageUploaderClient
                  value={
                    formData.mainImage
                  }
                  scope="products"
                  disabled={submitting}
                  onChange={(publicUrl) =>
                    updateField(
                      "mainImage",
                      publicUrl
                    )
                  }
                />

                <p className={styles.help}>
                  این تصویر در کارت محصول،
                  فهرست محصولات و ابتدای صفحه
                  محصول استفاده می‌شود.
                </p>
              </div>

              <div
                className={`${styles.field} ${styles.fieldFull}`}
              >
                <span
                  className={styles.label}
                >
                  تصاویر تکمیلی
                </span>

                {formData.images.length >
                  0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: "12px",
                      marginBottom: "18px",
                    }}
                  >
                    {formData.images.map(
                      (
                        imageUrl,
                        imageIndex
                      ) => (
                        <div
                          key={imageUrl}
                          style={{
                            overflow:
                              "hidden",
                            border:
                              "1px solid #e8e4df",
                            background:
                              "#fffdf9",
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={`تصویر تکمیلی ${
                              imageIndex + 1
                            }`}
                            style={{
                              width:
                                "100%",
                              aspectRatio:
                                "1 / 1",
                              display:
                                "block",
                              objectFit:
                                "cover",
                              background:
                                "#f4f0eb",
                            }}
                          />

                          <button
                            type="button"
                            disabled={
                              submitting
                            }
                            onClick={() =>
                              removeGalleryImage(
                                imageIndex
                              )
                            }
                            style={{
                              width:
                                "100%",
                              minHeight:
                                "36px",
                              border: 0,
                              borderTop:
                                "1px solid #e8e4df",
                              background:
                                "#fffdf9",
                              color:
                                "#746d67",
                              font:
                                "inherit",
                              fontSize:
                                "10px",
                              cursor:
                                submitting
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                submitting
                                  ? 0.5
                                  : 1,
                            }}
                          >
                            حذف از گالری
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}

                <ImageUploaderClient
                  value=""
                  scope="products"
                  disabled={submitting}
                  onChange={
                    addGalleryImage
                  }
                />

                <p className={styles.help}>
                  برای اضافه‌کردن تصاویر
                  بیشتر، هر بار یک تصویر
                  انتخاب و آپلود کن. حذف از
                  این بخش فقط اتصال تصویر به
                  این محصول را حذف می‌کند و
                  فایل ابری را پاک نمی‌کند.
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* DETAILS */}
        <article className={styles.panel}>
          <header
            className={
              styles.panelHeader
            }
          >
            <h2
              className={
                styles.panelTitle
              }
            >
              مشخصات
            </h2>
          </header>

          <div
            className={styles.panelBody}
          >
            <div
              className={styles.gridTwo}
            >
              <label
                className={styles.field}
              >
                <span
                  className={styles.label}
                >
                  متریال
                </span>

                <input
                  className={styles.input}
                  type="text"
                  value={
                    formData.material
                  }
                  maxLength={200}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField(
                      "material",
                      event.target.value
                    )
                  }
                />
              </label>

              <label
                className={styles.field}
              >
                <span
                  className={styles.label}
                >
                  ابعاد
                </span>

                <input
                  className={styles.input}
                  type="text"
                  value={
                    formData.dimensions
                  }
                  maxLength={200}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField(
                      "dimensions",
                      event.target.value
                    )
                  }
                />
              </label>

              <label
                className={styles.field}
              >
                <span
                  className={styles.label}
                >
                  وزن
                </span>

                <input
                  className={styles.input}
                  type="text"
                  value={formData.weight}
                  maxLength={100}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField(
                      "weight",
                      event.target.value
                    )
                  }
                />
              </label>

              <label
                className={styles.field}
              >
                <span
                  className={styles.label}
                >
                  تگ‌ها
                </span>

                <input
                  className={styles.input}
                  type="text"
                  value={formData.tags}
                  disabled={submitting}
                  placeholder="چرم, کیف, دست‌دوز"
                  onChange={(event) =>
                    updateField(
                      "tags",
                      event.target.value
                    )
                  }
                />

                <p className={styles.help}>
                  تگ‌ها را با کاما از هم جدا
                  کن.
                </p>
              </label>
            </div>
          </div>
        </article>

        {/* STATUS */}
        <article className={styles.panel}>
          <header
            className={
              styles.panelHeader
            }
          >
            <h2
              className={
                styles.panelTitle
              }
            >
              وضعیت فروشگاه
            </h2>
          </header>

          <div
            className={styles.panelBody}
          >
            <label
              className={styles.field}
            >
              <span
                className={styles.label}
              >
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
                onChange={(event) =>
                  updateField(
                    "isAvailable",
                    event.target.value ===
                      "available"
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

        {/* ERROR */}
        {error && (
          <article className={styles.panel}>
            <div
              className={styles.panelBody}
            >
              <p
                className={
                  styles.description
                }
              >
                {error}
              </p>
            </div>
          </article>
        )}

        {/* ACTIONS */}
        <article className={styles.panel}>
          <div className={styles.actions}>
            <Link
              href="/admin/products"
              className={
                styles.cancelLink
              }
            >
              انصراف
            </Link>

            <button
              type="submit"
              className={
                styles.saveButton
              }
              disabled={
                submitting ||
                categories.length === 0
              }
            >
              {submitting
                ? "در حال افزودن..."
                : "افزودن محصول"}
            </button>
          </div>
        </article>
      </div>

      {/* SIDE */}
      <aside className={styles.side}>
        <article className={styles.panel}>
          <header
            className={
              styles.panelHeader
            }
          >
            <h2
              className={
                styles.panelTitle
              }
            >
              پیش‌نمایش
            </h2>
          </header>

          <div
            className={styles.panelBody}
          >
            <div
              className={
                styles.imagePreview
              }
            >
              {formData.mainImage ? (
                <img
                  src={
                    formData.mainImage
                  }
                  alt={
                    formData.name ||
                    "Product"
                  }
                />
              ) : (
                <div
                  className={
                    styles.imageFallback
                  }
                >
                  V
                </div>
              )}
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <header
            className={
              styles.panelHeader
            }
          >
            <h2
              className={
                styles.panelTitle
              }
            >
              وضعیت اولیه
            </h2>
          </header>

          <div
            className={styles.panelBody}
          >
            <div
              className={styles.statusBox}
            >
              <div
                className={
                  styles.statusRow
                }
              >
                <span
                  className={
                    styles.statusLabel
                  }
                >
                  نمایش
                </span>

                <strong
                  className={`${styles.statusValue} ${
                    formData.isAvailable
                      ? styles.available
                      : styles.unavailable
                  }`}
                >
                  {formData.isAvailable
                    ? "فعال"
                    : "غیرفعال"}
                </strong>
              </div>

              <div
                className={
                  styles.statusRow
                }
              >
                <span
                  className={
                    styles.statusLabel
                  }
                >
                  موجودی
                </span>

                <strong
                  className={
                    styles.statusValue
                  }
                >
                  {formData.stock || "۰"}
                </strong>
              </div>
            </div>
          </div>
        </article>
      </aside>
    </form>
  );
}