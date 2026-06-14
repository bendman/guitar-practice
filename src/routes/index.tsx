import { createFileRoute, useNavigate } from "@tanstack/react-router";
import WelcomeView from "../components/views/WelcomeView";
import { useAppState } from "../AppState";

function HomeScreen() {
  const { stats } = useAppState();
  const navigate = useNavigate();
  return (
    <WelcomeView
      stats={stats}
      onPickNotes={() => navigate({ to: "/config/$mode", params: { mode: "notes" } })}
      onPickChords={() => navigate({ to: "/config/$mode", params: { mode: "chords" } })}
      onShowProgress={() => navigate({ to: "/settings" })}
    />
  );
}

export const Route = createFileRoute("/")({ component: HomeScreen });
