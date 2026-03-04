// src/app/(protected)/followups/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/require-auth";
import { getFollowupById } from "@/lib/queries/followups";
import { FollowupForm } from "@/components/forms/followup-form";

export default async function FollowupEditPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await requireAuth();
  const followup = await getFollowupById({ me, id: params.id });

  if (!followup) return notFound();

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-semibold">フォロー割当 編集</h1>
      <FollowupForm mode="edit" me={me} initialData={followup} />
    </div>
  );
}