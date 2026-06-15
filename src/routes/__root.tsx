import { createRootRoute, Outlet } from "@tanstack/react-router";
import { NoteNamingProvider } from "../lib/noteNaming";
import { useSettings } from "../AppState";

function RootComponent() {
  const { noteNaming } = useSettings();
  return (
    <NoteNamingProvider naming={noteNaming}>
      <Outlet />
    </NoteNamingProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
});
