import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "katex/dist/katex.min.css";
import { ServiceWorkerRegister } from "./components/service-worker-register";

export const metadata: Metadata = {
  title: "BAC SM Organizer",
  description: "Private study organizer for the 2 Bac Sciences Mathématiques year.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function StudentManagementLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ServiceWorkerRegister />
      {children}
    </>
  );
}