import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = { title: "SignalPost | LinkedIn Content Agent", description: "Source-grounded LinkedIn content planning for technical creators." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
