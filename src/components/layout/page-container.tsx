export function PageContainer({
  children,
  size = "md",
}: {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const max =
    size === "sm" ? 860 :
    size === "md" ? 1040 :
    size === "lg" ? 1240 :
    1440;

  return (
    <div
      style={{
        margin: "0 auto",
        width: "100%",
        maxWidth: max,
        display: "grid",
        gap: 18,
        alignContent: "start",
      }}
    >
      {children}
    </div>
  );
}