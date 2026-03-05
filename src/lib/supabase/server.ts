// src/lib/supabase/server.ts
import { createServerClient } from "@/lib/supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

const ACCESS_TOKEN_COOKIE = "tm-access-token";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}