import type { ReactNode } from "react";
import type { TranslationKey } from "@/presentation/i18n/translations";

export type NavTab = {
  to: string;
  key: TranslationKey;
  icon: ReactNode;
};

const iconClass = "size-[19px]";

export const NAV_TABS: NavTab[] = [
  {
    to: "/",
    key: "home",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <path d="M3 10.5L12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: "/search",
    key: "search",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/library",
    key: "library",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <rect x="3" y="4" width="6" height="16" rx="1.5" />
        <rect x="11" y="4" width="4" height="16" rx="1.5" />
        <path d="M17.5 5.2l3 15.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/friends",
    key: "friends",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.4 2.9-5.5 6.5-5.5s6.5 2.1 6.5 5.5" strokeLinecap="round" />
        <path d="M16.5 5.2a3.5 3.5 0 0 1 0 6.6" strokeLinecap="round" />
        <path d="M18 14.9c2.1.7 3.5 2.4 3.5 5.1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/profile",
    key: "profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" strokeLinecap="round" />
      </svg>
    ),
  },
];
