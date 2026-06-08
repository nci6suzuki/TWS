export const runtime = "nodejs";

export default function Page(props: any) {
  return (
    <pre style={{ padding: 24 }}>
      {JSON.stringify(props, null, 2)}
    </pre>
  );
}