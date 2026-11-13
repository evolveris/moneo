import type { Metadata } from "next";
import { Geist, SUSE_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const suseMono = SUSE_Mono({
  variable: "--font-suse-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moneo",
  description: "The why behind the buy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${suseMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <header className="border-b">
          <div className="mx-auto flex w-full max-w-5xl items-baseline gap-3 px-4 py-4">
            <span className="font-heading text-lg font-semibold">Moneo</span>
            <span className="text-sm text-muted-foreground">
              The why behind the buy
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
