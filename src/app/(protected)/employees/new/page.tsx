import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerDbClient } from "@/lib/supabase/server-db";

export default async function EmployeeNewPage() {
  const me = await requireAuth();
  if (me.role !== "admin" && me.role !== "hr") redirect("/unauthorized");

  async function createEmployee(formData: FormData) {
    "use server";
    const supabase = await createSupabaseServerDbClient();

    const payload = {
      employee_code: String(formData.get("employee_code") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      app_role: String(formData.get("app_role") ?? "employee"),
      status: String(formData.get("status") ?? "active"),
      employment_type: String(formData.get("employment_type") ?? "full_time"),
    };

    const { error } = await supabase.from("employees").insert(payload);
    if (error) redirect(`/employees/new?error=${encodeURIComponent(error.message)}`);

    redirect("/employees");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6">
        <div className="text-2xl font-bold">社員登録</div>
        <div className="mt-2 text-sm text-slate-600">最小フォーム（後でマスタ連動に拡張）</div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <form action={createEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="社員番号" name="employee_code" required />
          <Field label="氏名" name="name" required />
          <Field label="メール" name="email" required type="email" />

          <Select
            label="ロール"
            name="app_role"
            options={[
              ["employee", "employee"],
              ["mentor", "mentor"],
              ["manager", "manager"],
              ["hr", "hr"],
              ["admin", "admin"],
            ]}
          />
          <Select
            label="在籍状態"
            name="status"
            options={[
              ["active", "active"],
              ["leave", "leave"],
              ["inactive", "inactive"],
            ]}
          />
          <Select
            label="雇用区分"
            name="employment_type"
            options={[
              ["full_time", "full_time"],
              ["contract", "contract"],
              ["part_time", "part_time"],
              ["other", "other"],
            ]}
          />

          <div className="md:col-span-2 flex gap-2 pt-2">
            <button className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">
              登録
            </button>
            <a
              href="/employees"
              className="h-11 inline-flex items-center rounded-xl border bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              戻る
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, required, type = "text" }: { label: string; name: string; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-slate-700">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </span>
      <input name={name} type={type} required={required} className="rounded-xl border p-3 text-sm" />
    </label>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: Array<[string, string]> }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select name={name} className="rounded-xl border p-3 text-sm bg-white">
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}