"use client";

import type { ReactNode } from "react";
import { DatabaseZap, RotateCcw } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { refresh, useStoreStatus } from "@/lib/store";

/** Holds pages back until the shared workspace has loaded from the database. */
export function StoreGate({ children }: { children: ReactNode }) {
  const status = useStoreStatus();

  if (status === "ready") return children;
  if (status === "loading") return <div className="h-dvh bg-canvas" aria-busy="true" />;

  return (
    <div className="flex h-dvh items-center justify-center bg-canvas">
      <EmptyState
        icon={DatabaseZap}
        title="Can't load the workspace"
        description={`${status.slice("error:".length)} Check that Postgres is running and DATABASE_URL is set, then retry.`}
        action={
          <Button onClick={() => void refresh()}>
            <RotateCcw /> Retry
          </Button>
        }
      />
    </div>
  );
}
