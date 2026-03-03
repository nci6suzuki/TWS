// src/app/(protected)/interviews/new/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { InterviewForm } from "@/components/forms/interview-form";
import { getFollowupById } from "@/lib/queries/followups";
import { getAnnualEventById } from "@/lib/queries/annual-events";

export default async function InterviewNewPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const me = await requireAuth();

  const assignmentId = searchParams.assignmentId;
  const annualEventId = searchParams.annualEventId;

  const preset = assignmentId ? await getFollowupById({ me, id: assignmentId }) : null;
  const annualEvent = annualEventId ? await getAnnualEventById({ me, id: annualEventId }) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">面談記録（新規）</h1>
      <InterviewForm me={me} preset={preset} annualEvent={annualEvent} />
    </div>
  );
}