"use client";
import { useEffect, useState } from "react";

export default function TeacherPage() {
  const [text, setText] = useState("loading...");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setText(`${d.status} (${d.env})`))
      .catch((e) => setText(`error: ${String(e)}`));
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Teacher</h1>
      <p className="mt-4">API status: {text}</p>
    </main>
  );
}
