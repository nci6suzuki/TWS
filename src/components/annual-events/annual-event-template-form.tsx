// src/components/annual-events/annual-event-template-form.tsx

"use client";

import { useMemo, useState } from "react";

type Employee = {
  id: string;
  employee_code: string;
  name: string;
  email: string | null;
  status: string;
};

type Template = {
  key: string;
  label: string;
  description: string;
  title: string;
  eventType: string;
  priority: string;
  memo: string;
};

const templates: Template[] = [
  {
    key: "onboarding_30",
    label: "入社30日面談",
    description: "入社後の状況確認・困りごとの確認",
    title: "入社30日面談",
    eventType: "interview",
    priority: "2",
    memo:
      "入社後30日前後の状況確認。\n業務理解、職場環境、人間関係、困りごと、今後のフォロー内容を確認する。",
  },
  {
    key: "onboarding_90",
    label: "入社90日面談",
    description: "定着状況・今後の課題確認",
    title: "入社90日面談",
    eventType: "interview",
    priority: "2",
    memo:
      "入社後90日前後の定着確認。\n業務習熟度、課題、今後の育成方針、本人の希望を確認する。",
  },
  {
    key: "career_interview",
    label: "キャリア面談",
    description: "今後の希望やキャリアの確認",
    title: "キャリア面談",
    eventType: "interview",
    priority: "2",
    memo:
      "本人のキャリア希望、異動希望、今後伸ばしたいスキル、会社として支援できる内容を確認する。",
  },
  {
    key: "evaluation",
    label: "評価面談",
    description: "半期・年度評価の面談",
    title: "評価面談",
    eventType: "evaluation",
    priority: "1",
    memo:
      "評価内容のフィードバック。\n成果、課題、次期目標、期待する役割を確認する。",
  },
  {
    key: "training",
    label: "研修",
    description: "社内研修・外部研修の予定",
    title: "研修",
    eventType: "training",
    priority: "2",
    memo:
      "研修予定。\n目的、対象内容、受講後の活用方法を記録する。",
  },
  {
    key: "qualification",
    label: "資格更新確認",
    description: "資格期限・更新手続きの確認",
    title: "資格更新確認",
    eventType: "other",
    priority: "1",
    memo:
      "資格更新の確認。\n有効期限、更新手続き、必要書類、受講・申請状況を確認する。",
  },
  {
    key: "other",
    label: "その他",
    description: "自由入力用",
    title: "",
    eventType: "other",
    priority: "2",
    memo: "",
  },
];

export function AnnualEventTemplateForm({
  employees,
  today,
  defaultEmployeeId = "",
  defaultScheduledDate,
}: {
  employees: Employee[];
  today: string;
  defaultEmployeeId?: string;
  defaultScheduledDate?: string;
}) {
  const initialScheduledDate = defaultScheduledDate || today;

  const [employeeId, setEmployeeId] = useState(defaultEmployeeId);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("");
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("other");
  const [scheduledDate, setScheduledDate] = useState(initialScheduledDate);
  const [priority, setPriority] = useState("2");
  const [description, setDescription] = useState("");

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === employeeId) ?? null;
  }, [employees, employeeId]);

  function applyTemplate(template: Template) {
    setSelectedTemplateKey(template.key);
    setTitle(template.title);
    setEventType(template.eventType);
    setPriority(template.priority);
    setDescription(template.memo);

    // カレンダーから来た日付を基準にするため、
    // テンプレート選択では scheduledDate を勝手に今日へ戻さない
    if (!scheduledDate) {
      setScheduledDate(initialScheduledDate);
    }
  }

  function setDateOffset(days: number) {
    setScheduledDate(addDays(initialScheduledDate, days));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm font-black text-slate-900">
              テンプレート選択
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              カレンダーから登録した場合は、クリックした日付を基準に登録できます。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
              基準日: {initialScheduledDate}
            </span>

            {selectedEmployee && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                {selectedEmployee.employee_code} / {selectedEmployee.name}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {templates.map((template) => {
            const active = selectedTemplateKey === template.key;

            return (
              <button
                key={template.key}
                type="button"
                onClick={() => applyTemplate(template)}
                className={[
                  "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm",
                  active
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                ].join(" ")}
              >
                <div
                  className={[
                    "text-sm font-black",
                    active ? "text-indigo-700" : "text-slate-900",
                  ].join(" ")}
                >
                  {template.label}
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  {template.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-black text-slate-900">登録内容</div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-black text-slate-500">
              対象社員
            </label>
            <select
              name="employee_id"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="input"
              required
            >
              <option value="">社員を選択してください</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.employee_code} / {employee.name}
                  {employee.email ? ` / ${employee.email}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-black text-slate-500">
              タイトル
            </label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：入社30日面談"
              className="input"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-slate-500">
              種別
            </label>
            <select
              name="event_type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="input"
            >
              <option value="onboarding">入社</option>
              <option value="training">研修</option>
              <option value="interview">面談</option>
              <option value="evaluation">評価</option>
              <option value="other">その他</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-slate-500">
              優先度
            </label>
            <select
              name="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="input"
            >
              <option value="1">高</option>
              <option value="2">通常</option>
              <option value="3">低</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-slate-500">
              予定日
            </label>
            <input
              type="date"
              name="scheduled_date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black text-slate-500">
              日付クイック設定
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setScheduledDate(initialScheduledDate)}
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                基準日
              </button>
              <button
                type="button"
                onClick={() => setDateOffset(7)}
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                +7日
              </button>
              <button
                type="button"
                onClick={() => setDateOffset(30)}
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                +30日
              </button>
              <button
                type="button"
                onClick={() => setDateOffset(90)}
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                +90日
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-black text-slate-500">
              内容・メモ
            </label>
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={7}
              placeholder="イベント内容、確認事項、対応メモなどを入力"
              className="input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function addDays(baseDate: string, days: number) {
  const d = new Date(baseDate);

  if (Number.isNaN(d.getTime())) {
    return baseDate;
  }

  d.setDate(d.getDate() + days);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}