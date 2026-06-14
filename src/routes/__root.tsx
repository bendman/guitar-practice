import { createRootRoute, Outlet } from "@tanstack/react-router";
import { NoteNamingProvider } from "../lib/noteNaming";
import { useAppState } from "../AppState";

function RootComponent() {
  const { noteNaming } = useAppState();
  return (
    <NoteNamingProvider naming={noteNaming}>
      <Outlet />
    </NoteNamingProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
