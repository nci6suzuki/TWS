// src/components/employees/panels/employee-qualifications-panel.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { QualificationForm } from "@/components/forms/qualification-form";

export async function EmployeeQualificationsPanel({
  employeeId,
}: {
  employeeId: string;
}) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employee_qualifications")
    .select(`
      id,
      acquired_date,
      expires_on,
      status,
      memo,
      qualification_master:qualification_id ( name, category )
    `)
    .eq("employee_id", employeeId)
    .order("expires_on", { ascending: true });

  if (error) throw error;

  return (
    <div className="space-y-4">
      <QualificationForm employeeId={employeeId} />

      <div className="border rounded">
        {(data ?? []).length === 0 ? (
          <div className="p-3 text-sm text-gray-600">資格情報はありません。</div>
        ) : (
          <ul>
            {(data ?? []).map((item: any) => {
              const isNearExpiry =
                item.expires_on &&
                new Date(item.expires_on).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 90;

              return (
                <li key={item.id} className="p-3 border-b last:border-b-0 text-sm">
                  <div className="font-medium">{item.qualification_master?.name}</div>
                  <div>カテゴリ：{item.qualification_master?.category ?? "-"}</div>
                  <div>取得日：{item.acquired_date ?? "-"}</div>
                  <div className={isNearExpiry ? "text-red-600 font-medium" : ""}>
                    更新期限：{item.expires_on ?? "-"}
                  </div>
                  <div>状態：{item.status}</div>
                  <div>メモ：{item.memo ?? "-"}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}