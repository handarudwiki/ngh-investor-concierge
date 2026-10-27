"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { CalendarCheck, FileX, Info, Printer } from "lucide-react";
import { Avatar, Button, EmptyState } from "@/components/ui";
import { matchUnits, scenarios } from "@/lib/rules";
import { BUDGETS, OWNERSHIP, PURPOSES, TIMELINES, usd } from "@/lib/labels";
import { dateTime, day } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Language } from "@/lib/types";

const L: Record<Language, Record<string, string>> = {
  en: { title: "Investment brief", for: "Prepared for", profile: "Your profile", units: "Units that fit you", scen: "Indicative rental scenarios", indicative: "Indicative, not a guarantee", assumptions: "Assumptions", process: "How buying works", next: "Next step", call: "Your call", book: "Book a call with", purpose: "Purpose", budget: "Budget", timeline: "Timeline", ownership: "Ownership", occ: "Occupancy", gross: "Gross revenue / yr", net: "Net revenue / yr", yld: "Net yield", price: "Price", lease: "Lease", handover: "Handover", years: "years", conservative: "Conservative", base: "Base", optimistic: "Optimistic" },
  nl: { title: "Investeringsbrief", for: "Opgesteld voor", profile: "Uw profiel", units: "Units die bij u passen", scen: "Indicatieve verhuurscenario's", indicative: "Indicatief, geen garantie", assumptions: "Aannames", process: "Hoe kopen werkt", next: "Volgende stap", call: "Uw gesprek", book: "Plan een gesprek met", purpose: "Doel", budget: "Budget", timeline: "Termijn", ownership: "Eigendom", occ: "Bezetting", gross: "Bruto-opbrengst / jr", net: "Netto-opbrengst / jr", yld: "Nettorendement", price: "Prijs", lease: "Lease", handover: "Oplevering", years: "jaar", conservative: "Voorzichtig", base: "Basis", optimistic: "Optimistisch" },
  id: { title: "Brief investasi", for: "Disiapkan untuk", profile: "Profil Anda", units: "Unit yang cocok", scen: "Skenario sewa indikatif", indicative: "Indikatif, bukan jaminan", assumptions: "Asumsi", process: "Proses pembelian", next: "Langkah berikutnya", call: "Jadwal panggilan Anda", book: "Jadwalkan panggilan dengan", purpose: "Tujuan", budget: "Budget", timeline: "Waktu", ownership: "Kepemilikan", occ: "Okupansi", gross: "Pendapatan kotor / thn", net: "Pendapatan bersih / thn", yld: "Imbal hasil bersih", price: "Harga", lease: "Sewa", handover: "Serah terima", years: "tahun", conservative: "Konservatif", base: "Dasar", optimistic: "Optimis" },
  ru: { title: "Инвестиционная подборка", for: "Подготовлено для", profile: "Ваш профиль", units: "Подходящие юниты", scen: "Ориентировочные сценарии аренды", indicative: "Ориентировочно, не гарантия", assumptions: "Допущения", process: "Как проходит покупка", next: "Следующий шаг", call: "Ваш звонок", book: "Записаться на звонок с", purpose: "Цель", budget: "Бюджет", timeline: "Сроки", ownership: "Владение", occ: "Загрузка", gross: "Валовой доход / год", net: "Чистый доход / год", yld: "Чистая доходность", price: "Цена", lease: "Аренда", handover: "Сдача", years: "лет", conservative: "Осторожный", base: "Базовый", optimistic: "Оптимистичный" },
  es: { title: "Brief de inversión", for: "Preparado para", profile: "Su perfil", units: "Unidades que encajan", scen: "Escenarios de alquiler indicativos", indicative: "Indicativo, no garantizado", assumptions: "Supuestos", process: "Cómo funciona la compra", next: "Siguiente paso", call: "Su llamada", book: "Reserve una llamada con", purpose: "Objetivo", budget: "Presupuesto", timeline: "Plazo", ownership: "Propiedad", occ: "Ocupación", gross: "Ingresos brutos / año", net: "Ingresos netos / año", yld: "Rentabilidad neta", price: "Precio", lease: "Arrendamiento", handover: "Entrega", years: "años", conservative: "Conservador", base: "Base", optimistic: "Optimista" },
};

