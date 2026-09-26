import type { ReactNode } from "react";

export type IconName =
  | "overview"
  | "watchlist"
  | "portfolio"
  | "assistant"
  | "search"
  | "bell"
  | "arrow-up-right"
  | "arrow-down-right"
  | "arrow-right"
  | "arrow-left"
  | "chevron-right"
  | "send"
  | "sparkles"
  | "activity"
  | "shield"
  | "clock"
  | "close"
  | "plus"
  | "more";

const iconPaths: Record<IconName, ReactNode> = {
  overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  watchlist: <><path d="M12 20.2s-7.5-4.4-7.5-10.1A4.1 4.1 0 0 1 12 7.5a4.1 4.1 0 0 1 7.5 2.6c0 5.7-7.5 10.1-7.5 10.1Z" /><path d="M8.5 11.7h7" /></>,
  portfolio: <><path d="M4 7.5h16a1.5 1.5 0 0 1 1.5 1.5v9A2.5 2.5 0 0 1 19 20.5H5A2.5 2.5 0 0 1 2.5 18V6A2.5 2.5 0 0 1 5 3.5h11" /><path d="M2.5 9h19M16.5 14.5h2" /></>,
  assistant: <><path d="M12 3.2 13.6 9l5.8 1.6-5.8 1.6-1.6 5.8-1.6-5.8-5.8-1.6L10.4 9 12 3.2Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.6" /><path d="m16 16 4.5 4.5" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></>,
  "arrow-up-right": <><path d="M7 17 17 7M8 7h9v9" /></>,
  "arrow-down-right": <><path d="M7 7 17 17M8 17h9V8" /></>,
  "arrow-right": <><path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5" /></>,
  "arrow-left": <><path d="M19.5 12h-15M11 5.5 4.5 12l6.5 6.5" /></>,
  "chevron-right": <path d="m9 5 7 7-7 7" />,
  send: <><path d="m21 3-7.2 18-3.7-7.1L3 10.2 21 3Z" /><path d="M10.1 13.9 21 3" /></>,
  sparkles: <><path d="m12 3 1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
  activity: <><path d="M3 12h4l3-7 4 14 3-7h4" /></>,
  shield: <><path d="M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
};

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.7,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}
