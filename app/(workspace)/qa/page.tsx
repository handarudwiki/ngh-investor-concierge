import type { Metadata } from "next";
import { Restricted } from "@/components/shell/access";
import { QualityReview } from "./qa";

export const metadata: Metadata = { title: "Quality review" };

export default function QaPage() {
  return (
    <Restricted permission="qa.review">
      <QualityReview />
    </Restricted>
  );
}
