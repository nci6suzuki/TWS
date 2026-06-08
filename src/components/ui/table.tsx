import React from "react";

export function TableCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border bg-white p-4 overflow-auto">{children}</div>;
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="py-2 text-left text-slate-500 font-semibold">{children}</th>;
}
export function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-2">{children}</td>;
}