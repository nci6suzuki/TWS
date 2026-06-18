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
  const [showMembers, setShowMembers] = useState(true);
  const [vertical, setVertical] = useState(false);

  const roots = useMemo(() => buildTree(units, employees), [units, employees]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">組織シナプスツリー</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            組織階層と所属社員をボックス形式で確認できます。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowMembers((v) => !v)}
            className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            {showMembers ? "顔写真・メンバー非表示" : "顔写真・メンバー表示"}
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
          <div className={vertical ? "space-y-5" : "min-w-[980px] space-y-5"}>
            {roots.map((node) => (
              <TreeBranch
                key={node.id}
                node={node}
                showMembers={showMembers}
                vertical={vertical}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TreeBranch({
  node,
  showMembers,
  vertical,
  depth,
}: {
  node: TreeNode;
  showMembers: boolean;
  vertical: boolean;
  depth: number;
}) {
  const [open, setOpen] = useState(true);

  const totalMemberCount = countMembers(node);
  const directMemberCount = node.members.length;

  return (
    <div className={vertical ? "space-y-3" : "flex items-start gap-8"}>
      <div className="relative">
        {depth > 0 && !vertical && (
          <div className="absolute -left-8 top-10 h-px w-8 bg-slate-300" />
        )}

        <div
          className={[
            "w-[350px] rounded-none border bg-white p-3 shadow-md",
            node.is_active ? "border-slate-900" : "border-slate-300 opacity-60",
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 border border-dashed border-slate-300 bg-slate-50" />

            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-black text-slate-900">
                {node.name}
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-600">
                  直下 {directMemberCount}
                </span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-black text-indigo-700">
                  合計 {totalMemberCount}
                </span>
                {!node.is_active && (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-black text-rose-700">
                    無効
                  </span>
                )}
              </div>
            </div>

            <div className="text-2xl font-black text-slate-900">
              {totalMemberCount}
            </div>
          </div>

          {showMembers && node.members.length > 0 && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="grid grid-cols-1 gap-2">
                {node.members.slice(0, 6).map((member) => (
                  <Link
                    key={member.id}
                    href={`/employees/code/${member.employee_code}`}
                    className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-black text-slate-500">
                      {member.name.slice(0, 1)}
                    </span>
                    <span className="truncate">
                      {member.employee_code} / {member.name}
                    </span>
                  </Link>
                ))}

                {node.members.length > 6 && (
                  <div className="px-3 py-1 text-xs font-black text-slate-400">
                    他 {node.members.length - 6} 名
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
            vertical ? "ml-6 space-y-3 border-l border-slate-300 pl-4" : "space-y-5",
          ].join(" ")}
        >
          {node.children.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
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