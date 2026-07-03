import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "API Pulse Dashboard",
  description:
    "A multi-API developer dashboard powered by public APIs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="h-full" lang="en">
      <body className="min-h-full bg-background text-foreground antialiased">
        <div className="min-h-screen bg-[#07080d] px-5 py-6 text-white sm:px-8 sm:py-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  API Pulse Dashboard
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Public API demos for the Vibe Coder OJT challenge.
                </p>
              </div>
              <AppNav />
            </header>
            <main className="flex flex-col gap-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
