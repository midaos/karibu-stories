'use client'

import Link from 'next/link'
import { Search, PenLine, Library } from 'lucide-react'
import { NotificationBell } from '@/components/reader/NotificationBell'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LogoutButton } from '@/components/auth/LogoutButton'

interface GlobalHeaderProps {
  user: {
    id: string
    avatar_path: string | null
    display_name: string | null
  } | null
}

export function GlobalHeader({ user }: GlobalHeaderProps) {
  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex sticky top-0 z-50 w-full border-b border-[var(--border-main)] bg-[var(--bg-app)]/90 backdrop-blur-md px-6 py-4 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="font-serif text-2xl font-bold text-[var(--text-main)] tracking-tight"
          >
            Karibu.
          </Link>

          <nav className="flex items-center gap-6 text-[11px] uppercase tracking-[0.25em] font-semibold text-[var(--text-muted)]">
            <Link href="/search" className="hover:text-karibu-red transition">
              Read
            </Link>
            <Link href="/write" className="hover:text-karibu-red transition">
              Write
            </Link>
            <Link href="/library" className="hover:text-karibu-red transition">
              Library
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <form action="/search" method="GET" className="relative w-56">
            <Search
              className="absolute left-0 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              size={14}
            />
            <input
              type="text"
              name="q"
              placeholder="Search"
              className="w-full bg-transparent border-b border-[var(--border-main)] focus:border-karibu-red py-1 pl-6 pr-2 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)]"
            />
          </form>

          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                href="/settings"
                className="w-8 h-8 rounded-full bg-[var(--bg-muted)] overflow-hidden flex items-center justify-center border border-[var(--border-main)]"
              >
                {user.avatar_path ? (
                  <img
                    src={user.avatar_path}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-[var(--text-main)]">
                    {user.display_name?.charAt(0) || 'U'}
                  </span>
                )}
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] font-semibold">
              <Link
                href="/login"
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-karibu-red border-b border-karibu-red pb-0.5 hover:text-[var(--text-main)] hover:border-[var(--text-main)] transition"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-[var(--border-main)] bg-[var(--bg-app)]/95 backdrop-blur-md px-4 py-3 flex justify-between items-center">
        <Link
          href="/"
          className="font-serif text-xl font-bold text-[var(--text-main)]"
        >
          Karibu.
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/search">
            <Search size={18} className="text-[var(--text-muted)]" />
          </Link>
          <ThemeToggle />
          {user && (
            <>
              <NotificationBell />
              <LogoutButton />
            </>
          )}
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-app)]/95 backdrop-blur-md border-t border-[var(--border-main)]">
        <div className="flex justify-around items-center h-14">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:text-karibu-red transition"
          >
            <Library size={18} /> Home
          </Link>
          <Link
            href="/search"
            className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:text-karibu-red transition"
          >
            <Search size={18} /> Read
          </Link>
          <Link
            href="/write"
            className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:text-karibu-red transition"
          >
            <PenLine size={18} /> Write
          </Link>
          {user ? (
            <Link
              href="/settings"
              className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:text-karibu-red transition"
            >
              <div className="w-5 h-5 rounded-full bg-[var(--bg-muted)] overflow-hidden flex items-center justify-center">
                {user.avatar_path ? (
                  <img
                    src={user.avatar_path}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[9px] font-bold text-[var(--text-main)]">
                    {user.display_name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              You
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:text-karibu-red transition"
            >
              <div className="w-5 h-5 rounded-full bg-[var(--bg-muted)]" /> Log in
            </Link>
          )}
        </div>
      </nav>
    </>
  )
}