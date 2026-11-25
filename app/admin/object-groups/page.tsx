"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { FolderTree, Layers3, Plus, RefreshCw } from "lucide-react";

type Group = {
  id: number;
  title: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  _count: { categories: number };
};

type GroupsResponse = {
  success?: boolean;
  message?: string;
  groups?: Group[];
};

const panelStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e7e1db",
  padding: "24px",
};

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  minWidth: 0,
  padding: "12px 14px",
  border: "1px solid #d8d2cc",
  borderRadius: 0,
  background: "#fff",
  color: "#222",
  font: "inherit",
  boxSizing: "border-box",
};

export default function AdminObjectGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/object-groups", {
        cache: "no-store",
      });
      const data = (await response.json()) as GroupsResponse;
      if (!response.ok || !data.success || !Array.isArray(data.groups)) {
        throw new Error(data.message || "دریافت گروه‌ها با خطا مواجه شد.");
      }
      setGroups(data.groups);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطای ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setMessage("");

    const order = Number(sortOrder);
    if (!Number.isSafeInteger(order) || order < -2147483648 || order > 2147483647) {
      setError("ترتیب نمایش باید عدد صحیح معتبر باشد.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/object-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim().toLowerCase(),
          sortOrder: order,
          isActive,
        }),
      });
      const data = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.message || "ایجاد گروه انجام نشد.");
      }
      setTitle("");
      setSlug("");
      setSortOrder("0");
      setIsActive(true);
      setMessage("گروه جدید با موفقیت ثبت شد.");
      await loadGroups();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطای ارتباط با سرور.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main dir="rtl" style={{ color: "#24211f", paddingBottom: 40 }}>
      <header style={{ marginBottom: 28 }}>
        <p style={{ color: "#958b83", letterSpacing: 2, fontSize: 11, marginBottom: 10 }}>
          OBJECT GROUP MANAGEMENT
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 500, margin: "0 0 12px" }}>
          گروه‌های محصولات
        </h1>
        <p style={{ margin: 0, color: "#716b65", lineHeight: 2 }}>
          گروه‌های بالای صفحه Objects را بسازید؛ مانند Notebooks، Planners و Bags.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 22, alignItems: "start" }}>
        <section style={panelStyle}>
          <h2 style={{ fontSize: 19, margin: "0 0 22px", display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={19} /> افزودن گروه
          </h2>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <label style={{ display: "grid", gap: 7, fontSize: 13 }}>
              عنوان گروه
              <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={2} maxLength={120} placeholder="مثلاً Bags" style={fieldStyle} />
            </label>
            <label style={{ display: "grid", gap: 7, fontSize: 13 }}>
              شناسه انگلیسی (Slug)
              <input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} required minLength={2} maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" title="فقط حروف کوچک انگلیسی، اعداد و خط تیره" dir="ltr" placeholder="bags" style={fieldStyle} />
              <small style={{ color: "#807971" }}>این شناسه باید برای هر گروه یکتا باشد.</small>
            </label>
            <label style={{ display: "grid", gap: 7, fontSize: 13 }}>
              ترتیب نمایش
              <input type="number" step="1" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} required style={fieldStyle} />
              <small style={{ color: "#807971" }}>عدد کوچک‌تر زودتر نمایش داده می‌شود.</small>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
              گروه فعال باشد
            </label>
            <button type="submit" disabled={saving} style={{ background: "#222", color: "white", border: 0, padding: "13px 18px", cursor: saving ? "wait" : "pointer", font: "inherit", opacity: saving ? 0.6 : 1 }}>
              {saving ? "در حال ذخیره..." : "ایجاد گروه"}
            </button>
          </form>
        </section>

        <section style={panelStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
            <h2 style={{ fontSize: 19, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Layers3 size={19} /> گروه‌های ثبت‌شده
            </h2>
            <button type="button" onClick={() => void loadGroups()} disabled={loading} aria-label="تازه‌سازی فهرست" style={{ border: "1px solid #ddd5cd", background: "transparent", padding: 9, cursor: "pointer" }}>
              <RefreshCw size={16} />
            </button>
          </div>
          {loading ? (
            <p style={{ color: "#777" }}>در حال دریافت گروه‌ها...</p>
          ) : groups.length === 0 ? (
            <p style={{ color: "#777", lineHeight: 2 }}>هنوز گروهی ساخته نشده است.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {groups.map((group) => (
                <article key={group.id} style={{ border: "1px solid #eee7e0", padding: 15 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <strong>{group.title}</strong>
                    <span style={{ fontSize: 12, color: group.isActive ? "#38744a" : "#8c7567" }}>
                      {group.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                  <p dir="ltr" style={{ textAlign: "right", margin: "9px 0", color: "#777", fontSize: 12 }}>{group.slug}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#777", display: "flex", gap: 7, alignItems: "center" }}>
                    <FolderTree size={14} /> {group._count.categories.toLocaleString("fa-IR")} دسته‌بندی · ترتیب {group.sortOrder.toLocaleString("fa-IR")}
                  </p>
                </article>
              ))}
            </div>
          )}
          <p style={{ color: "#807971", fontSize: 12, lineHeight: 2, margin: "18px 0 0" }}>
            اتصال دسته‌بندی‌ها به گروه‌ها را در مرحله بعد فعال می‌کنیم.
          </p>
          <Link href="/admin/categories" style={{ display: "inline-block", marginTop: 8, color: "#222", fontSize: 13 }}>
            مشاهده دسته‌بندی‌ها
          </Link>
        </section>
      </div>

      {error && <p role="alert" style={{ color: "#9e2727", background: "#fff1f1", padding: 14, marginTop: 18 }}>{error}</p>}
      {message && <p role="status" style={{ color: "#28633b", background: "#eff8f0", padding: 14, marginTop: 18 }}>{message}</p>}
    </main>
  );
}
