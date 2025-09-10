"use client";

import { TeacherDashboard } from "./TeacherDashboard";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function TeacherPage() {
  return (
    <ProtectedRoute requireTeacher={true}>
      <TeacherDashboard />
    </ProtectedRoute>
  );
}
