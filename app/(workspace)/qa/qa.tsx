"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Check, CircleCheck, Flag, MessagesSquare, ShieldCheck, Undo2, X } from "lucide-react";
import { Avatar, Badge, BotAvatar, Button, Card, CardHeader, EmptyState, Input, PageHeader, Select, Stat } from "@/components/ui";
import { ChannelIcon, LangTag } from "@/components/domain";
import { cn } from "@/lib/cn";
import { clearReview, reviewAnswer } from "@/lib/actions";
import { dateTime, TEAM_TZ } from "@/lib/format";
import { QA_ISSUES, QA_SAMPLE_SIZE, QA_TARGET_PCT, qaSample, type QaAnswer } from "@/lib/qa";
import { useNow, useStore } from "@/lib/store";
import type { QaIssue, QaReview } from "@/lib/types";

const shortDate = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TEAM_TZ });

function AnswerReview({ answer, review }: { answer: QaAnswer; review?: QaReview }) {
  const kb = useStore((s) => s.kb);
  const [flagging, setFlagging] = useState(false);
  const [issue, setIssue] = useState<QaIssue>("wrong_fact");
  const [note, setNote] = useState("");
  const { lead, message, question } = answer;
  const sources = (message.sources ?? []).map((id) => kb.find((k) => k.id === id)?.title).filter(Boolean);

  return (
    <li className="space-y-2.5 px-5 py-4">
      {question && (
        <div className="flex gap-2.5">
          <Avatar name={lead.name} size="sm" />
          <p className="max-w-[80%] rounded-lg rounded-tl-xs border border-line bg-surface px-3 py-2 text-sm">{question.text}</p>
        </div>
      )}
      <div className="flex gap-2.5">
        <BotAvatar size="sm" />
        <div className="min-w-0 max-w-[80%]">
          <p className="rounded-lg rounded-tl-xs bg-accent-soft px-3 py-2 text-sm whitespace-pre-wrap">{message.text}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-ink-subtle">
            <span>{dateTime(message.at)}</span>
            {sources.map((s) => (
              <span key={s} className="inline-flex items-center gap-1">
                <BookOpen className="size-2.5" /> {s}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="pl-9.5">
        {review ? (
          <div
            className={cn(
              "flex items-start gap-2 rounded-sm border px-3 py-2 text-xs",
              review.verdict === "correct" ? "border-success/20 bg-success-soft" : "border-danger/20 bg-danger-soft",
            )}
          >
            {review.verdict === "correct" ? (
              <CircleCheck className="mt-px size-3.5 shrink-0 text-success" />
            ) : (
              <Flag className="mt-px size-3.5 shrink-0 text-danger" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">
                {review.verdict === "correct" ? "Correct" : QA_ISSUES[review.issue ?? "other"]}
                <span className="font-normal text-ink-subtle"> · {review.reviewer}, {dateTime(review.at)}</span>
              </p>
              {review.note && <p className="mt-0.5 text-ink-muted">{review.note}</p>}
            </div>
            <Button size="xs" variant="ghost" onClick={() => clearReview(message.id)}>
              <Undo2 /> Undo
            </Button>
          </div>
        ) : flagging ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              reviewAnswer(lead.id, message.id, "wrong", issue, note);
              setFlagging(false);
            }}
            className="flex flex-wrap items-center gap-2 rounded-sm border border-danger/20 bg-danger-soft/50 p-2"
          >
            <Select value={issue} onChange={(e) => setIssue(e.target.value as QaIssue)} className="w-52" aria-label="Issue">
              {(Object.keys(QA_ISSUES) as QaIssue[]).map((k) => (
                <option key={k} value={k}>
                  {QA_ISSUES[k]}
                </option>
              ))}
            </Select>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should it have said?" className="min-w-48 flex-1" />
            <Button size="sm" variant="ghost" onClick={() => setFlagging(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" type="submit">
              <Flag /> Flag answer
            </Button>
          </form>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => reviewAnswer(lead.id, message.id, "correct")}>
              <Check /> Correct
            </Button>
            <Button size="sm" variant="danger" onClick={() => setFlagging(true)}>
              <X /> Wrong
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

export function QualityReview() {
  const state = useStore((s) => s);
  const now = useNow();
  const qa = useMemo(() => qaSample(state, now + 1), [state, now]);
  const [selected, setSelected] = useState<string>();
  const current = qa.conversations.find((c) => c.lead.id === selected) ?? qa.conversations[0];

  const flagged = useMemo(
    () =>
      qa.conversations.flatMap((c) =>
        c.answers.filter((a) => qa.reviewById.get(a.message.id)?.verdict === "wrong").map((a) => ({ ...a, review: qa.reviewById.get(a.message.id)! })),
      ),
    [qa],
  );

  const onTarget = qa.wrongPct === undefined || qa.wrongPct < QA_TARGET_PCT;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Quality review"
        description={`Weekly sample of up to ${QA_SAMPLE_SIZE} conversations. Check each concierge answer against the approved knowledge base.`}
        actions={
          <Badge>
            {shortDate(now - 7 * 864e5)} – {shortDate(now)}
          </Badge>
        }
      />
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            icon={MessagesSquare}
            label="Conversations reviewed"
            value={`${qa.conversationsDone} / ${qa.conversations.length}`}
            delta={`Sample of up to ${QA_SAMPLE_SIZE}`}
          />
          <Stat icon={ShieldCheck} label="Answers reviewed" value={`${qa.reviewed} / ${qa.answers}`} delta={`${qa.answers - qa.reviewed} left this week`} />
          <Stat
            icon={Flag}
            label="Answers flagged wrong"
            value={qa.wrongPct === undefined ? "—" : `${qa.wrongPct.toFixed(1)}%`}
            target={`< ${QA_TARGET_PCT}%`}
            good={qa.wrongPct === undefined ? undefined : onTarget}
            delta={qa.wrongPct === undefined ? "Nothing reviewed yet" : onTarget ? "On target" : "Above target"}
          />
          <Stat icon={X} label="Flagged answers" value={qa.wrong} delta="Fix the KB, then re-check" />
        </section>

        {qa.conversations.length === 0 ? (
          <Card>
            <EmptyState icon={MessagesSquare} title="No concierge answers this week" description="Conversations show up here once the concierge has replied." />
          </Card>
        ) : (
          <Card className="grid min-h-[520px] overflow-hidden md:grid-cols-[280px_1fr]">
            <ul className="divide-y divide-line border-r border-line">
              {qa.conversations.map(({ lead, answers }) => {
                const done = answers.filter((a) => qa.reviewById.has(a.message.id)).length;
                const wrong = answers.some((a) => qa.reviewById.get(a.message.id)?.verdict === "wrong");
                return (
                  <li key={lead.id}>
                    <button
                      onClick={() => setSelected(lead.id)}
                      className={cn("flex w-full items-center gap-2.5 px-3 py-2.5 text-left", lead.id === current?.lead.id ? "bg-accent-soft/60" : "hover:bg-subtle")}
                    >
                      <Avatar name={lead.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">{lead.name}</span>
                          <ChannelIcon channel={lead.channel} />
                          <LangTag lang={lead.language} />
                        </span>
                        <span className="text-2xs text-ink-subtle">
                          {done} of {answers.length} answers reviewed
                        </span>
                      </span>
                      {wrong ? (
                        <Flag className="size-3.5 shrink-0 text-danger" />
                      ) : done === answers.length ? (
                        <CircleCheck className="size-3.5 shrink-0 text-success" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            {current && (
              <div className="min-w-0">
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <p className="text-sm font-semibold">{current.lead.name}</p>
                  <Link href={`/inbox?c=${current.lead.id}`} className="text-xs text-accent hover:underline">
                    Open full conversation
                  </Link>
                </div>
                <ul className="divide-y divide-line">
                  {current.answers.map((a) => (
                    <AnswerReview key={a.message.id} answer={a} review={qa.reviewById.get(a.message.id)} />
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        <Card>
          <CardHeader
            title="Flagged this week"
            description="Fix the source in the knowledge base so the concierge doesn't repeat it."
            actions={
              <Link href="/knowledge" className="text-xs text-accent hover:underline">
                Open knowledge base
              </Link>
            }
          />
          {flagged.length === 0 ? (
            <EmptyState icon={CircleCheck} title="Nothing flagged" description="Answers marked wrong show up here." />
          ) : (
            <ul className="divide-y divide-line">
              {flagged.map(({ lead, message, review }) => (
                <li key={message.id} className="flex items-start gap-3 px-4 py-3">
                  <Flag className="mt-0.5 size-4 shrink-0 text-danger" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{QA_ISSUES[review.issue ?? "other"]}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">“{message.text}”</p>
                    {review.note && <p className="mt-1 text-xs text-ink">{review.note}</p>}
                  </div>
                  <button onClick={() => setSelected(lead.id)} className="shrink-0 text-xs text-ink-subtle hover:underline">
                    {lead.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
