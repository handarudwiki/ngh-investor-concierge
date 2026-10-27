import type { Metadata } from "next";
import { Board } from "./board";

export const metadata: Metadata = { title: "Pipeline" };

export default function PipelinePage() {
  return <Board />;
}
