// src/app/(protected)/interviews/[id]/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function InterviewDetailPage({ params }: { params: { id: string } }) {
  await requireAuth();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("interview_records")
    .select(`
      id,
      interview_date,
      interview_type,
      visibility,
      facts_observed,
      employee_voice,
      positive_points,
      issues,
      response_policy,
      action_employee,
      action_company,
      next_interview_date,
      employees:employee_id ( id, name ),
      interviewer:interviewer_employee_id ( id, name )
    `)
    .eq("id", params.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return notFound();

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">面談記録 詳細</h1>

      <div className="p-4 border rounded space-y-1 text-sm">
        <div><span className="font-medium">対象：</span>{data.employees?.name}</div>
        <div><span className="font-medium">面談者：</span>{data.interviewer?.name}</div>
        <div><span className="font-medium">日時：</span>{new Date(data.interview_date).toLocaleString()}</div>
        <div><span className="font-medium">種別：</span>{data.interview_type}</div>
        <div><span className="font-medium">公開：</span>{data.visibility}</div>
      </div>

      <Section title="事実（観察・出来事）" text={data.facts_observed} />
      <Section title="本人の発言" text={data.employee_voice} />
      <Section title="良かった点" text={data.positive_points} />
      <Section title="課題" text={data.issues} />
      <Section title="対応方針" text={data.response_policy} />
      <Section title="本人アクション" text={data.action_employee} />
      <Section title="会社/上長アクション" text={data.action_company} />
      <Section title="次回面談予定日" text={data.next_interview_date} />
    </div>
  );
}

function Section({ title, text }: { title: string; text?: string | null }) {
  if (!text) return null;
  return (
    <div className="p-4 border rounded">
      <div className="font-medium mb-1">{title}</div>
      <div className="text-sm whitespace-pre-wrap">{text}</div>
    </div>
  );
}