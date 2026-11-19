export function badgeClass(v: string) {
  const s = v.toLowerCase();
  if (/\b(active|live|validated|completed|delivered|resolved|on track|positive|approved|official|rising|done|accepted)/.test(s)) return "bg-success/10 text-success";
  if (/(pending|review|paused|delayed|medium|monitoring|invited|busy|on leave|neutral|draft|planning|expiring|duplicate|boundary|gps|too fast|after expiry)/.test(s)) return "bg-warning/10 text-warning";
  if (/(flagged|high|closed|suspended|failed|negative|rejected|inactive|falling|open|deleted|expired)/.test(s)) return "bg-destructive/10 text-destructive";
  return "bg-accent text-accent-foreground";
}

export function downloadCsv(name: string, rows: Record<string, unknown>[], cols?: { key: string; label: string }[]) {
  const c = cols ?? Object.keys(rows[0] ?? {}).filter((k) => !k.startsWith("_")).map((k) => ({ key: k, label: k }));
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [c.map((x) => esc(x.label)).join(","), ...rows.map((r) => c.map((x) => esc(r[x.key])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
