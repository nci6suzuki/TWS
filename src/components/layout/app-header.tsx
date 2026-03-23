import { Me } from "@/types/api";

export function AppHeader({ me }: { me: Me }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        padding: "14px 28px",
        borderBottom: "1px solid rgba(148, 163, 184, 0.25)",
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.24em", color: "#4f46e5" }}>
              TALENT MANAGEMENT
            </p>
            <h1 style={{ margin: "6px 0 0", fontSize: 20, color: "#0f172a" }}>人材マネジメントポータル</h1>
          </div>
          <div style={{ flex: 1, maxWidth: 720 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #cbd5e1", borderRadius: 14, background: "#fff", padding: "10px 14px" }}>
              <span style={{ color: "#94a3b8" }}>🔎</span>
              <span style={{ color: "#94a3b8", fontSize: 14 }}>メンバーを検索</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              borderRadius: 999,
              border: "1px solid #c7d2fe",
              background: "linear-gradient(145deg, #eef2ff, #dbeafe)",
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: "#3730a3",
              textTransform: "capitalize",
            }}
          >
            {me.role}
          </div>
        </div>
      </div>
    </header>
  );
}