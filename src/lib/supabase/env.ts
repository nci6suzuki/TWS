// src/lib/supabase/env.ts
function getEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const SUPABASE_URL: string = getEnv("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY: string = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");