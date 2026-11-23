"use client";
import type { ReactElement } from "react";
import { Tooltip as HeroTooltip } from "@heroui/react";

type Props = {
  /** Short visual hint. The trigger's aria-label stays the accessible name. */
  label: string;
  children: ReactElement;
  placement?: "top" | "bottom" | "left" | "right";
};

/**
 * Supplementary tooltip for icon-only controls. Never carries form errors or
 * feedback — those go through the FormO toast API.
 */
export default function Tooltip({ label, children, placement = "top" }: Props) {
  return (
    <HeroTooltip delay={350} closeDelay={100}>
      <HeroTooltip.Trigger>{children}</HeroTooltip.Trigger>
      <HeroTooltip.Content
        placement={placement}
        className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
      >
        <p>{label}</p>
      </HeroTooltip.Content>
    </HeroTooltip>
  );
}
