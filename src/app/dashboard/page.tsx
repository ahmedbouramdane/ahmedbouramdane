import type { Metadata } from "next";
import DashboardClient from "./dashboard-client";

export const metadata: Metadata = {
  title: "Private dashboard | Ahmed Bouramdane",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
