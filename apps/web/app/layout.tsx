import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitRAG",
  description: "Open-source repo oracle powered by a secure Enterprise AI Gateway Integration."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
