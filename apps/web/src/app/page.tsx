import { headers } from "next/headers";

async function getBaseUrl() {
  // Prefer host header at runtime (works on dev server and Firebase Hosting SSR)
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");

  // If we don't have a host (edge cases), fall back:
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const isDev = process.env.NODE_ENV === "development";
  const protocol = isDev ? "http" : "https";
  return `${protocol}://${host}`;
}

export default async function HomePage() {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/health`, { cache: "no-store" });
  const data = await res.json();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Landing</h1>
      <p className="mt-4">
        API status: <code>{data.status}</code> (NODE_ENV: <code>{data.env}</code>)
      </p>
    </main>
  );
}
