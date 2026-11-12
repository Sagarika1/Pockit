"use client";
import { useCallback, useEffect, useState } from "react";
import { ErrorText, Field, PageLoading, SuccessText, inputClass, primaryBtn, smallGhostBtn } from "@/components/ui";
import { useRequireRole } from "@/components/useMe";
import { CATEGORY_KEYS, CATEGORY_LABEL, defaultRules, describeRules, type Category, type CategoryAction, type Rules } from "@/lib/rules";

const ACTION_LABEL: Record<CategoryAction, string> = {
  auto: "Pay automatically",
  review: "I approve each one",
  deny: "Never reimburse",
};

export default function RulesPage() {
  const { ready } = useRequireRole("treasurer");
  const [rules, setRules] = useState<Rules>(defaultRules());
  const [keywords, setKeywords] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState("");
  const [found, setFound] = useState<{ summary: string; assumptions: string[] } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/rules", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setRules(d.rules);
    setKeywords((d.rules.registrationVendorKeywords as string[]).join(", "));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  function change(next: Rules) {
    setRules(next);
    setDirty(true);
    setSaved("");
  }

  function setCategory(key: Category, patch: Partial<Rules["categories"][Category]>) {
    const current = rules.categories[key];
    const merged = { ...current, ...patch };
    if (merged.action !== "auto") merged.cap = null;
    change({ ...rules, categories: { ...rules.categories, [key]: merged } });
  }

  async function save() {
    setSaving(true);
    setError("");
    setSaved("");
    const res = await fetch("/api/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rules, registrationVendorKeywords: keywords }),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) return setError(d.error || "Something went wrong.");
    setRules(d.rules);
    setKeywords((d.rules.registrationVendorKeywords as string[]).join(", "));
    setDirty(false);
    setFound(null);
    setSaved("Saved. New receipts use these rules right away.");
  }

  async function readFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setReading(true);
    setReadError("");
    setFound(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/rules/extract", { method: "POST", body: form });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "We couldn’t read that file.");
      setRules(d.rules);
      setKeywords((d.rules.registrationVendorKeywords as string[]).join(", "));
      setFound({ summary: d.summary, assumptions: d.assumptions });
      setDirty(true);
      setSaved("");
    } catch (err) {
      setReadError(err instanceof Error ? err.message : "We couldn’t read that file.");
    } finally {
      setReading(false);
    }
  }

  if (!ready || !loaded) return <PageLoading />;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your rules</h1>
      <div className="mt-2 h-1 w-9 rounded-full bg-accent" aria-hidden="true" />
      <p className="mt-2 max-w-3xl text-lg text-muted">Set your spending rules once. Pockit checks every receipt against them. Anything that breaks a rule comes to you.</p>

      {/* Upload */}
      <section className="mt-8 rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold">Upload your rules (optional)</h2>
        <p className="mt-1 max-w-3xl text-[15px] leading-relaxed text-muted">
          Have a budget policy or reimbursement guidelines? Upload it as a PDF, a photo or a text file. Pockit fills in the form below. You check it and save. Nothing changes until you press Save.
        </p>
        <label className={`${smallGhostBtn} mt-4 cursor-pointer focus-within:outline-2 focus-within:outline-brand`}>
          {reading ? "Reading your file…" : "Choose a file"}
          <input type="file" accept=".pdf,.txt,.md,image/png,image/jpeg,image/webp" onChange={readFile} disabled={reading} className="sr-only" />
        </label>
        <div className="mt-4 space-y-3">
          <ErrorText>{readError}</ErrorText>
          {found && (
            <div className="rounded-xl border border-brand/40 bg-soft px-5 py-4 text-[15px]">
              <p className="font-semibold">We filled in the form below from your file. Please check it, then save.</p>
              {found.summary && <p className="mt-2 text-muted">{found.summary}</p>}
              {found.assumptions.length > 0 && (
                <>
                  <p className="mt-3 font-semibold">Double check:</p>
                  <ul className="mt-1 space-y-1 text-muted">
                    {found.assumptions.map((a) => (
                      <li key={a}>• {a}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          {/* What gets paid automatically */}
          <section className="rounded-3xl border border-line bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold">What should happen with each kind of expense?</h2>
            <div className="mt-5 divide-y divide-line">
              {CATEGORY_KEYS.map((key) => {
                const c = rules.categories[key];
                return (
                  <div key={key} className="grid items-end gap-3 py-4 sm:grid-cols-[1fr_1fr_9rem]">
                    <p className="font-semibold sm:pb-3">{CATEGORY_LABEL[key]}</p>
                    <Field id={`act-${key}`} label="What to do">
                      <select id={`act-${key}`} className={inputClass} value={c.action} onChange={(e) => setCategory(key, { action: e.target.value as CategoryAction })}>
                        {(Object.keys(ACTION_LABEL) as CategoryAction[]).map((a) => (
                          <option key={a} value={a}>
                            {ACTION_LABEL[a]}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field id={`cap-${key}`} label="Limit per receipt ($)">
                      <input
                        id={`cap-${key}`}
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        disabled={c.action !== "auto"}
                        placeholder={c.action === "auto" ? "No limit" : "–"}
                        className={`${inputClass} disabled:opacity-50`}
                        value={c.action === "auto" && c.cap !== null ? c.cap : ""}
                        onChange={(e) => setCategory(key, { cap: e.target.value === "" ? null : Number(e.target.value) })}
                      />
                    </Field>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Event and general */}
          <section className="rounded-3xl border border-line bg-card p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Dates and safety checks</h2>
            <div className="mt-5 space-y-5">
              <Field id="eventName" label="Event or trip name">
                <input id="eventName" className={inputClass} value={rules.eventName} onChange={(e) => change({ ...rules, eventName: e.target.value })} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="eventStart" label="First day">
                  <input id="eventStart" type="date" className={inputClass} value={rules.eventStart} onChange={(e) => change({ ...rules, eventStart: e.target.value })} />
                </Field>
                <Field id="eventEnd" label="Last day">
                  <input id="eventEnd" type="date" className={inputClass} value={rules.eventEnd} onChange={(e) => change({ ...rules, eventEnd: e.target.value })} />
                </Field>
              </div>
              <label className="flex items-start gap-3 text-[15px]">
                <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--brand)]" checked={rules.requireEventDates} onChange={(e) => change({ ...rules, requireEventDates: e.target.checked })} />
                <span>
                  <span className="font-semibold">Only pay automatically for receipts dated on those days.</span>
                  <span className="block text-muted">Receipts from other days come to you. Registration fees are exempt, since they’re usually paid ahead of time.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-[15px]">
                <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--brand)]" checked={rules.blockAlcohol} onChange={(e) => change({ ...rules, blockAlcohol: e.target.checked })} />
                <span>
                  <span className="font-semibold">Never reimburse alcohol.</span>
                  <span className="block text-muted">Receipts with alcohol are turned down.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-[15px]">
                <input id="partialPay" type="checkbox" className="mt-1 h-5 w-5 accent-[var(--brand)]" checked={rules.partialPay !== false} onChange={(e) => change({ ...rules, partialPay: e.target.checked })} />
                <span>
                  <span className="font-semibold">Pay up to the limit when someone spends more.</span>
                  <span className="block text-muted">Example: with a $50 meals limit, a $60 dinner pays back $50. If you turn this off, it comes to you to decide.</span>
                </span>
              </label>
              <Field id="ceiling" label="Never pay automatically more than ($)" hint="Anything above this comes to you, whatever the type.">
                <input id="ceiling" type="number" min={0} step="1" inputMode="decimal" className={inputClass} value={rules.autoPayCeiling} onChange={(e) => change({ ...rules, autoPayCeiling: Number(e.target.value) || 0 })} />
              </Field>
              <Field id="keywords" label="Approved registration vendors" hint="Registration receipts must come from a vendor with one of these words in the name. Separate words with commas. Leave blank to skip this check.">
                <input
                  id="keywords"
                  className={inputClass}
                  value={keywords}
                  onChange={(e) => {
                    setKeywords(e.target.value);
                    setDirty(true);
                    setSaved("");
                  }}
                  placeholder="e.g. nsec, engineering conference"
                />
              </Field>
            </div>
          </section>

          <div className="space-y-3">
            <ErrorText>{error}</ErrorText>
            <SuccessText>{saved}</SuccessText>
            <button onClick={save} disabled={saving || !dirty} className={primaryBtn}>
              {saving ? "Saving…" : dirty ? "Save rules" : "Saved"}
            </button>
          </div>
        </div>

        {/* Plain-language summary */}
        <aside className="h-fit rounded-3xl border border-line bg-soft p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 className="text-xl font-semibold">How your rules read</h2>
          <p className="mt-1 text-sm text-muted">This is what your members will see.</p>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {describeRules(rules).map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
