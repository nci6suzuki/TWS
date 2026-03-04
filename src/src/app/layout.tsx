import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Talent Management",
  description: "人材管理システム",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          fontFamily:
            "Inter, 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f1f5f9",
          color: "#0f172a",
        }}
      >
        {children}
      </body>
    </html>
  );
}