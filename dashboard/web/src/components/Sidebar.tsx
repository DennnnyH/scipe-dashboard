import type { PageId } from "../types";

const NAV: { id: PageId; label: string; description: string }[] = [
  { id: "overview", label: "Overview", description: "Network health at a glance" },
  { id: "anomalies", label: "Anomalies", description: "Misclassified flows to review" },
  { id: "confusion", label: "Class patterns", description: "Common label mismatches" },
];

interface SidebarProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  page,
  onNavigate,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={`flex flex-col border-r border-uh-green/15 bg-uh-green text-white transition-all duration-200 ${
        collapsed ? "w-[4.25rem]" : "w-64"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-uh-gold font-bold text-uh-green"
          aria-hidden
        >
          UH
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold leading-tight">
              SCIPE Flow Monitor
            </p>
            <p className="truncate text-xs text-uh-gold-bright/90">
              University of Hawaiʻi at Mānoa
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                active
                  ? "bg-white/15 text-white ring-1 ring-uh-gold/40"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="block text-sm font-medium">{item.label}</span>
              {!collapsed && (
                <span className="mt-0.5 block text-xs text-white/60">
                  {item.description}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full rounded-lg px-3 py-2 text-xs text-uh-gold-bright hover:bg-white/10"
        >
          {collapsed ? "»" : "« Collapse"}
        </button>
        {!collapsed && (
          <p className="mt-3 px-1 text-[10px] leading-relaxed text-white/50">
            Evaluation mode — test split from training data. Live ingest coming
            later.
          </p>
        )}
      </div>
    </aside>
  );
}
