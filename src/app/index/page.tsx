"use client";

import Header from "@/components/Header";
import MenuBackdrop from "@/components/MenuBackdrop";
import SkinIndex from "@/components/SkinIndex";

export default function IndexPage() {
  return (
    <div className="min-h-full flex flex-col">
      <MenuBackdrop />
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 flex flex-col gap-6">
        <SkinIndex />
      </main>
    </div>
  );
}
