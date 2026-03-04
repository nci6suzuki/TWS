import { requireAuth } from "@/lib/auth/require-auth";
import { SetupProfileForm } from "@/components/forms/setup-profile-form";

export default async function SetupProfilePage() {
  const me = await requireAuth();

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">初回設定</h1>
      <p className="text-sm text-gray-600">
        初回ログインのため、プロフィールとキャリア希望を入力してください。
      </p>
      <SetupProfileForm me={me} />
    </div>
  );
}