// src/app/(protected)/interviews/new/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { InterviewForm } from "@/components/forms/interview-form";
import { getFollowupById } from "@/lib/queries/followups";

export default async function InterviewNewPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const me = await requireAuth();
  const assignmentId = searchParams.assignmentId;

  const preset = assignmentId ? await getFollowupById({ me, id: assignmentId }) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">面談記録（新規）</h1>
      <InterviewForm me={me} preset={preset} />
    </div>
  );
}