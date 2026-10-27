import { Suspense } from "react";
import { Sidebar } from "@/components/shell/sidebar";

export default function WorkspaceLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex h-dvh overflow-hidden">
      {/* The sidebar reads the pathname; on dynamic routes that's request data. */}
      <Suspense fallback={<div className="h-full w-14 shrink-0 bg-sidebar lg:w-56" />}>
        <Sidebar />
      </Suspense>
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
