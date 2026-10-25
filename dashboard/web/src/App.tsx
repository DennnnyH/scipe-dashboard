import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { loadDashboardData } from "./lib/data";
import { AnomaliesPage } from "./pages/AnomaliesPage";
import { ConfusionPage } from "./pages/ConfusionPage";
import { OverviewPage } from "./pages/OverviewPage";
import type { PageId } from "./types";

const { summary, anomalies, metrics } = loadDashboardData();

const TITLES: Record<PageId, string> = {
  overview: "Overview",
  anomalies: "Anomalies",
  confusion: "Class patterns",
};

export default function App() {
  const [page, setPage] = useState<PageId>("overview");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        page={page}
        onNavigate={setPage}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-uh-green/10 bg-white px-6 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-uh-green">{TITLES[page]}</h1>
              <p className="text-xs text-uh-slate/60">
                SCIPE · Campus network flow classification
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-uh-gold/30 px-3 py-1 font-medium text-uh-green-dark">
                IT monitoring
              </span>
              <span className="text-uh-slate/50">Evaluation snapshot</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          {page === "overview" && (
            <OverviewPage summary={summary} metrics={metrics} />
          )}
          {page === "anomalies" && <AnomaliesPage anomalies={anomalies} />}
          {page === "confusion" && <ConfusionPage metrics={metrics} />}
        </main>
      </div>
    </div>
  );
}
