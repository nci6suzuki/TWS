export default function Page({ params }: { params: { employeeCode: string } }) {
  return <div style={{ padding: 24 }}>employeeCode = {params.employeeCode}</div>;
}