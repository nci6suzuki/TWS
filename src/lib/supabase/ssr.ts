import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";

type CookieMethods = {
  getAll?: () => Array<{ name: string; value: string }>;
  setAll?: (
    cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>
  ) => void;
};

type ClientOptions = SupabaseClientOptions<"public"> & {
  cookies?: CookieMethods;
};

export function createBrowserClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: ClientOptions
): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, options);
}

export function createServerClient(
  supabaseUrl: string,
  supabaseKey: string,
  options?: ClientOptions
): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, options);
}