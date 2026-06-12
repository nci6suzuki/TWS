"use client";

import { useState } from "react";

const templates = [
  {
    key: "onboarding_30",
    label: "入社30日面談",
    title: "入社30日面談",
    eventType: "interview",
    priority: "1",
    description:
      "入社後30日時点の状況確認。\n\n確認事項：\n・業務理解度\n・職場環境への適応状況\n・困っていること\n・今後のフォロー事項",
  },
  {
    key: "onboarding_90",
    label: "入社90日面談",
    title: "入社90日面談",
    eventType: "interview",
    priority: "1",
    description:
      "入社後90日時点の定着確認。\n\n確認事項：\n・業務習熟度\n・今後のキャリア希望\n・職場での課題\n・継続フォローの必要性",
  },
  {
    key: "half_evaluation",
    label: "半期評価",
    title: "半期評価",
    eventType: "evaluation",
    priority: "2",
    description:
      "半期評価の実施。\n\n確認事項：\n・目標達成状況\n・行動評価\n・成果と課題\n・次期目標",
  },
  {
    key: "qualification_check",
    label: "資格更新確認",
    title: "資格更新確認",
    eventType: "qualification",
    priority: "1",
    description:
      "資格の有効期限・更新状況の確認。\n\n確認事項：\n・対象資格\n・有効期限\n・更新手続きの要否\n・証明書類の確認",
  },
  {
    key: "career_interview",
    label: "年1回キャリア面談",
    title: "年1回キャリア面談",
    eventType: "interview",
    priority: "2",
    description:
      "年1回のキャリア面談。\n\n確認事項：\n・現在の業務状況\n・今後挑戦したい業務\n・希望するキャリア\n・必要な支援や研修",
  },
];

export function AnnualEventTemplateForm({
  employees,
  today,
  defaultEmployeeId = "",
  defaultScheduledDate,
}: {
  employees: {
    id: string;
    employee_code: string;
    name: string;
    email: string | null;
    status: string;
  }[];
  today: string;
  defaultEmployeeId?: string;
  defaultScheduledDate?: string;
}) {
  const [templateKey, setTemplateKey] = useState("");
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("interview");
  const [priority, setPriority] = useState("2");
  const [description, setDescription] = useState("");

  function applyTemplate(key: string) {
    setTemplateKey(key);

    const template = templates.find((t) => t.key === key);
    if (!template) return;

    setTitle(template.title);
    setEventType(template.eventType);
    setPriority(template.priority);
    setDescription(template.description);
  }

  return (
    <>
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <div className="text-sm font-black text-indigo-700">
          テンプレートから作成
        </div>
        <p className="mt-1 text-sm font-semibold text-indigo-600">
          よく使うイベントを選ぶと、タイトル・種別・優先度・説明が自動入力されます。
        </p>

        <div className="mt-4">
          <label className="block">
            <div className="text-sm font-black text-indigo-700">
              テンプレート
            </div>
            <select
              value={templateKey}
              onChange={(e) => applyTemplate(e.target.value)}
              className="input mt-2"
            >
              <option value="">テンプレートを選択</option>
              {templates.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black text-slate-900">対象社員</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          年間イベントを紐づける社員を選択してください。
        </p>

        <div className="mt-5">
          <Field label="社員">
            <select
              name="employee_id"
              required
              className="input"
              defaultValue={defaultEmployeeId}
            >
              <option value="">選択してください</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.employee_code} / {e.name} / {e.email ?? "-"} / {e.status}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black text-slate-900">イベント情報</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          予定日、種別、優先度、説明を入力します。
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="タイトル">
            <input
              name="title"
              required
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：定期面談、評価面談、資格更新確認"
            />
          </Field>

          <Field label="種別">
            <select
              name="event_type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="input"
            >
              <option value="interview">面談</option>
              <option value="training">研修</option>
              <option value="evaluation">評価</option>
              <option value="qualification">資格</option>
              <option value="contract">契約・更新</option>
              <option value="other">その他</option>
            </select>
          </Field>

          <Field label="予定日">
            <input
              name="scheduled_date"
              type="date"
              required
              defaultValue={defaultScheduledDate ?? today}
              className="input"
            />
          </Field>

          <Field label="優先度">
            <select
              name="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="input"
            >
              <option value="1">1 高</option>
              <option value="2">2 通常</option>
              <option value="3">3 低</option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="説明">
              <textarea
                name="description"
                rows={7}
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="内容、注意点、確認事項、次回アクションなど"
              />
            </Field>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm font-black text-slate-700">{label}</div>
      <div className="mt-2">{children}</div>
    </label>
  );
}