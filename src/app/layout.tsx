import type { Metadata } from "next";
import { Geist_Mono, Oswald, Sofia_Sans } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/lib/game-context";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const sofiaSans = Sofia_Sans({
  variable: "--font-sofia-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CS2 Case Opener",
  description: "Öffne CS2-Kisten, sammle Skins und baue dein Inventar auf. Mit echten Drop-Wahrscheinlichkeiten, StatTrak und Float-Werten.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${oswald.variable} ${sofiaSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
