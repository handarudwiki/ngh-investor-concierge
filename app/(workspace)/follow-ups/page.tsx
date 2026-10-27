import type { Metadata } from "next";
import { FollowUps } from "./follow-ups";

export const metadata: Metadata = { title: "Follow-ups" };

export default function FollowUpsPage() {
  return <FollowUps />;
}
