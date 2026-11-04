import { Suspense } from "react";
import { RequireUser } from "@/components/shell/access";
import { Sidebar } from "@/components/shell/sidebar";

export default function WorkspaceLayout({ children }: LayoutProps<"/">) {
  return (
    <RequireUser>
      <div className="flex h-dvh overflow-hidden print:block print:h-auto print:overflow-visible">
        {/* The sidebar reads the pathname; on dynamic routes that's request data. */}
        <Suspense fallback={<div className="no-print h-full w-14 shrink-0 bg-sidebar lg:w-56" />}>
          <Sidebar />
        </Suspense>
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden print:block print:overflow-visible">{children}</main>
      </div>
    </RequireUser>
  );
}
