// src/components/forms/interview-form.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { createInterviewSchema } from "@/lib/validations/interview";
import type { Me, FollowupDetail } from "@/types/api";

type FormValues = z.infer<typeof createInterviewSchema>;

export function InterviewForm({ me, preset }: { me: Me; preset: FollowupDetail | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const employeeIdFromQuery = searchParams.get("employeeId") ?? undefined;

  const defaultEmployeeId = preset?.employeeId ?? employeeIdFromQuery ?? "";
  const defaultInterviewerId = me.employeeId; // 通常はログイン者

  const defaultValues: Partial<FormValues> = useMemo(() => {
    // 期限超過などでも、とにかく記録を残せるように最小初期値
    const nowIso = new Date().toISOString().slice(0, 16); // datetime-local用に後で整形
    const localDatetime = toDatetimeLocal(nowIso);

    return {
      employeeId: defaultEmployeeId,
      interviewerEmployeeId: defaultInterviewerId,
      interviewDate: localDatetime,
      interviewType: mapFollowupTypeToInterviewType(preset?.followupType) ?? "retention",
      assignmentId: preset?.id,
      visibility: "hr", // 最初は hr にしておくのが安全（運用で変更）
      autoCompleteAssignment: !!preset?.id, // presetから来たらON
    };
  }, [defaultEmployeeId, defaultInterviewerId, preset?.id, preset?.followupType]);

  const form = useForm<FormValues>({
    resolver: zodResolver(createInterviewSchema),
    defaultValues: defaultValues as FormValues,
    mode: "onChange",
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      // datetime-local → ISO に整形（API側がISO期待の場合）
      const payload = {
        ...values,
        interviewDate: fromDatetimeLocal(values.interviewDate),
      };

      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "保存に失敗しました");
      }

      const id = json.data.id as string;

      // 作成後の遷移：記録詳細へ
      router.push(`/interviews/${id}`);
      router.refresh();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  const watched = form.watch();
  const assignmentLinked = !!watched.assignmentId;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-3xl">
      {errorMsg && (
        <div className="p-3 border rounded bg-red-50 text-sm">
          {errorMsg}
        </div>
      )}

      {preset?.id && (
        <div className="p-3 border rounded bg-gray-50 text-sm">
          <div className="font-medium">フォロー割当から作成</div>
          <div>対象社員：{preset.employeeName}</div>
          <div>種別：{preset.followupType} / 期限：{preset.dueDate}</div>
          <div>担当：{preset.assigneeName}</div>
        </div>
      )}

      {/* 基本情報 */}
      <section className="p-4 border rounded space-y-3">
        <h2 className="font-medium">基本情報</h2>

        <Field label="対象社員ID（仮）" hint="まずはID入力。次にEmployeePickerへ置換推奨">
          <input
            className="w-full border rounded p-2"
            {...form.register("employeeId")}
            placeholder="employee uuid"
          />
          <ErrorText msg={form.formState.errors.employeeId?.message} />
        </Field>

        <Field label="面談者ID（仮）" hint="通常はログイン者のemployeeIdを自動セット">
          <input className="w-full border rounded p-2" {...form.register("interviewerEmployeeId")} />
          <ErrorText msg={form.formState.errors.interviewerEmployeeId?.message} />
        </Field>

        <Field label="面談日時">
          <input
            type="datetime-local"
            className="border rounded p-2"
            {...form.register("interviewDate")}
          />
          <ErrorText msg={form.formState.errors.interviewDate?.message} />
        </Field>

        <Field label="面談種別">
          <select className="border rounded p-2" {...form.register("interviewType")}>
            <option value="retention">定着</option>
            <option value="career">キャリア</option>
            <option value="performance">成果/業務</option>
            <option value="care">ケア</option>
            <option value="other">その他</option>
          </select>
          <ErrorText msg={form.formState.errors.interviewType?.message} />
        </Field>

        <Field label="公開範囲">
          <select className="border rounded p-2" {...form.register("visibility")}>
            <option value="self">本人公開</option>
            <option value="manager">上長まで</option>
            <option value="hr">人事まで</option>
            <option value="private_hr">人事機密</option>
          </select>
          <ErrorText msg={form.formState.errors.visibility?.message} />
        </Field>

        {/* フォロー割当連携 */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2">
            <input type="checkbox" {...form.register("autoCompleteAssignment")} />
            <span className="text-sm">割当を完了化する（assignment紐付け時）</span>
          </div>
          {assignmentLinked ? (
            <div className="text-xs text-gray-600 mt-1">
              assignmentId: {watched.assignmentId}
            </div>
          ) : (
            <div className="text-xs text-gray-600 mt-1">
              フォロー割当から来た場合は自動で紐づきます
            </div>
          )}
        </div>
      </section>

      {/* 面談内容 */}
      <section className="p-4 border rounded space-y-3">
        <h2 className="font-medium">面談内容</h2>

        <Field label="事実（観察・出来事）" hint="評価や解釈ではなく、起きたことを記述">
          <textarea className="w-full border rounded p-2 min-h-24" {...form.register("factsObserved")} />
        </Field>

        <Field label="本人の発言">
          <textarea className="w-full border rounded p-2 min-h-20" {...form.register("employeeVoice")} />
        </Field>

        <Field label="良かった点">
          <textarea className="w-full border rounded p-2 min-h-20" {...form.register("positivePoints")} />
        </Field>

        <Field label="課題">
          <textarea className="w-full border rounded p-2 min-h-20" {...form.register("issues")} />
        </Field>

        <Field label="対応方針">
          <textarea className="w-full border rounded p-2 min-h-20" {...form.register("responsePolicy")} />
        </Field>

        <div className="text-xs text-gray-600">
          ※「事実/発言/良かった点/課題/方針」のいずれかは必須（空欄のみ保存不可）
        </div>
        <ErrorText msg={form.formState.errors.root?.message} />
      </section>

      {/* 次回アクション */}
      <section className="p-4 border rounded space-y-3">
        <h2 className="font-medium">次回アクション</h2>

        <Field label="本人アクション（次回まで）">
          <textarea className="w-full border rounded p-2 min-h-16" {...form.register("actionEmployee")} />
        </Field>

        <Field label="会社/上長アクション（次回まで）">
          <textarea className="w-full border rounded p-2 min-h-16" {...form.register("actionCompany")} />
        </Field>

        <Field label="次回面談予定日（任意）">
          <input type="date" className="border rounded p-2" {...form.register("nextInterviewDate")} />
        </Field>
      </section>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded border bg-black text-white disabled:opacity-50"
        >
          {submitting ? "保存中..." : "保存する"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded border"
        >
          戻る
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: any }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{label}</div>
      {hint && <div className="text-xs text-gray-600">{hint}</div>}
      {children}
    </div>
  );
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div className="text-xs text-red-600">{msg}</div>;
}

// followupType -> interviewType 変換（preset用）
function mapFollowupTypeToInterviewType(v?: string) {
  if (!v) return null;
  if (v === "retention") return "retention";
  if (v === "career") return "career";
  if (v === "performance") return "performance";
  if (v === "care") return "care";
  return "other";
}

// datetime-local <-> ISO
function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromDatetimeLocal(local: string) {
  // local: "YYYY-MM-DDTHH:mm" -> ISO
  // ブラウザのローカル時間をISOへ
  const d = new Date(local);
  return d.toISOString();
}