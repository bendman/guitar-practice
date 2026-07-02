import type { BtnSpec } from "./ControlBar";

/**
 * Shared control-bar button specs. Each session screen composes its per-phase
 * button sets from these so labels, icons and variants stay consistent and are
 * edited in one place.
 */
export const btn = {
  pause: (onClick: () => void): BtnSpec => ({
    key: "pause",
    icon: "pause",
    label: "Pause",
    variant: "accent-line",
    onClick,
  }),
  resume: (onClick: () => void): BtnSpec => ({
    key: "resume",
    icon: "play",
    label: "Reprendre",
    variant: "primary",
    onClick,
  }),
  next: (onClick: () => void): BtnSpec => ({
    key: "next",
    icon: "next",
    label: "Suivant",
    variant: "secondary",
    onClick,
  }),
  stop: (onClick: () => void): BtnSpec => ({
    key: "stop",
    icon: "stop",
    label: "Arrêter",
    variant: "danger",
    onClick,
  }),
  see: (onClick: () => void): BtnSpec => ({
    key: "see",
    icon: "eye",
    label: "Voir",
    variant: "primary",
    onClick,
  }),
  continue: (onClick: () => void): BtnSpec => ({
    key: "continue",
    icon: "next",
    label: "Continuer",
    variant: "primary",
    onClick,
  }),
  hit: (onClick: () => void): BtnSpec => ({
    key: "hit",
    icon: "check",
    label: "Trouvé",
    variant: "primary",
    onClick,
  }),
  miss: (onClick: () => void): BtnSpec => ({
    key: "miss",
    icon: "x",
    label: "Raté",
    variant: "danger-line",
    onClick,
  }),
  accept: (onClick: () => void): BtnSpec => ({
    key: "accept",
    icon: "check",
    label: "Accepter",
    variant: "primary",
    onClick,
  }),
};

/** The paused controls are identical across the timed screens. */
export function pausedButtons(resume: () => void, skip: () => void, stop: () => void): BtnSpec[] {
  return [btn.resume(resume), btn.next(skip), btn.stop(stop)];
}
