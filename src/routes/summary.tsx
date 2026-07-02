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
        // Don't clear the summary here: the guard effect above would see it go
        // null while this screen is still mounted and its navigate home would
        // stomp this navigation. The next session overwrites it anyway.
        navigate({ to: "/config/$mode", params: { mode: lastSessionMode ?? "notes" } });
      }}
    />
  );
}

export const Route = createFileRoute("/summary")({
  component: SummaryScreen,
});
