"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";

type AppSidebarProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { label: "Dashboard", href: "/#dashboard" },
  { label: "Sales Tracker", href: "/#sales-tracker" },
  { label: "Leakage", href: "/leakage" },
  { label: "Stores", href: "/stores" },
  { label: "Ingredients Inventory", href: "/ingredients" },
  { label: "Upgrades", href: "/upgrades" },
  { label: "Goals", href: "/goals" },
  { label: "Orders", href: "/orders" },
];

const getWindowHash = () =>
  typeof window === "undefined" ? "" : window.location.hash;

const isNavItemActive = (
  href: string,
  pathname: string,
  hash: string
) => {
  if (href === "/#dashboard") {
    return pathname === "/" && hash === "#dashboard";
  }

  if (href === "/#sales-tracker") {
    return pathname === "/" && hash !== "#dashboard";
  }

  return pathname === href;
};

export function AppSidebar({ children }: AppSidebarProps) {
  const pathname = usePathname();
  const sidebarId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => {
      setHash(getWindowHash());
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setHash(getWindowHash());
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.body.classList.add("body-nav-open");
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.classList.remove("body-nav-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="mobile-nav-bar card">
        <Link
          href="/#sales-tracker"
          className="mobile-nav-brand"
          onClick={closeSidebar}
        >
          <div className="logo-mark">SB</div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
              Suite Bread
            </p>
            <h2 className="font-display text-base">Operations</h2>
          </div>
        </Link>

        <button
          type="button"
          className="mobile-nav-toggle"
          aria-controls={sidebarId}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setIsOpen(open => !open)}
        >
          <span className="mobile-nav-toggle-label">
            {isOpen ? "Close" : "Menu"}
          </span>
          <span className="mobile-nav-toggle-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <button
        type="button"
        className={`sidebar-overlay ${
          isOpen ? "sidebar-overlay-open" : ""
        }`}
        aria-label="Close navigation"
        onClick={closeSidebar}
        tabIndex={isOpen ? 0 : -1}
      />

      <aside
        id={sidebarId}
        className={`sidebar card ${isOpen ? "sidebar-open" : ""}`}
        aria-label="Primary navigation"
      >
        <div className="sidebar-drawer-head">
          <div className="sidebar-brand">
            <div className="logo-mark">SB</div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
                Suite Bread
              </p>
              <h2 className="font-display text-lg">Operations</h2>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close icon-button"
            aria-label="Close navigation"
            onClick={closeSidebar}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <nav className="nav-stack">
          {NAV_ITEMS.map(item => {
            const isActive = isNavItemActive(
              item.href,
              pathname,
              hash
            );

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-item ${
                  isActive ? "nav-item-active" : ""
                }`}
                onClick={closeSidebar}
              >
                <span>{item.label}</span>
                <span
                  className={`nav-dot ${
                    isActive ? "nav-dot-active" : ""
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {children}
      </aside>
    </>
  );
}
