import { createContext, useContext } from "react";
import { formatNoteLabel } from "./util";
import type { NoteNaming } from "./util";

const NoteNamingContext = createContext<NoteNaming>("solfege");

export function NoteNamingProvider({
  naming, children,
}: {
  naming: NoteNaming;
  children: React.ReactNode;
}) {
  return (
    <NoteNamingContext.Provider value={naming}>
      {children}
    </NoteNamingContext.Provider>
  );
}

/** Returns a formatter that translates labels into the active note naming. */
export function useFormatLabel(): (label: string) => string {
  const naming = useContext(NoteNamingContext);
  return (label: string) => formatNoteLabel(label, naming);
}
