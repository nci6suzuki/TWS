// src/app/api/notifications/generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { generateNotifications } from "@/lib/notifications/generate-notifications";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth();

    if (me.role !== "admin" && me.role !== "hr") {
      return NextResponse.redirect(new URL("/unauthorized", req.url), {
        status: 303,
      });
    }

    const result = await generateNotifications();

    return NextResponse.redirect(
      new URL(`/notifications?generated=${result.generated}`, req.url),
      { status: 303 }
    );
  } catch (e: any) {
    return NextResponse.redirect(
      new URL(
        `/notifications?error=${encodeURIComponent(
          e?.message ?? "通知生成に失敗しました"
        )}`,
        req.url
      ),
      { status: 303 }
    );
  }
}