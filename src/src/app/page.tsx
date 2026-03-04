import Link from "next/link";
import { Card, CardText, CardTitle } from "@/components/ui/card";

const quickLinks = [
  { href: "/login", label: "ログイン", description: "セキュアにサインイン", accent: "#60a5fa" },
  { href: "/dashboard", label: "ダッシュボード", description: "全体状況を俯瞰", accent: "#818cf8" },
  { href: "/employees", label: "社員一覧", description: "人材データを管理", accent: "#22d3ee" },
  { href: "/annual-events", label: "年間イベント", description: "重要日程を把握", accent: "#38bdf8" },
  { href: "/notifications", label: "通知", description: "最新アラートを確認", accent: "#c084fc" },
];

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        padding: "58px 24px",
        background:
          "radial-gradient(circle at 8% 8%, rgba(56, 189, 248, 0.25), transparent 24%), radial-gradient(circle at 92% 12%, rgba(99, 102, 241, 0.28), transparent 30%), linear-gradient(165deg, #eef2ff, #f8fafc 45%, #e2e8f0)",
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1080 }}>
        <Card variant="elevated" style={{ borderRadius: 34, padding: 40 }}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.22em", fontWeight: 800, color: "#4f46e5" }}>
            SMART HR WORKSPACE
          </p>
          <h1 style={{ margin: "10px 0 0", fontSize: 56, lineHeight: 1, color: "#0f172a" }}>Talent Management</h1>
          <CardText style={{ marginTop: 18, maxWidth: 720, fontSize: 17, lineHeight: 1.7 }}>
            人材情報・面談・フォローアップを横断して管理できる、洗練されたワークスペースです。
            KPIや通知を直感的に確認し、次のアクションへスムーズに進めます。
          </CardText>

          <section style={{ marginTop: 34 }}>
            <CardTitle style={{ fontSize: 31 }}>クイックアクセス</CardTitle>
            <ul
              style={{
                listStyle: "none",
                margin: "20px 0 0",
                padding: 0,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} style={{ textDecoration: "none" }}>
                    <Card
                      style={{
                        padding: "16px 18px",
                        borderRadius: 18,
                        border: `1px solid ${link.accent}44`,
                        background: `linear-gradient(145deg, #ffffff, ${link.accent}15)`,
                        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.1)",
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{link.label}</div>
                      <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>{link.description}</div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Card>
      </div>
    </main>
  );
}