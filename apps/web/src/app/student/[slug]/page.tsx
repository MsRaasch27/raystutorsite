import { notFound } from "next/navigation";
import { StudentPageClient } from "./StudentPageClient";

function getBaseUrl() {
  // Firebase Hosting frameworks sets VERCEL_URL to your site host (no scheme).
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // Local dev fallback:
  return "http://localhost:3000";
}

type User = {
  id: string;
  name?: string | null;
  email: string;
  goals?: string | null;
};

type Assessment = {
  id: string;
  userId: string;
  email: string;
  submittedAt: string;
  answers: Record<string, string | number | boolean>;
  createdAt: FirebaseFirestore.Timestamp;
};

type Appt = {
  id: string;
  title?: string;
  start?: { _seconds: number; _nanoseconds: number } | string;
  end?: { _seconds: number; _nanoseconds: number } | string;
  status?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  meetLink?: string;
};

// Server component to fetch data
export default async function StudentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = decodeURIComponent(slug).trim().toLowerCase();
  const base = getBaseUrl();
  
  const [userRes, upcomingRes, pastRes] = await Promise.all([
    fetch(`${base}/api/users/${encodeURIComponent(id)}`, { cache: "no-store" }),
    fetch(`${base}/api/users/${encodeURIComponent(id)}/appointments?kind=upcoming`, { cache: "no-store" }),
    fetch(`${base}/api/users/${encodeURIComponent(id)}/appointments?kind=past`, { cache: "no-store" }),
  ]);

  if (userRes.status === 404) notFound();
  if (!userRes.ok) throw new Error(`Failed to load user: ${userRes.status}`);

  const user = (await userRes.json()) as User;
  const upcoming: { items: Appt[] } = await upcomingRes.json();
  const past: { items: Appt[] } = await pastRes.json();

  // Fetch user's assessments
  const assessmentsRes = await fetch(`${getBaseUrl()}/api/users/${encodeURIComponent(id)}/assessments`, {
    cache: "no-store",
  });
  
  let assessments: Assessment[] = [];
  if (assessmentsRes.ok) {
    const assessmentsData = await assessmentsRes.json();
    assessments = assessmentsData.assessments || [];
  }

  return (
    <StudentPageClient 
      user={user}
      upcoming={upcoming}
      past={past}
      assessments={assessments}
    />
  );
}
