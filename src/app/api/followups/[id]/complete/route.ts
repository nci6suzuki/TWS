// src/app/api/followups/[id]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { completeFollowup } from "@/lib/services/followup-service";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const me = await requireAuthApi();
    const { id } = await params;

    const res = await completeFollowup({ me, followupId: id });

    return NextResponse.json({ success: true, data: res });
  } catch (e: any) {
    const msg = e?.message ?? "ERROR";
    const code =
      msg === "FORBIDDEN"
        ? "FORBIDDEN"
        : msg === "NOT_FOUND"
          ? "NOT_FOUND"
          : "ERROR";
    const status = code === "FORBIDDEN" ? 403 : code === "NOT_FOUND" ? 404 : 500;

    return NextResponse.json(
      { success: false, error: { code, message: msg } },
      { status }
    );
  }
}