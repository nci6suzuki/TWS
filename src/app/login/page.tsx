import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthLoginForm } from "@/components/auth-login-form";

const errorMessages: Record<string, string> = {
  missing: "メールアドレスとパスワードを入力してください。",
  invalid: "メールアドレスまたはパスワードが正しくありません。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const rawError = params.error;
  const errorKey = Array.isArray(rawError) ? rawError[0] : rawError;
  const errorMessage = errorKey ? errorMessages[errorKey] ?? null : null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-gray-100 to-white px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">Talent Management</h1>
        <p className="mt-2 text-sm text-gray-600">アカウント情報を入力してログインしてください。</p>
        <AuthLoginForm errorMessage={errorMessage} />
      </section>
    </main>
  );
}