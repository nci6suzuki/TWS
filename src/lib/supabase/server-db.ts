import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function getAccessTokenFromSbCookie(): string | null {
  const cookieStore = cookies();
  const all = cookieStore.getAll();

  // sb-<project>-auth-token を探す
  const sb = all.find((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
  if (!sb?.value) return null;

  // value は "base64-xxxx" 形式が多い
  const raw = sb.value.startsWith("base64-") ? sb.value.slice("base64-".length) : sb.value;

  try {
    const json = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    return json?.access_token ?? null;
  } catch {
    return null;
  }
}

export function createSupabaseServerDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const accessToken = getAccessTokenFromSbCookie();

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