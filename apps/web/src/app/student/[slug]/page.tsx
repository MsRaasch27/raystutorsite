// apps/web/src/app/student/[slug]/page.tsx
export default async function StudentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main style={{ padding: 16 }}>
      <h1>The Neato Student page</h1>
      <p>
        Slug: <code>{slug}</code>
      </p>
    </main>
  );
}
