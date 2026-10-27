import type { Metadata } from "next";
import { Knowledge } from "./knowledge";

export const metadata: Metadata = { title: "Knowledge base" };

export default function KnowledgePage() {
  return <Knowledge />;
}
