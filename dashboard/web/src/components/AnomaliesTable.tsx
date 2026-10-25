import { useMemo, useState } from "react";
import type { AnomalyRow, AnomalyTier } from "../types";
import { FlowDetailDrawer } from "./FlowDetailDrawer";
import { TierBadge } from "./TierBadge";

type SortKey = "max_probability" | "true_userclass" | "predicted_userclass";

interface AnomaliesTableProps {
  rows: AnomalyRow[];
}

export function AnomaliesTable({ rows }: AnomaliesTableProps) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | AnomalyTier>("all");
  const [sortKey, setSortKey] = useState<SortKey>("max_probability");
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState<AnomalyRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (tierFilter !== "all") {
      list = list.filter((r) => r.anomaly_tier === tierFilter);
    }
    if (q) {
      list = list.filter(
        (r) =>
          r.true_userclass.toLowerCase().includes(q) ||
          r.predicted_userclass.toLowerCase().includes(q) ||
          String(r.srcIP ?? "").toLowerCase().includes(q) ||
          String(r.dstIP ?? "").toLowerCase().includes(q) ||
          String(r.row_id).includes(q),
      );
    }
    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDesc ? bv - av : av - bv;
      }
      return sortDesc
        ? String(bv).localeCompare(String(av))
        : String(av).localeCompare(String(bv));
    });
  }, [rows, search, tierFilter, sortKey, sortDesc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDesc(!sortDesc);
    else {
      setSortKey(key);
      setSortDesc(key === "max_probability");
    }
  }

  return (
    <div className="rounded-xl border border-uh-green/10 bg-white shadow-card">
      <div className="flex flex-wrap items-end gap-3 border-b border-uh-green/10 p-4">
        <div className="min-w-[12rem] flex-1">
          <label className="text-xs font-medium text-uh-slate/70">
            Search IP, class, or row ID
          </label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. Fiscal, 128.171…"
            className="mt-1 w-full rounded-lg border border-uh-green/20 px-3 py-2 text-sm focus:border-uh-green focus:outline-none focus:ring-2 focus:ring-uh-gold/40"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-uh-slate/70">Tier</label>
          <select
            value={tierFilter}
            onChange={(e) =>
              setTierFilter(e.target.value as "all" | AnomalyTier)
            }
            className="mt-1 rounded-lg border border-uh-green/20 px-3 py-2 text-sm focus:border-uh-green focus:outline-none"
          >
            <option value="all">All</option>
            <option value="high">High confidence</option>
            <option value="maybe">Maybe</option>
          </select>
        </div>
        <p className="text-sm text-uh-slate/60">
          Showing <strong>{filtered.length}</strong> of {rows.length}
        </p>
      </div>

      <div className="max-h-[32rem] overflow-auto scrollbar-thin">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 bg-uh-sand text-xs uppercase tracking-wide text-uh-slate/70">
            <tr>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("true_userclass")}>
                  True class {sortKey === "true_userclass" ? (sortDesc ? "↓" : "↑") : ""}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("predicted_userclass")}
                >
                  Predicted{" "}
                  {sortKey === "predicted_userclass" ? (sortDesc ? "↓" : "↑") : ""}
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("max_probability")}>
                  Confidence{" "}
                  {sortKey === "max_probability" ? (sortDesc ? "↓" : "↑") : ""}
                </button>
              </th>
              <th className="px-4 py-3">Source IP</th>
              <th className="px-4 py-3">Ports</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-uh-green/5">
            {filtered.map((row) => (
              <tr key={row.row_id} className="hover:bg-uh-sand/60">
                <td className="px-4 py-2.5">
                  <TierBadge tier={row.anomaly_tier} />
                </td>
                <td className="px-4 py-2.5 font-medium">{row.true_userclass}</td>
                <td className="px-4 py-2.5 text-status-red font-medium">
                  {row.predicted_userclass}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">
                  {(row.max_probability * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-2.5 font-mono text-xs tabular-nums">
                  {row.srcIP ?? "—"}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs tabular-nums">
                  {row.srcPort ?? "—"} → {row.dstPort ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => setSelected(row)}
                    className="rounded-md bg-uh-green px-3 py-1 text-xs font-medium text-white hover:bg-uh-green-light"
                  >
                    Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FlowDetailDrawer row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
