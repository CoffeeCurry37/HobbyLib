import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Collector Radar · 收藏雷达",
  description: "收藏商品库、特典关联与购买优先级工作台。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
