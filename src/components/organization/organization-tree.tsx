// src/components/organization/organization-tree.tsx

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Unit = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
};

type Employee = {
  id: string;
  employee_code: string;
  name: string;
  email: string | null;
  app_role: string;
  status: string;
  organization_unit_id: string | null;
  manager_employee_id: string | null;
};

type TreeNode = Unit & {
  children: TreeNode[];
  members: Employee[];
};

export function OrganizationTree({
  units,
  employees,
}: {
  units: Unit[];
  employees: Employee[];
}) {
  const [showMembers, setShowMembers] = useState(false);
  const [vertical, setVertical] = useState(false);

  const roots = useMemo(() => buildTree(units, employees), [units, employees]);

  const unassignedEmployees = useMemo(
    () => employees.filter((e) => !e.organization_unit_id),
    [employees]
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            組織シナプスツリー
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            組織階層、所属社員、直属上司・部下数をボックス形式で確認できます。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowMembers((v) => !v)}
            className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            {showMembers ? "メンバー非表示" : "メンバー表示"}
          </button>

          <button
            type="button"
            onClick={() => setVertical((v) => !v)}
            className="inline-flex h-9 items-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800"
          >
            {vertical ? "横表示" : "縦表示"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <SummaryCard label="組織数" value={units.length} />
        <SummaryCard label="社員数" value={employees.length} />
        <SummaryCard
          label="所属設定済"
          value={employees.filter((e) => e.organization_unit_id).length}
        />
        <SummaryCard label="未所属" value={unassignedEmployees.length} />
      </div>

      <div className="mt-6 overflow-auto">
        {roots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div className="text-sm font-black text-slate-500">
              組織がまだ登録されていません
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-400">
              下の「組織を追加」から最上位組織を作成してください。
            </div>
          </div>
        ) : (
          <div className={vertical ? "space-y-5" : "min-w-[1080px] space-y-5"}>
            {roots.map((node) => (
              <TreeBranch
                key={node.id}
                node={node}
                allEmployees={employees}
                showMembers={showMembers}
                vertical={vertical}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>

      {showMembers && unassignedEmployees.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-black text-amber-800">
                未所属社員
              </div>
              <div className="mt-1 text-xs font-semibold text-amber-700">
                所属組織がまだ設定されていない社員です。
              </div>
            </div>

            <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700">
              {unassignedEmployees.length}名
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {unassignedEmployees.slice(0, 12).map((member) => (
              <EmployeeRow
                key={member.id}
                member={member}
                allEmployees={employees}
              />
            ))}
          </div>

          {unassignedEmployees.length > 12 && (
            <div className="mt-3 text-xs font-black text-amber-700">
              他 {unassignedEmployees.length - 12} 名
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function TreeBranch({
  node,
  allEmployees,
  showMembers,
  vertical,
  depth,
}: {
  node: TreeNode;
  allEmployees: Employee[];
  showMembers: boolean;
  vertical: boolean;
  depth: number;
}) {
  const [open, setOpen] = useState(true);

  const totalMemberCount = countMembers(node);
  const directMemberCount = node.members.length;
  const childUnitCount = node.children.length;

  return (
    <div className={vertical ? "space-y-3" : "flex items-start gap-8"}>
      <div className="relative">
        {depth > 0 && !vertical && (
          <div className="absolute -left-8 top-10 h-px w-8 bg-slate-300" />
        )}

        <div
          className={[
            "w-[370px] rounded-none border bg-white p-3 shadow-md",
            node.is_active ? "border-slate-900" : "border-slate-300 opacity-60",
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-xs font-black text-slate-400">
              組織
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-black text-slate-900">
                {node.name}
              </div>

              <div className="mt-1 flex flex-wrap gap-2">
                <Badge tone="gray">直下 {directMemberCount}</Badge>
                <Badge tone="indigo">合計 {totalMemberCount}</Badge>
                <Badge tone="sky">配下 {childUnitCount}</Badge>

                {!node.is_active && <Badge tone="rose">無効</Badge>}
              </div>
            </div>

            <div className="text-2xl font-black text-slate-900">
              {totalMemberCount}
            </div>
          </div>

          {showMembers && node.members.length > 0 && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="grid grid-cols-1 gap-2">
                {node.members.slice(0, 8).map((member) => (
                  <EmployeeRow
                    key={member.id}
                    member={member}
                    allEmployees={allEmployees}
                  />
                ))}

                {node.members.length > 8 && (
                  <div className="px-3 py-1 text-xs font-black text-slate-400">
                    他 {node.members.length - 8} 名
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-3 flex w-full items-center justify-center border-t border-slate-200 pt-2 text-lg font-black text-slate-400 hover:text-slate-700"
          >
            {node.children.length > 0 ? (open ? "⌄" : "›") : "—"}
          </button>
        </div>
      </div>

      {open && node.children.length > 0 && (
        <div
          className={[
            vertical
              ? "ml-6 space-y-3 border-l border-slate-300 pl-4"
              : "space-y-5",
          ].join(" ")}
        >
          {node.children.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              allEmployees={allEmployees}
              showMembers={showMembers}
              vertical={vertical}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmployeeRow({
  member,
  allEmployees,
}: {
  member: Employee;
  allEmployees: Employee[];
}) {
  const manager = findManager(member, allEmployees);
  const directSubordinateCount = countDirectSubordinates(member.id, allEmployees);

  return (
    <Link
      href={`/employees/code/${member.employee_code}`}
      className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-black text-slate-500">
        {member.name.slice(0, 1)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-black">
          {member.employee_code} / {member.name}
        </span>

        <span className="mt-0.5 block truncate text-[10px] font-bold text-slate-400">
          上司: {manager ? manager.name : "未設定"} / 部下:{" "}
          {directSubordinateCount}名
        </span>
      </span>

      <span
        className={[
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black",
          member.status === "active"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700",
        ].join(" ")}
      >
        {member.status === "active" ? "在籍" : member.status}
      </span>
    </Link>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-black text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "gray" | "indigo" | "sky" | "rose";
}) {
  const className =
    tone === "indigo"
      ? "bg-indigo-50 text-indigo-700"
      : tone === "sky"
      ? "bg-sky-50 text-sky-700"
      : tone === "rose"
      ? "bg-rose-50 text-rose-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-black ${className}`}>
      {children}
    </span>
  );
}

function buildTree(units: Unit[], employees: Employee[]) {
  const sortedUnits = [...units].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.name.localeCompare(b.name, "ja");
  });

  const nodeById = new Map<string, TreeNode>();

  for (const unit of sortedUnits) {
    nodeById.set(unit.id, {
      ...unit,
      children: [],
      members: employees.filter((e) => e.organization_unit_id === unit.id),
    });
  }

  const roots: TreeNode[] = [];

  for (const node of nodeById.values()) {
    if (node.parent_id && nodeById.has(node.parent_id)) {
      nodeById.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function countMembers(node: TreeNode): number {
  return (
    node.members.length +
    node.children.reduce((sum, child) => sum + countMembers(child), 0)
  );
}

function findManager(member: Employee, allEmployees: Employee[]) {
  if (!member.manager_employee_id) return null;

  return allEmployees.find((e) => e.id === member.manager_employee_id) ?? null;
}

function countDirectSubordinates(employeeId: string, allEmployees: Employee[]) {
  return allEmployees.filter((e) => e.manager_employee_id === employeeId).length;
}