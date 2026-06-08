"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>Employee page error</h1>
      <p style={{ marginTop: 8, color: "#b91c1c" }}>
        {error.message}
      </p>
      {error.digest && (
        <p style={{ marginTop: 8, color: "#64748b" }}>digest: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        style={{ marginTop: 16, padding: "8px 12px", border: "1px solid #ddd" }}
      >
        Retry
      </button>
    </div>
  );
}