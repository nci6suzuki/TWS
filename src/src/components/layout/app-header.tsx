import { Me } from "@/types/api";

export function AppHeader({ me }: { me: Me }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        padding: "18px 28px",
        borderBottom: "1px solid rgba(148, 163, 184, 0.35)",
        background: "rgba(255, 255, 255, 0.82)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.24em", color: "#4f46e5" }}>
            TALENT MANAGEMENT
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: 20, color: "#0f172a" }}>人材マネジメントポータル</h1>
        </div>
        <div
          style={{
            borderRadius: 999,
            border: "1px solid #c7d2fe",
            background: "linear-gradient(145deg, #eef2ff, #dbeafe)",
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 700,
            color: "#3730a3",
          }}
        >
          {me.role}
        </div>
      </div>
    </header>
  );
}