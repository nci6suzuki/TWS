"use client";

export function ExportLinkButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex px-4 py-2 rounded border text-sm"
    >
      {label}
    </a>
  );
}