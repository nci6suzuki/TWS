export const runtime = "nodejs";

export default async function Page({
  params,
}: {
  params: Promise<{ employeeCode: string }>;
}) {
  const { employeeCode } = await params;

  return (
    <div style={{ padding: 24 }}>
      employeeCode = {employeeCode}
    </div>
  );
}