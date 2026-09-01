import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { CartProvider } from "@/src/context/CartContext";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Valinor",
  description: "Valinor Leather Store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={vazir.variable}
    >
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}