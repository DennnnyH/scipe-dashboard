import { useMemo } from "react";
import type { AnomalyRow } from "../types";

export interface SourceGroup {
  srcIP: string;
  count: number;
  high: number;
  maybe: number;
  maxProbability: number;
  pair: string;
  pairCount: number;
}

function buildGroups(rows: AnomalyRow[]): SourceGroup[] {
  const byIp = new Map<string, AnomalyRow[]>();
  for (const row of rows) {
    const ip = row.srcIP && row.srcIP.length > 0 ? row.srcIP : "(no source IP)";
    const list = byIp.get(ip);
    if (list) list.push(row);
    else byIp.set(ip, [row]);
  }

  const groups: SourceGroup[] = [];
  for (const [srcIP, list] of byIp) {
    let high = 0;
    let maybe = 0;
    let maxProbability = 0;
    const pairs = new Map<string, number>();
    for (const row of list) {
      if (row.anomaly_tier === "high") high += 1;
      else if (row.anomaly_tier === "maybe") maybe += 1;
      if (row.max_probability > maxProbability) maxProbability = row.max_probability;
      const pair = `${row.true_userclass} → ${row.predicted_userclass}`;
      pairs.set(pair, (pairs.get(pair) ?? 0) + 1);
    }
    let pair = "—";
    let pairCount = 0;
    for (const [label, count] of pairs) {
      if (count > pairCount) {
        pair = label;
        pairCount = count;
      }
    }
    groups.push({
      srcIP,
      count: list.length,
      high,
      maybe,
      maxProbability,
      pair,
      pairCount,
    });
  }

  groups.sort((a, b) => {
    const aHasHigh = a.high > 0 ? 1 : 0;
    const bHasHigh = b.high > 0 ? 1 : 0;
    if (aHasHigh !== bHasHigh) return bHasHigh - aHasHigh;
    if (a.maxProbability !== b.maxProbability) return b.maxProbability - a.maxProbability;
    return b.count - a.count;
  });
  return groups;
}

interface SourceQueueProps {
  rows: AnomalyRow[];
  selected: string | null;
  onSelect: (srcIP: string | null) => void;
}

export function SourceQueue({ rows, selected, onSelect }: SourceQueueProps) {
  const groups = useMemo(() => buildGroups(rows), [rows]);

  return (
    <div className="rounded-xl border border-uh-green/10 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-uh-green/10 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-uh-green">Sources to review</h3>
          <p className="text-xs text-uh-slate/60">
            Grouped by source IP. High-tier sources first, then confidence, then flow count.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-uh-slate/60">{groups.length} sources</p>
          {selected && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="rounded-md border border-uh-green/30 px-2.5 py-1 text-xs font-medium text-uh-green hover:bg-uh-sand"
            >
              Show all flows
            </button>
          )}
        </div>
      </div>
      <div className="max-h-64 overflow-auto scrollbar-thin">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 bg-uh-sand text-xs uppercase tracking-wide text-uh-slate/70">
            <tr>
              <th className="px-4 py-2">Source IP</th>
              <th className="px-4 py-2">Flows</th>
              <th className="px-4 py-2">High</th>
              <th className="px-4 py-2">Maybe</th>
              <th className="px-4 py-2">Max confidence</th>
              <th className="px-4 py-2">Most common mismatch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-uh-green/5">
            {groups.map((group) => {
              const active = selected === group.srcIP;
              return (
                <tr
                  key={group.srcIP}
                  className={active ? "bg-uh-gold/20" : "hover:bg-uh-sand/60"}
                >
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => onSelect(active ? null : group.srcIP)}
                      className="font-mono text-xs font-medium text-uh-green underline-offset-2 hover:underline"
                    >
                      {group.srcIP}
                    </button>
                  </td>
                  <td className="px-4 py-2 tabular-nums">{group.count}</td>
                  <td className="px-4 py-2 tabular-nums text-status-red">{group.high}</td>
                  <td className="px-4 py-2 tabular-nums">{group.maybe}</td>
                  <td className="px-4 py-2 font-mono text-xs tabular-nums">
                    {(group.maxProbability * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {group.pair}
                    <span className="ml-1 text-uh-slate/50">({group.pairCount})</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
