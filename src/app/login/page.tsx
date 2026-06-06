// src/app/login/page.tsx
import Link from "next/link";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams?.error;

  const message =
    error === "missing"
      ? "メール/パスワードを入力してください"
      : error === "invalid"
      ? "メールまたはパスワードが違います"
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        action="/api/auth/login"
        method="post"
        className="w-full max-w-sm rounded-2xl border bg-white p-6 space-y-4"
      >
        <div className="text-xl font-bold">ログイン</div>

        <label className="grid gap-1">
          <span className="text-sm font-semibold text-slate-700">メール</span>
          <input
            name="email"
            type="email"
            className="w-full rounded-xl border p-3"
            placeholder="email"
            required
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-semibold text-slate-700">パスワード</span>
          <input
            name="password"
            type="password"
            className="w-full rounded-xl border p-3"
            placeholder="password"
            required
          />
        </label>

        {message && <div className="text-sm text-rose-600">{message}</div>}

        <button className="w-full h-11 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800">
          ログイン
        </button>

        <div className="text-xs text-slate-500">
          ※ログインできない場合は管理者に確認してください。
        </div>
      </form>
    </div>
  );
}