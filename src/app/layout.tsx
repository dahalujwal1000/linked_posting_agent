import type { Metadata } from "next";
import "@/app/globals.css";

/**
 * Resolves the theme before first paint so there is no flash of the wrong palette. Mirrors the read
 * in src/components/ui/theme-toggle.tsx and defaults to the OS preference on a first visit.
 */
const themeScript = `(function(){try{var s=localStorage.getItem("signalpost-theme");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export const metadata: Metadata = { title: "SignalPost | LinkedIn Content Agent", description: "Source-grounded LinkedIn content planning for technical creators." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

