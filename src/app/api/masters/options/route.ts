import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    await requireAuthApi();
    const supabase = await createSupabaseServerClient();

    const categories = req.nextUrl.searchParams.getAll("category").filter(Boolean);

    if (categories.length === 0) {
      return NextResponse.json({ success: true, data: { grouped: {} } });
    }

    const { data, error } = await supabase
      .from("master_options")
      .select("id, category, value, label, sort_order, is_active")
      .in("category", categories)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true });

    if (error) {
      const message = String(error.message ?? "");
      if (message.includes('relation "master_options" does not exist')) {
        return NextResponse.json({ success: true, data: { grouped: {} } });
      }
      throw error;
    }

    const grouped = (data ?? []).reduce((acc: Record<string, any[]>, row: any) => {
      if (!acc[row.category]) acc[row.category] = [];
      acc[row.category].push({
        id: row.id,
        value: row.value,
        label: row.label,
        sortOrder: row.sort_order ?? 0,
      });
      return acc;
    }, {});

    return NextResponse.json({ success: true, data: { grouped } });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ERROR",
          message: e?.message ?? "取得に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}