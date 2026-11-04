import type { Metadata } from "next";
import { Restricted } from "@/components/shell/access";
import { SettingsView } from "./settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <Restricted permission="settings">
      <SettingsView />
    </Restricted>
  );
}
