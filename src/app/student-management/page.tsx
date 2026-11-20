import type { Metadata } from "next";
import StudentManagementClient from "./student-management-client";

export const metadata: Metadata = {
  title: "BAC SM Organizer",
  robots: { index: false, follow: false },
};

export default function StudentManagementPage() {
  return <StudentManagementClient />;
}