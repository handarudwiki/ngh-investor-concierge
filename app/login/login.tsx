"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Avatar, Badge, Button, Card, Field, Input } from "@/components/ui";
import { signIn } from "@/lib/actions";
import { DEMO_PASSWORD, ROLE_LABEL } from "@/lib/permissions";
import { useStore } from "@/lib/store";

export function Login() {
  const router = useRouter();
  const advisors = useStore((s) => s.advisors);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const failed = signIn(email, password);
    if (failed) return setError(failed);
    // Only follow same-site paths back into the workspace.
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-accent font-display text-xl text-ink-inverse italic">
            n
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-ink">NGH Concierge</span>
            <span className="block text-2xs text-ink-subtle">Investor desk</span>
          </span>
        </div>

        <Card className="p-5">
          <h1 className="text-lg font-semibold tracking-tight text-ink">Sign in</h1>
          <p className="mt-0.5 text-sm text-ink-muted">For NGH sales advisors and admins.</p>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <Field label="Work email">
              <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" variant="primary" className="w-full">
              <LogIn /> Sign in
            </Button>
          </form>
        </Card>

        <Card>
          <p className="border-b border-line px-4 py-2.5 text-xs text-ink-muted">
            Demo accounts · password <code className="rounded-xs bg-subtle px-1 font-mono text-ink">{DEMO_PASSWORD}</code>
          </p>
          <ul className="divide-y divide-line">
            {advisors.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(DEMO_PASSWORD);
                    setError(undefined);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left hover:bg-subtle"
                >
                  <Avatar name={a.name} size="sm" />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-sm font-medium text-ink">{a.name}</span>
                    <span className="block truncate text-2xs text-ink-subtle">{a.title}</span>
                  </span>
                  <Badge tone={a.role === "admin" ? "info" : "neutral"}>{ROLE_LABEL[a.role]}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
