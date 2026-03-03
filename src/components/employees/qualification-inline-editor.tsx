"use client";

import { useState } from "react";
import { QualificationEditForm } from "@/components/forms/qualification-edit-form";

export function QualificationInlineEditor({
  qualificationRecordId,
  initialData,
}: {
  qualificationRecordId: string;
  initialData: {
    qualificationId: string;
    acquiredDate: string;
    expiresOn: string;
    status: string;
    memo: string;
  };
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm underline"
      >
        {open ? "編集を閉じる" : "編集する"}
      </button>

      {open && (
        <QualificationEditForm
          qualificationRecordId={qualificationRecordId}
          initialData={initialData}
        />
      )}
    </div>
  );
}