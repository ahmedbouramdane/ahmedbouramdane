import type { Metadata } from "next";
import CvViewer from "./cv-viewer";

export const metadata: Metadata = {
  title: "CV | Ahmed Bouramdane",
  description: "View Ahmed Bouramdane's online CV, education, skills, projects, and certifications.",
};

export default function CvPage() {
  return <CvViewer />;
}
