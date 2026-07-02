import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SummaryView from "../components/views/SummaryView";
import { useSessionHandoff } from "../AppState";

function SummaryScreen() {
  const navigate = useNavigate();
  const { lastSummary, lastSessionMode, setLastSummary } = useSessionHandoff();

  // Refresh on /summary lands here with no summary in memory — redirect home.
  useEffect(() => {
    if (!lastSummary) navigate({ to: "/" });
  }, [lastSummary, navigate]);

  if (!lastSummary) return null;

  return (
    <SummaryView
      summary={lastSummary}
      onDismiss={() => {
        setLastSummary(null);
        navigate({ to: "/" });
      }}
      onReplay={() => {
        const mode = lastSessionMode ?? "notes";
        setLastSummary(null);
        navigate({ to: "/config/$mode", params: { mode } });
      }}
    />
  );
}

export const Route = createFileRoute("/summary")({
  component: SummaryScreen,
});
