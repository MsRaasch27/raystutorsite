// Server Component by default — do NOT add "use client" unless you need hooks.
// Don't import any Next types here.
// The props shape is a plain object with a `params` field.

type PageProps = {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function StudentPage({ params }: PageProps) {
  const { slug } = params;
  return (
    <main style={{ padding: 16 }}>
      <h1>Student page</h1>
      <p>Slug: <code>{slug}</code></p>
    </main>
  );
}
