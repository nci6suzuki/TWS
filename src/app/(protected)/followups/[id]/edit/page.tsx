// src/app/(protected)/followups/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getFollowupById } from "@/lib/queries/followups";
import { FollowupForm } from "@/components/forms/followup-form";
import { Card, CardText, CardTitle } from "@/components/ui/card";

export default async function FollowupEditPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await requireAuth();
  const followup = await getFollowupById({ me, id: params.id });

  if (!followup) return notFound();

  return (
    <div className="space-y-5 max-w-2xl">
      <Card variant="elevated" style={{ padding: 0, overflow: "hidden" }}>
        <section style={{ padding: 24, background: "#f8fafc" }}>
          <CardTitle style={{ fontSize: 28 }}>フォロー割当 編集</CardTitle>
          <CardText style={{ marginTop: 10, fontSize: 14 }}>
            フォロー担当者や期限などの割当情報を更新します。
          </CardText>
        </section>
      </Card>
      <FollowupForm mode="edit" me={me} initialData={followup} />
    </div>
  );
}