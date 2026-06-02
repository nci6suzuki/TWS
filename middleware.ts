// middleware.ts（プロジェクトルート）
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  return updateSession(req);
}

// 重要：/api も通す（静的ファイルだけ除外）
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};