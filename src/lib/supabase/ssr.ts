import {
  createBrowserClient as createBrowserClientSSR,
  createServerClient as createServerClientSSR,
} from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type CookieMethods = {
  getAll?: () => Array<{ name: string; value: string }>;
  setAll?: (
    cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>
  ) => void;
};

type ClientOptions = {
  cookies?: CookieMethods;
};

export function createBrowserClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: ClientOptions
): SupabaseClient {
  // ブラウザ側：sb- cookie を作る/更新する
  return createBrowserClientSSR(supabaseUrl, supabaseKey) as unknown as SupabaseClient;
}

export function createServerClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: ClientOptions
): SupabaseClient {
  // サーバ側：middleware.ts の updateSession と同じ cookies API を受け取る
  return createServerClientSSR(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return options?.cookies?.getAll?.() ?? [];
      },
      setAll(cookiesToSet) {
        options?.cookies?.setAll?.(
          cookiesToSet.map((c) => ({
            name: c.name,
            value: c.value,
            options: c.options as any,
          }))
        );
      },
    },
  }) as unknown as SupabaseClient;
}