import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import DebugView from "../components/views/DebugView";

function DebugScreen() {
  const navigate = useNavigate();
  return <DebugView onBack={() => navigate({ to: "/settings" })} />;
}

export const Route = createFileRoute("/debug")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw redirect({ to: "/" });
  },
  component: DebugScreen,
});
