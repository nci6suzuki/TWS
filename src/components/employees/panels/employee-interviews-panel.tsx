// src/components/employees/panels/employee-interviews-panel.tsx
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";

export async function EmployeeInterviewsPanel({ me, employeeId }: { me: Me; employeeId: string }) {
  const supabase = await createSupabaseServerClient();

  // 例：最新20件
  const { data, error } = await supabase
    .from("interview_records")
    .select("id, interview_date, interview_type, interviewer_employee_id, visibility")
    .eq("employee_id", employeeId)
    .order("interview_date", { ascending: false })
    .limit(20);

  if (error) throw error;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="font-medium">面談履歴</h2>
        <Link className="text-sm underline" href={`/interviews/new?employeeId=${employeeId}`}>
          面談記録を作成
        </Link>
      </div>

      <div className="border rounded">
        {(data ?? []).length === 0 ? (
          <div className="p-3 text-sm text-gray-600">まだ面談記録がありません。</div>
        ) : (
          <ul>
            {(data ?? []).map((r: any) => (
              <li key={r.id} className="p-3 border-b last:border-b-0 flex justify-between">
                <div className="text-sm">
                  <div className="font-medium">{new Date(r.interview_date).toLocaleString()}</div>
                  <div className="text-gray-600">種別：{r.interview_type}</div>
                </div>
                <Link className="text-sm underline" href={`/interviews/${r.id}`}>
                  詳細
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}