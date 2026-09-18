import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talk to Zain — AI Sales Assistant",
  description: "Have a quick video conversation with our AI sales assistant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
