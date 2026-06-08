import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function decodeBase64ToUtf8(raw: string): string {
  // base64のpadding不足に対応
  const pad = raw.length % 4 === 0 ? raw : raw + "=".repeat(4 - (raw.length % 4));

  // Node runtime（Vercel serverless）では Buffer が確実
  // Edgeでも Buffer がある場合があるので優先
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B: any = (globalThis as any).Buffer;
  if (B) {
    return B.from(pad, "base64").toString("utf8");
  }

  // Edge fallback
  // @ts-ignore
  return decodeURIComponent(escape(atob(pad)));
}

async function getAccessTokenFromSbCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const all = cookieStore.getAll();

  const sb = all.find((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
  if (!sb?.value) return null;

  const raw = sb.value.startsWith("base64-") ? sb.value.slice("base64-".length) : sb.value;

  try {
    const text = decodeBase64ToUtf8(raw);
    const json = JSON.parse(text);
    return json?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function createSupabaseServerDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const accessToken = await getAccessTokenFromSbCookie();

  return createClient(url, anon, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}