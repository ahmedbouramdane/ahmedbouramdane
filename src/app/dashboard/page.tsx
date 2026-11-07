import type { Metadata } from "next";
import DashboardClient from "./dashboard-client";

export const metadata: Metadata = {
  title: "Private dashboard | Ahmed Bouramdane",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  const allowLocalUploads =
    process.env.NODE_ENV !== "production" && process.env.APP_ENV !== "production";
  return <DashboardClient allowLocalUploads={allowLocalUploads} />;
}
