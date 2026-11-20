import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/student-management",
    name: "BAC SM Organizer",
    short_name: "2 BAC SM",
    description: "Private study organizer for the 2 Bac Sciences Mathématiques year.",
    start_url: "/student-management",
    scope: "/student-management",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "Homeworks",
        short_name: "Homeworks",
        description: "Open your homework planner",
        url: "/student-management?tab=homeworks",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
  };
}