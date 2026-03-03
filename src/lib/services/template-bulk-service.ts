// src/lib/services/template-bulk-service.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { applyAnnualTemplateToEmployee } from "@/lib/services/template-service";

export async function bulkApplyTemplateToEmployees({
  templateId,
  branchId,
  departmentId,
  positionId,
  gradeId,
  employmentType,
  hireDateFrom,
  hireDateTo,
  skipIfAlreadyHasEvents = true,
  hrEmployeeId,
}: {
  templateId: string;
  branchId?: string;
  departmentId?: string;
  positionId?: string;
  gradeId?: string;
  employmentType?: string;
  hireDateFrom?: string;
  hireDateTo?: string;
  skipIfAlreadyHasEvents?: boolean;
  hrEmployeeId?: string | null;
}) {
  const supabase = createSupabaseServerClient();

  let q = supabase
    .from("employees")
    .select(`
      id,
      hire_date,
      manager_employee_id,
      mentor_employee_id,
      branch_id,
      department_id,
      position_id,
      grade_id,
      employment_type,
      status
    `)
    .eq("status", "active");

  if (branchId) q = q.eq("branch_id", branchId);
  if (departmentId) q = q.eq("department_id", departmentId);
  if (positionId) q = q.eq("position_id", positionId);
  if (gradeId) q = q.eq("grade_id", gradeId);
  if (employmentType) q = q.eq("employment_type", employmentType);
  if (hireDateFrom) q = q.gte("hire_date", hireDateFrom);
  if (hireDateTo) q = q.lte("hire_date", hireDateTo);

  const { data: employees, error } = await q;
  if (error) throw error;

  const targets = employees ?? [];

  let createdCount = 0;
  let skippedCount = 0;
  const details: Array<{ employeeId: string; status: "created" | "skipped" | "error"; reason?: string }> = [];

  for (const employee of targets) {
    try {
      if (!employee.hire_date) {
        skippedCount++;
        details.push({
          employeeId: employee.id,
          status: "skipped",
          reason: "hire_date が未設定",
        });
        continue;
      }

      if (skipIfAlreadyHasEvents) {
        const { count, error: countErr } = await supabase
          .from("employee_annual_events")
          .select("*", { count: "exact", head: true })
          .eq("employee_id", employee.id);

        if (countErr) throw countErr;

        if ((count ?? 0) > 0) {
          skippedCount++;
          details.push({
            employeeId: employee.id,
            status: "skipped",
            reason: "既存イベントあり",
          });
          continue;
        }
      }

      const result = await applyAnnualTemplateToEmployee({
        employeeId: employee.id,
        hireDate: employee.hire_date,
        templateId,
        managerEmployeeId: employee.manager_employee_id ?? null,
        mentorEmployeeId: employee.mentor_employee_id ?? null,
        hrEmployeeId: hrEmployeeId ?? null,
      });

      createdCount += result.createdCount;
      details.push({
        employeeId: employee.id,
        status: "created",
      });
    } catch (e: any) {
      skippedCount++;
      details.push({
        employeeId: employee.id,
        status: "error",
        reason: e?.message ?? "適用失敗",
      });
    }
  }

  return {
    targetCount: targets.length,
    createdCount,
    skippedCount,
    details,
  };
}