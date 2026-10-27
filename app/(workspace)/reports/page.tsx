import type { Metadata } from "next";
import { Report } from "./report";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return <Report />;
}
