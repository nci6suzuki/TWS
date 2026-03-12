// src/app/(protected)/annual-events/new/page.tsx
import { requireAuth } from "@/lib/auth/require-auth";
import { AnnualEventForm } from "@/components/forms/annual-event-form";
import { Card, CardText, CardTitle } from "@/components/ui/card";

export default async function AnnualEventNewPage() {
  const me = await requireAuth();

  return (
    <div className="space-y-5 max-w-3xl">
      <Card variant="elevated" style={{ padding: 0, overflow: "hidden" }}>
        <section style={{ padding: 24, background: "#f8fafc" }}>
          <CardTitle style={{ fontSize: 28 }}>年間イベント登録</CardTitle>
          <CardText style={{ marginTop: 10, fontSize: 14 }}>
            年間イベントを登録し、対象社員の運用ルールを設定します。
          </CardText>
        </section>
      </Card>
      <AnnualEventForm me={me} />
    </div>
  );
}