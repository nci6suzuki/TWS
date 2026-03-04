// src/components/employees/employee-tabs.tsx
import Link from "next/link";
import { Me } from "@/types/api";
import { EmployeeBasicPanel } from "@/components/employees/panels/employee-basic-panel";
import { EmployeeCareerPanel } from "@/components/employees/panels/employee-career-panel";
import { EmployeeAnnualEventsPanel } from "@/components/employees/panels/employee-annual-events-panel";
import { EmployeeInterviewsPanel } from "@/components/employees/panels/employee-interviews-panel";
import { EmployeeQualificationsPanel } from "@/components/employees/panels/employee-qualifications-panel";

type Props = {
  me: Me;
  employeeId: string;
  tab: string;
};

const tabs = [
  { key: "basic", label: "基本情報" },
  { key: "career", label: "キャリア希望" },
  { key: "qualifications", label: "資格" },
  { key: "schedule", label: "年間スケジュール" },
  { key: "interviews", label: "面談履歴" },
];

export function EmployeeTabs({ me, employeeId, tab }: Props) {
  const active = tabs.some((t) => t.key === tab) ? tab : "basic";

  return (
    <div className="space-y-3">
      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/employees/${employeeId}?tab=${t.key}`}
            className={[
              "px-3 py-2 text-sm",
              active === t.key ? "border-b-2 border-black font-medium" : "text-gray-600",
            ].join(" ")}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div>
        {active === "basic" && <EmployeeBasicPanel me={me} employeeId={employeeId} />}
        {active === "career" && <EmployeeCareerPanel me={me} employeeId={employeeId} />}
        {active === "qualifications" && (
          <EmployeeQualificationsPanel employeeId={employeeId} />
        )}
        {active === "schedule" && <EmployeeAnnualEventsPanel me={me} employeeId={employeeId} />}
        {active === "interviews" && <EmployeeInterviewsPanel me={me} employeeId={employeeId} />}
      </div>
    </div>
  );
}