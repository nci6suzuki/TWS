export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-xl font-bold">権限がありません</div>
        <div className="mt-2 text-sm text-slate-600">管理者に確認してください。</div>
      </div>
    </div>
  );
}