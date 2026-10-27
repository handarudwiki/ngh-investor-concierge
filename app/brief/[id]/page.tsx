import type { Metadata } from "next";
import { Suspense } from "react";
import { Brief } from "./brief";

export const metadata: Metadata = { title: "Investment brief" };

export default function BriefPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <Brief />
    </Suspense>
  );
}
