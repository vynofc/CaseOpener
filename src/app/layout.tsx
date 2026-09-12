import type { Metadata } from "next";
import { Geist_Mono, Oswald, Sofia_Sans } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/lib/game-context";
import DevConsole from "@/components/DevConsole";

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
  description: "Open CS2 cases, collect skins and build your inventory. With real drop odds, StatTrak and float values.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${sofiaSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <GameProvider>
          {children}
          <DevConsole />
        </GameProvider>
      </body>
    </html>
  );
}
