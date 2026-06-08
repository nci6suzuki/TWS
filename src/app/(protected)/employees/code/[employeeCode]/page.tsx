// import { notFound } from "next/navigation";
// import { requireAuth } from "@/lib/auth/require-auth";
// import { getEmployeeProfileBookByCode } from "@/lib/queries/employee-profile";
// import { EmployeeProfileBook } from "@/components/employees/employee-profile-book";

// const TAB_DEFAULT = "basic";

// export default async function EmployeeByCodePage({
//   params,
//   searchParams,
// }: {
//   params: { employeeCode: string };
//   searchParams: Record<string, string | undefined>;
// }) {
//   await requireAuth();
//   const tab = searchParams.tab ?? TAB_DEFAULT;

//   const book = await getEmployeeProfileBookByCode(params.employeeCode);
//   if (!book) return notFound();

//   return (
//     <EmployeeProfileBook
//       employee={book.employee}
//       profile={book.profile}
//       goals={book.goals}
//       qualifications={book.qualifications}
//       events={book.events}
//       interviews={book.interviews}
//       activeTab={tab}
//     />
//   );
// }

import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export default async function DebugEmployeeByCode({
  params,
}: {
  params: { employeeCode: string };
}) {
  const me = await requireAuth();
  const supabase = await createSupabaseServerDbClient();

  const code = decodeURIComponent(params.employeeCode).trim();

  // ① employee_code で検索（完全一致）
  const { data: byCode, error: byCodeErr } = await supabase
    .from("employees")
    .select("id, employee_code, name, email, app_role, status, user_id")
    .eq("employee_code", code)
    .maybeSingle();

  // ② 念のため ilike（大文字小文字違い対策）
  const { data: byCodeIlike, error: byCodeIlikeErr } = await supabase
    .from("employees")
    .select("id, employee_code, name")
    .ilike("employee_code", code)
    .maybeSingle();

  return (
    <div style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>Debug: /employees/code/{code}</h1>

      <h2 style={{ marginTop: 16, fontWeight: 700 }}>me</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(me, null, 2)}
      </pre>

      <h2 style={{ marginTop: 16, fontWeight: 700 }}>employees by employee_code (eq)</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify({ byCode, byCodeErr: byCodeErr?.message ?? null }, null, 2)}
      </pre>

      <h2 style={{ marginTop: 16, fontWeight: 700 }}>employees by employee_code (ilike)</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify({ byCodeIlike, byCodeIlikeErr: byCodeIlikeErr?.message ?? null }, null, 2)}
      </pre>
    </div>
  );
}