import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quill SQL – Natural Language SQL Autocomplete",
  description: "Generate production-ready SQL using natural language.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
