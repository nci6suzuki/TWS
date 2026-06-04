export type NavItem = { href: string; label: string; icon?: string; group: "Main" | "Settings" };

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "home", group: "Main" },
  { href: "/employees", label: "Employees", icon: "users", group: "Main" },
  { href: "/annual-events", label: "Annual Events", icon: "calendar", group: "Main" },
  { href: "/interviews", label: "Interviews", icon: "message", group: "Main" },
  { href: "/followups", label: "Follow-ups", icon: "check", group: "Main" },
  { href: "/notifications", label: "Notifications", icon: "bell", group: "Main" },

  { href: "/settings/masters", label: "Masters", icon: "settings", group: "Settings" },
  { href: "/settings/templates", label: "Templates", icon: "layers", group: "Settings" },
  { href: "/settings/audit-logs", label: "Audit Logs", icon: "shield", group: "Settings" },
];