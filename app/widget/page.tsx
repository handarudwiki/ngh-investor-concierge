import type { Metadata } from "next";
import { WidgetPreview } from "./preview";

export const metadata: Metadata = { title: "Concierge preview" };

export default function WidgetPage() {
  return <WidgetPreview />;
}
