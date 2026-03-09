export default function UnauthorizedPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-bold">アクセス権限がありません</h1>
      <p className="mt-4 text-sm text-slate-600">
        このページを表示する権限がありません。必要な場合は管理者へ確認してください。
      </p>
    </main>
  );
}