// src/components/employees/panels/employee-annual-events-panel.tsx
import Link from "next/link";
import { getAnnualEvents } from "@/lib/queries/annual-events";
import { Me } from "@/types/api";

export async function EmployeeAnnualEventsPanel({
  me,
  employeeId,
}: {
  me: Me;
  employeeId: string;
}) {
  const result = await getAnnualEvents({
    me,
    employeeId,
    page: 1,
    limit: 20,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-medium">年間スケジュール</h2>
        <Link href={`/annual-events/new?employeeId=${employeeId}`} className="underline text-sm">
          イベント登録
        </Link>
      </div>

      {result.items.length === 0 ? (
        <div className="text-sm text-gray-600">年間イベントはありません。</div>
      ) : (
        <div className="border rounded">
          <ul>
            {result.items.map((item) => (
              <li key={item.id} className="p-3 border-b last:border-b-0 text-sm">
                <div className="font-medium">{item.title}</div>
                <div>日付：{item.scheduledDate}</div>
                <div>種別：{item.eventType}</div>
                <div>担当：{item.ownerName}</div>
                <div>状態：{item.status}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}