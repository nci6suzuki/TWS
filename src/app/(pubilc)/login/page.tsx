import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AuthLoginForm } from "@/components/auth-login-form";
import { Card, CardText } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const errorMessages: Record<string, string> = {
  missing: "メールアドレスとパスワードを入力してください。",
  invalid: "メールアドレスまたはパスワードが正しくありません。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("tm-access-token")?.value;

  if (accessToken) {
    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);

    if (user) {
      redirect("/dashboard");
    }
  }

  const params = await searchParams;
  const rawError = params.error;
  const errorKey = Array.isArray(rawError) ? rawError[0] : rawError;
  const errorMessage = errorKey ? errorMessages[errorKey] ?? null : null;

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background:
          "radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.45), transparent 30%), radial-gradient(circle at 80% 5%, rgba(14, 165, 233, 0.4), transparent 30%), radial-gradient(circle at 85% 80%, rgba(168, 85, 247, 0.35), transparent 40%), linear-gradient(145deg, #020617, #0f172a)",
      }}
    >
      <Card variant="dark" style={{ width: "100%", maxWidth: 480, borderRadius: 28, padding: 34 }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.22em", fontWeight: 700, color: "#93c5fd" }}>
          WELCOME BACK
        </p>
        <h1 style={{ margin: "14px 0 0", fontSize: 44, lineHeight: 1.1, color: "#f8fafc" }}>
          Talent
          <br />
          Management
        </h1>
        <CardText style={{ marginTop: 14, fontSize: 14, color: "#cbd5e1" }}>
          アカウント情報を入力してログインしてください。
        </CardText>
        <AuthLoginForm errorMessage={errorMessage} />
      </Card>
    </main>
  );
}