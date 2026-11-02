import { useMemo, useState } from "react";
import type { AnomalyRow } from "../types";
import { FlowDetailDrawer } from "./FlowDetailDrawer";
import { TierBadge } from "./TierBadge";

type SortKey = "max_probability" | "true_userclass" | "predicted_userclass";
type FilterKind = "text" | "number" | "percent";
type FilterOp = "eq" | "contains" | "gte" | "lte";

interface FieldDef {
  key: keyof AnomalyRow;
  label: string;
  kind: FilterKind;
}

interface FilterClause {
  id: string;
  field: keyof AnomalyRow;
  op: FilterOp;
  value: string;
}

const FIELDS: FieldDef[] = [
  { key: "true_userclass", label: "True class", kind: "text" },
  { key: "predicted_userclass", label: "Predicted class", kind: "text" },
  { key: "anomaly_tier", label: "Tier", kind: "text" },
  { key: "max_probability", label: "Confidence %", kind: "percent" },
  { key: "srcIP", label: "Source IP", kind: "text" },
  { key: "dstIP", label: "Destination IP", kind: "text" },
  { key: "srcPort", label: "Source port", kind: "number" },
  { key: "dstPort", label: "Destination port", kind: "number" },
  { key: "ipProtocol", label: "IP protocol", kind: "number" },
  { key: "packetSize", label: "Packet size", kind: "number" },
  { key: "type", label: "Type", kind: "text" },
  { key: "agentIP", label: "Agent IP", kind: "text" },
  { key: "inVlan", label: "VLAN", kind: "number" },
  { key: "userclass", label: "User class", kind: "text" },
  { key: "row_id", label: "Row ID", kind: "number" },
];

const TEXT_OPS: { value: FilterOp; label: string }[] = [
  { value: "eq", label: "is" },
  { value: "contains", label: "contains" },
];

const NUMBER_OPS: { value: FilterOp; label: string }[] = [
  { value: "gte", label: "≥" },
  { value: "lte", label: "≤" },
  { value: "eq", label: "=" },
];

function fieldDef(key: keyof AnomalyRow): FieldDef {
  return FIELDS.find((f) => f.key === key) ?? FIELDS[0];
}

function opsFor(kind: FilterKind) {
  return kind === "text" ? TEXT_OPS : NUMBER_OPS;
}

function nextId() {
  return Math.random().toString(36).slice(2, 9);
}

function cellNumber(row: AnomalyRow, field: FieldDef): number | null {
  if (field.kind === "percent") return row.max_probability * 100;
  const raw = row[field.key];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return null;
}

function matchesClause(row: AnomalyRow, clause: FilterClause): boolean {
  const value = clause.value.trim();
  if (!value) return true;
  const field = fieldDef(clause.field);

  if (field.kind === "text") {
    const cell = String(row[field.key] ?? "").toLowerCase();
    const needle = value.toLowerCase();
    if (clause.op === "contains") return cell.includes(needle);
    return cell === needle;
  }

  const num = Number(value);
  if (!Number.isFinite(num)) return true;
  const cell = cellNumber(row, field);
  if (cell === null) return false;
  if (clause.op === "gte") return cell >= num;
  if (clause.op === "lte") return cell <= num;
  return cell === num;
}

interface AnomaliesTableProps {
  rows: AnomalyRow[];
  sourceIp?: string | null;
}

export function AnomaliesTable({ rows, sourceIp = null }: AnomaliesTableProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterClause[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("max_probability");
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState<AnomalyRow | null>(null);

  const suggestions = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const field of FIELDS) {
      if (field.kind !== "text") continue;
      const values = new Set<string>();
      for (const row of rows) {
        const v = row[field.key];
        if (v !== undefined && v !== null && String(v) !== "") values.add(String(v));
      }
      map.set(field.key, [...values].sort((a, b) => a.localeCompare(b)));
    }
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (sourceIp) {
      list = list.filter((r) => (r.srcIP ?? "(no source IP)") === sourceIp);
    }
    if (filters.length) {
      list = list.filter((r) => filters.every((clause) => matchesClause(r, clause)));
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
  }, [rows, search, filters, sortKey, sortDesc, sourceIp]);

  function addFilter() {
    setFilters((prev) => [
      ...prev,
      { id: nextId(), field: "true_userclass", op: "eq", value: "" },
    ]);
  }

  function updateFilter(id: string, patch: Partial<FilterClause>) {
    setFilters((prev) =>
      prev.map((clause) => {
        if (clause.id !== id) return clause;
        const next = { ...clause, ...patch };
        if (patch.field && fieldDef(patch.field).kind !== fieldDef(clause.field).kind) {
          next.op = opsFor(fieldDef(patch.field).kind)[0].value;
        }
        return next;
      }),
    );
  }

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
        <p className="text-sm text-uh-slate/60">
          Showing <strong>{filtered.length}</strong>
          {sourceIp ? ` for ${sourceIp}` : ""} of {rows.length}
        </p>
      </div>

      <div className="space-y-2 border-b border-uh-green/10 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium text-uh-slate/70">
            Filters apply together. Each one narrows the rows that already match.
          </p>
          <button
            type="button"
            onClick={addFilter}
            className="rounded-md border border-uh-green/30 px-2.5 py-1 text-xs font-medium text-uh-green hover:bg-uh-sand"
          >
            Add filter
          </button>
          {filters.length > 0 && (
            <button
              type="button"
              onClick={() => setFilters([])}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-uh-slate/60 hover:text-uh-slate"
            >
              Clear
            </button>
          )}
        </div>
        {filters.map((clause, index) => {
          const field = fieldDef(clause.field);
          const ops = opsFor(field.kind);
          const listId = `filter-values-${clause.id}`;
          const options = suggestions.get(clause.field) ?? [];
          return (
            <div key={clause.id} className="flex flex-wrap items-center gap-2">
              <span className="w-10 text-xs font-medium uppercase tracking-wide text-uh-slate/50">
                {index === 0 ? "Where" : "and"}
              </span>
              <select
                value={clause.field}
                onChange={(e) =>
                  updateFilter(clause.id, { field: e.target.value as keyof AnomalyRow })
                }
                className="rounded-lg border border-uh-green/20 px-2 py-1.5 text-sm focus:border-uh-green focus:outline-none"
              >
                {FIELDS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
              <select
                value={clause.op}
                onChange={(e) =>
                  updateFilter(clause.id, { op: e.target.value as FilterOp })
                }
                className="rounded-lg border border-uh-green/20 px-2 py-1.5 text-sm focus:border-uh-green focus:outline-none"
              >
                {ops.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
              <input
                list={options.length ? listId : undefined}
                value={clause.value}
                onChange={(e) => updateFilter(clause.id, { value: e.target.value })}
                placeholder={field.kind === "percent" ? "e.g. 90" : "value"}
                className="min-w-[10rem] flex-1 rounded-lg border border-uh-green/20 px-3 py-1.5 text-sm focus:border-uh-green focus:outline-none focus:ring-2 focus:ring-uh-gold/40"
              />
              {options.length > 0 && (
                <datalist id={listId}>
                  {options.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              )}
              <button
                type="button"
                onClick={() => setFilters((prev) => prev.filter((f) => f.id !== clause.id))}
                className="rounded-md px-2 py-1 text-xs text-uh-slate/60 hover:text-status-red"
                aria-label="Remove filter"
              >
                Remove
              </button>
            </div>
          );
        })}
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
