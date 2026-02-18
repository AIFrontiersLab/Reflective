import { AppProvider } from "@/lib/context";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Identity Habit AI",
  description: "Track identity evolution — who you are becoming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-label-primary antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
