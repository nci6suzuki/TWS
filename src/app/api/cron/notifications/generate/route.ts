// src/app/api/cron/notifications/generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { generateNotifications } from "@/lib/notifications/generate-notifications";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "CRON_SECRET が設定されていません",
        },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const secretParam = req.nextUrl.searchParams.get("secret");

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || secretParam === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          message: "権限がありません",
        },
        { status: 401 }
      );
    }

    const result = await generateNotifications();

    return NextResponse.json({
      success: true,
      generated: result.generated,
      message: "通知を自動生成しました",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: e?.message ?? "通知の自動生成に失敗しました",
      },
      { status: 500 }
    );
  }
}