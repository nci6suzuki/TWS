// src/components/employees/panels/employee-career-panel.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Me } from "@/types/api";
import { CareerGoalForm } from "@/components/forms/career-goal-form";

export async function EmployeeCareerPanel({
  me,
  employeeId,
}: {
  me: Me;
  employeeId: string;
}) {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("employee_career_goals")
    .select(`
      employee_id,
      goal_1y,
      goal_3y,
      desired_role,
      desired_career_path,
      reskilling_interest,
      mobility_preference,
      self_comment
    `)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (error) throw error;

  const canEdit =
    me.role === "admin" ||
    me.role === "hr" ||
    me.employeeId === employeeId;

  return (
    <div className="space-y-4">
      <h2 className="font-medium">キャリア希望</h2>
      <CareerGoalForm
        employeeId={employeeId}
        canEdit={canEdit}
        initialData={{
          goal1y: data?.goal_1y ?? "",
          goal3y: data?.goal_3y ?? "",
          desiredRole: data?.desired_role ?? "",
          desiredCareerPath: data?.desired_career_path ?? "",
          reskillingInterest: data?.reskilling_interest ?? "",
          mobilityPreference: data?.mobility_preference ?? "",
          selfComment: data?.self_comment ?? "",
        }}
      />
    </div>
  );
}