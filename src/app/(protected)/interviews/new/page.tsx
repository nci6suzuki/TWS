// src/app/(protected)/interviews/new/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { InterviewForm } from "@/components/forms/interview-form";
import { getFollowupById } from "@/lib/queries/followups";
import { getAnnualEventById } from "@/lib/queries/annual-events";
import { Card, CardText, CardTitle } from "@/components/ui/card";

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
    <div className="space-y-5">
      <Card variant="elevated" style={{ padding: 0, overflow: "hidden" }}>
        <section style={{ padding: 24, background: "#f8fafc" }}>
          <CardTitle style={{ fontSize: 28 }}>面談記録（新規）</CardTitle>
          <CardText style={{ marginTop: 10, fontSize: 14 }}>
            面談の記録を作成します。フォロー割当や年間イベントからの事前入力にも対応しています。
          </CardText>
        </section>
      </Card>
      <InterviewForm me={me} preset={preset} annualEvent={annualEvent} />
    </div>
  );
}