export function Brief() {
  const { id } = useParams<{ id: string }>();
  const lead = useStore((s) => s.leads.find((l) => l.id === id));
  const units = useStore((s) => s.units);
  const assumptions = useStore((s) => s.assumptions);
  const kb = useStore((s) => s.kb);
  const advisors = useStore((s) => s.advisors);

  const picked = useMemo(() => {
    if (!lead) return [];
    const chosen = units.filter((u) => lead.unitIds.includes(u.id));
    return chosen.length ? chosen : matchUnits(lead, units);
  }, [lead, units]);

  if (!lead) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <EmptyState icon={FileX} title="Brief not available" description="This brief may have expired or been deleted on request." />
      </div>
    );
  }

  const t = L[lead.language];
  const advisor = advisors.find((a) => a.id === (lead.booking?.advisorId ?? lead.advisorId));
  const process = kb.find((k) => k.id === "kb-process");
  const steps = (process?.body[lead.language] ?? process?.body.en ?? "").split(/\s?\d\)\s/).filter(Boolean);

  return (
    <div className="min-h-dvh bg-canvas py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-3xl justify-end px-4">
        <Button onClick={() => window.print()}>
          <Printer /> Print or save as PDF
        </Button>
      </div>

      <article className="mx-auto max-w-3xl rounded-lg border border-line bg-surface shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b border-line px-10 py-8">
          <div>
            <div className="mb-6 flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center rounded-md bg-accent font-display text-lg text-ink-inverse italic">n</span>
              <span className="text-sm font-semibold tracking-wide">NGH PROPERTY GROUP</span>
            </div>
            <p className="text-xs tracking-widest text-ink-subtle uppercase">{t.title} · Uluwatu Paradise</p>
            <h1 className="mt-1 font-display text-3xl text-ink">
              {t.for} {lead.name}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">{day(lead.briefGeneratedAt ?? lead.createdAt, lead.timezone)}</p>
          </div>
          {advisor && (
            <div className="flex shrink-0 items-center gap-2.5 rounded-md bg-subtle px-3 py-2">
              <Avatar name={advisor.name} size="md" />
              <div className="text-xs">
                <p className="font-semibold text-ink">{advisor.name}</p>
                <p className="text-ink-muted">{advisor.title}</p>
                <p className="text-ink-subtle">{advisor.email}</p>
              </div>
            </div>
          )}
        </header>

        <section className="grid grid-cols-2 gap-x-8 gap-y-3 border-b border-line px-10 py-6 sm:grid-cols-4">
          <h2 className="col-span-full text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t.profile}</h2>
          {[
            [t.purpose, lead.purpose && PURPOSES[lead.purpose]],
            [t.budget, lead.budget && BUDGETS[lead.budget]],
            [t.timeline, lead.timeline && TIMELINES[lead.timeline]],
            [t.ownership, lead.ownership && OWNERSHIP[lead.ownership]],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-2xs text-ink-subtle">{k}</p>
              <p className="text-sm font-medium">{v || "—"}</p>
            </div>
          ))}
        </section>

        <section className="space-y-6 border-b border-line px-10 py-6">
          <h2 className="text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t.units}</h2>
          {picked.map((u) => (
            <div key={u.id} className="break-inside-avoid">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-2xl">{u.name}</h3>
                <p className="text-lg font-semibold tabular-nums">{usd(u.priceUsd)}</p>
              </div>
              <p className="mt-0.5 text-sm text-ink-muted">
                {u.type} · {u.bedrooms} BR · {u.sizeSqm} m² · {t.lease} {u.leaseYears} {t.years} · {t.handover} {u.handover}
              </p>

              <div className="mt-4 overflow-hidden rounded-md border border-line">
                <div className="flex items-center justify-between gap-2 border-b border-line bg-warning-soft px-4 py-2">
                  <p className="text-sm font-semibold">{t.scen}</p>
                  <span className="rounded-xs border border-warning/30 bg-surface px-1.5 py-0.5 text-2xs font-semibold text-warning uppercase">
                    {t.indicative}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-2xs text-ink-subtle uppercase [&>th]:px-4 [&>th]:py-2 [&>th]:font-medium">
                      <th />
                      <th>{t.occ}</th>
                      <th className="text-right">{t.gross}</th>
                      <th className="text-right">{t.net}</th>
                      <th className="text-right">{t.yld}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios(u, assumptions).map((sc) => (
                      <tr key={sc.key} className="border-t border-line tabular-nums [&>td]:px-4 [&>td]:py-2">
                        <td className="font-medium">{t[sc.key]}</td>
                        <td>{sc.occupancy}%</td>
                        <td className="text-right">{usd(sc.grossRevenue)}</td>
                        <td className="text-right">{usd(sc.netRevenue)}</td>
                        <td className="text-right font-semibold">{sc.netYieldPct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-line bg-subtle px-4 py-2 text-2xs text-ink-muted">
                  <b className="font-semibold">{t.assumptions}:</b> {usd(u.adrUsd)} average nightly rate · occupancy {assumptions.occupancy.conservative}/
                  {assumptions.occupancy.base}/{assumptions.occupancy.optimistic}% · management fee {assumptions.managementFeePct}% · operating costs{" "}
                  {assumptions.operatingCostPct}% of revenue · before tax, financing and lease costs.
                </p>
              </div>
            </div>
          ))}
        </section>

        {steps.length > 0 && (
          <section className="border-b border-line px-10 py-6">
            <h2 className="mb-3 text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t.process}</h2>
            <ol className="grid gap-2 sm:grid-cols-2">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-2xs font-semibold text-accent-ink">{i + 1}</span>
                  <span className="text-ink-muted">{s.replace(/\.$/, "")}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="px-10 py-6">
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-ink-subtle uppercase">{t.next}</h2>
          {lead.booking ? (
            <p className="flex items-center gap-2 text-sm">
              <CalendarCheck className="size-4 text-accent" /> {t.call}: <b>{dateTime(lead.booking.at, lead.timezone)}</b> ({lead.timezone}) · {advisor?.name}
            </p>
          ) : (
            advisor?.calendlyUrl && (
              <a href={advisor.calendlyUrl} className="inline-flex items-center gap-2 text-sm font-medium text-accent underline">
                <CalendarCheck className="size-4" /> {t.book} {advisor.name}
              </a>
            )
          )}
          <p className="mt-6 flex gap-2 rounded-md bg-subtle p-3 text-2xs leading-relaxed text-ink-muted">
            <Info className="mt-px size-3.5 shrink-0" />
            {assumptions.disclaimer}
          </p>
        </section>
      </article>
    </div>
  );
}
