import type { Metadata } from "next";
import { Suspense } from "react";
import { Inbox } from "./inbox";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  // The selected conversation lives in ?c=, read with useSearchParams.
  return (
    <Suspense fallback={<div className="flex-1 bg-surface" />}>
      <Inbox />
    </Suspense>
  );
}
