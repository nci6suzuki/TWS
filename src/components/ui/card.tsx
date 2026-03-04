import { CSSProperties, ReactNode } from "react";

type CardVariant = "default" | "elevated" | "dark";

const variantStyles: Record<CardVariant, CSSProperties> = {
  default: {
    border: "1px solid rgba(148, 163, 184, 0.32)",
    background: "linear-gradient(150deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
  },
  elevated: {
    border: "1px solid rgba(129, 140, 248, 0.26)",
    background: "linear-gradient(150deg, rgba(255,255,255,0.96), rgba(238,242,255,0.88))",
    boxShadow: "0 22px 42px rgba(79, 70, 229, 0.16)",
  },
  dark: {
    border: "1px solid rgba(148, 163, 184, 0.3)",
    background: "linear-gradient(160deg, rgba(30,41,59,0.82), rgba(15,23,42,0.74))",
    boxShadow: "0 24px 48px rgba(2, 6, 23, 0.48)",
  },
};

export function Card({
  children,
  style,
  variant = "default",
}: {
  children: ReactNode;
  style?: CSSProperties;
  variant?: CardVariant;
}) {
  return (
    <section
      style={{
        borderRadius: 22,
        padding: 20,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function CardTitle({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.2, fontWeight: 800, color: "#0f172a", ...style }}>
      {children}
    </h2>
  );
}

export function CardText({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <p style={{ margin: 0, color: "#475569", ...style }}>{children}</p>;
}