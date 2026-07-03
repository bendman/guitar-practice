import type { TFunction } from "i18next";
import type { BtnSpec } from "./ControlBar";

/**
 * Shared control-bar button specs. Each session screen composes its per-phase
 * button sets from these so labels, icons and variants stay consistent and are
 * edited in one place. Labels come from the active locale, so screens build
 * the set via `makeSessionButtons(t)` (memoized on `t`).
 */
export interface SessionButtons {
  pause: (onClick: () => void) => BtnSpec;
  resume: (onClick: () => void) => BtnSpec;
  next: (onClick: () => void) => BtnSpec;
  stop: (onClick: () => void) => BtnSpec;
  see: (onClick: () => void) => BtnSpec;
  continue: (onClick: () => void) => BtnSpec;
  hit: (onClick: () => void) => BtnSpec;
  miss: (onClick: () => void) => BtnSpec;
  accept: (onClick: () => void) => BtnSpec;
}

export function makeSessionButtons(t: TFunction): SessionButtons {
  return {
    pause: (onClick) => ({
      key: "pause",
      icon: "pause",
      label: t("session.buttons.pause"),
      variant: "accent-line",
      onClick,
    }),
    resume: (onClick) => ({
      key: "resume",
      icon: "play",
      label: t("session.buttons.resume"),
      variant: "primary",
      onClick,
    }),
    next: (onClick) => ({
      key: "next",
      icon: "next",
      label: t("session.buttons.next"),
      variant: "secondary",
      onClick,
    }),
    stop: (onClick) => ({
      key: "stop",
      icon: "stop",
      label: t("session.buttons.stop"),
      variant: "danger",
      onClick,
    }),
    see: (onClick) => ({
      key: "see",
      icon: "eye",
      label: t("session.buttons.see"),
      variant: "primary",
      onClick,
    }),
    continue: (onClick) => ({
      key: "continue",
      icon: "next",
      label: t("session.buttons.continue"),
      variant: "primary",
      onClick,
    }),
    hit: (onClick) => ({
      key: "hit",
      icon: "check",
      label: t("session.buttons.hit"),
      variant: "primary",
      onClick,
    }),
    miss: (onClick) => ({
      key: "miss",
      icon: "x",
      label: t("session.buttons.miss"),
      variant: "danger-line",
      onClick,
    }),
    accept: (onClick) => ({
      key: "accept",
      icon: "check",
      label: t("session.buttons.accept"),
      variant: "primary",
      onClick,
    }),
  };
}

/** The paused controls are identical across the timed screens. */
export function pausedButtons(
  btn: SessionButtons,
  resume: () => void,
  skip: () => void,
  stop: () => void,
): BtnSpec[] {
  return [btn.resume(resume), btn.next(skip), btn.stop(stop)];
}
