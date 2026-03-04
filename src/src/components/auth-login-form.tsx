export function AuthLoginForm({ errorMessage }: { errorMessage: string | null }) {
  return (
    <form
      style={{ marginTop: 28, display: "grid", gap: 18 }}
      action="/api/auth/login"
      method="post"
    >
      <div>
        <label htmlFor="email" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#dbeafe" }}>
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          style={{
            marginTop: 8,
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 12,
            border: "1px solid rgba(191, 219, 254, 0.45)",
            background: "rgba(15, 23, 42, 0.45)",
            padding: "11px 13px",
            fontSize: 14,
            color: "#f8fafc",
            outline: "none",
          }}
        />
      </div>

      <div>
        <label htmlFor="password" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#dbeafe" }}>
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          placeholder="********"
          style={{
            marginTop: 8,
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 12,
            border: "1px solid rgba(191, 219, 254, 0.45)",
            background: "rgba(15, 23, 42, 0.45)",
            padding: "11px 13px",
            fontSize: 14,
            color: "#f8fafc",
            outline: "none",
          }}
        />
      </div>

      {errorMessage ? (
        <p
          style={{
            borderRadius: 12,
            border: "1px solid rgba(248, 113, 113, 0.6)",
            background: "rgba(127, 29, 29, 0.55)",
            margin: 0,
            padding: "10px 12px",
            fontSize: 13,
            color: "#fecaca",
          }}
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        style={{
          width: "100%",
          borderRadius: 12,
          border: "none",
          background: "linear-gradient(120deg, #6366f1, #0ea5e9)",
          color: "white",
          fontWeight: 700,
          padding: "12px 16px",
          fontSize: 14,
          cursor: "pointer",
          boxShadow: "0 14px 34px rgba(14, 165, 233, 0.35)",
        }}
      >
        ログイン
      </button>
    </form>
  );
}