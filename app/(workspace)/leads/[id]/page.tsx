import type { Metadata } from "next";
import { Suspense } from "react";
import { LeadProfile } from "./profile";

export const metadata: Metadata = { title: "Lead" };

export default function LeadPage() {
  // Leads live in the client store, so the profile reads the id with useParams.
  return (
    <Suspense fallback={<div className="flex-1 bg-canvas" />}>
      <LeadProfile />
    </Suspense>
  );
}
