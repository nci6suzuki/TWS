import { requireAuthApi } from "@/lib/auth/require-auth-api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  await requireAuthApi();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employee_qualifications")
    .select(`
      acquired_date,
      expires_on,
      status,
      memo,
      employees:employee_id ( employee_code, name ),
      qualification_master:qualification_id ( name, category )
    `);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const rows = [
    ["社員番号", "氏名", "資格名", "カテゴリ", "取得日", "期限", "状態", "メモ"].join(","),
    ...(data ?? []).map((row: any) =>
      [
        escapeCsv(row.employees?.employee_code ?? ""),
        escapeCsv(row.employees?.name ?? ""),
        escapeCsv(row.qualification_master?.name ?? ""),
        escapeCsv(row.qualification_master?.category ?? ""),
        escapeCsv(row.acquired_date ?? ""),
        escapeCsv(row.expires_on ?? ""),
        escapeCsv(row.status ?? ""),
        escapeCsv(row.memo ?? ""),
      ].join(",")
    ),
  ].join("\n");

  return new Response(rows, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="qualification_expiry.csv"`,
    },
  });
}

function escapeCsv(value: string) {
  const escaped = String(value).replace(/"/g, '""');
  return `"${escaped}"`;
}