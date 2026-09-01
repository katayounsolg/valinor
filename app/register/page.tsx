"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function completeRegister() {
    if (!name.trim()) {
      alert("لطفاً اسمتون رو وارد کنید.");
      return;
    }

    try {
      setLoading(true);

      await fetch("/api/profile/name", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      router.push("/profile");
    } catch (error) {
      console.error(error);
      alert("خطایی رخ داد. دوباره امتحان کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "430px",
          background: "white",
          borderRadius: "32px",
          padding: "45px",
          boxShadow: "0 20px 60px rgba(0,0,0,.06)",
        }}
      >
        <h1
          style={{
            color: "#C08F8F",
            fontSize: "40px",
            marginBottom: "12px",
          }}
        >
          چی صداتون کنیم؟
        </h1>

        <p
          style={{
            color: "#7a7470",
            marginBottom: "30px",
          }}
        >
          اسمتون رو وارد کنید تا حساب کاربریتون کامل بشه.
        </p>

        <input
          type="text"
          placeholder="مثلاً: کتایون"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            height: "56px",
            borderRadius: "16px",
            border: "1px solid #ddd",
            padding: "0 18px",
            fontSize: "17px",
            marginBottom: "24px",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={completeRegister}
          disabled={loading}
          style={{
            width: "100%",
            height: "56px",
            border: "none",
            borderRadius: "18px",
            background: loading ? "#d8b5b5" : "#C08F8F",
            color: "white",
            fontSize: "17px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "در حال ثبت..." : "ورود به حساب"}
        </button>
      </div>
    </main>
  );
}