"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { NavItem } from "@/lib/nav";
import { NavIcon } from "./NavIcon";
import { logout } from "@/lib/auth/actions";

interface Props {
  items: NavItem[];
  user: { name: string; roleLabel: string };
  children: ReactNode;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-soft to-accent text-sm font-bold shadow-[0_0_24px_rgba(142,17,191,0.5)]">
        <span className="num">NL</span>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="num text-sm font-semibold">Next Level</div>
          <div className="text-[11px] text-muted">D2D · Fundusz Remontowy</div>
        </div>
      )}
    </div>
  );
}

export function AppShell({ items, user, children }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const barItems = items.filter((i) => i.mobileBar);
  const menuItems = items.filter((i) => !i.mobileBar);

  return (
    <div className="flex min-h-dvh">
      {/* iPad / komputer: pasek boczny */}
      <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-bg/80 px-3 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))] backdrop-blur-xl md:flex md:w-20 lg:w-64">
        <div className="px-2 lg:px-3">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="hidden lg:block">
            <Logo />
          </div>
        </div>
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                data-fly-target={item.key === "skarbiec" ? "skarbiec" : undefined}
                className={`relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors md:justify-center lg:justify-start ${active ? "text-white" : "text-muted hover:text-white"}`}
                title={item.label}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl border border-line bg-card"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <NavIcon panel={item.key} size={20} className={`relative ${active ? "text-accent-soft" : ""}`} />
                <span className="relative hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 flex items-center gap-3 rounded-2xl px-2 py-2 lg:px-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card-2 text-sm font-semibold">{user.name.charAt(0)}</div>
          <div className="hidden min-w-0 flex-1 leading-tight lg:block">
            <div className="truncate text-sm">{user.name}</div>
            <div className="text-xs text-muted">{user.roleLabel}</div>
          </div>
          <form action={logout} className="hidden lg:block">
            <button className="rounded-full p-2 text-muted hover:text-white" aria-label="Wyloguj">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        {/* Telefon: górny pasek z menu */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/80 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl md:hidden">
          <Logo />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            data-fly-target="skarbiec"
            className="rounded-full p-2 text-muted hover:text-white"
            aria-label="Menu"
          >
            <Menu size={22} />
          </button>
        </header>

        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 md:px-10 md:pb-12 md:pt-10">{children}</main>

        {/* Telefon: dolny pasek 5 ikon */}
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/85 backdrop-blur-xl md:hidden">
          <div className="grid grid-cols-5">
            {barItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.key} href={item.href} className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] ${active ? "text-white" : "text-muted"}`}>
                  {active && <motion.span layoutId="bar-active" className="absolute top-0 h-0.5 w-8 rounded-full bg-accent-soft" />}
                  <NavIcon panel={item.key} size={22} className={active ? "text-accent-soft" : ""} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Telefon: menu z pozostałymi panelami */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div className="fixed inset-0 z-40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <motion.div
              className="pb-safe absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-line bg-card px-5 pt-5"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted">{user.roleLabel}</div>
                </div>
                <button onClick={() => setMenuOpen(false)} className="rounded-full p-2 text-muted" aria-label="Zamknij">
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {menuItems.map((item) => (
                  <Link key={item.key} href={item.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-2xl border border-line bg-card-2 p-4">
                    <NavIcon panel={item.key} size={20} className="text-accent-soft" />
                    <div className="leading-tight">
                      <div className="text-sm">{item.label}</div>
                      <div className="text-[11px] text-muted">{item.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
              <form action={logout} className="mb-4 mt-4">
                <button className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm text-muted">
                  <LogOut size={16} /> Wyloguj
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
