import Link from "next/link";

const quickLinks = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/employees", label: "社員一覧" },
  { href: "/annual-events", label: "年間イベント" },
  { href: "/notifications", label: "通知" },
];

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900">Talent Management</h1>
        <p className="mt-4 text-gray-700">
          人材情報・面談・フォローアップを一元管理するためのポータルです。
        </p>

        <section className="mt-10 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">クイックアクセス</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-md border px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}