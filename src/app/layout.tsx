import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AgentOps — Simple Incident Assistant",
  description: "Automated server incident triage and one-click GitHub fixes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} bg-slate-50 text-slate-900 min-h-screen flex antialiased`}
      >
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen bg-slate-50 flex flex-col">
          {children}
        </main>
        <Toaster
          theme="light"
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#0f172a",
              borderRadius: "1rem",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)",
            },
          }}
        />
      </body>
    </html>
  );
}
