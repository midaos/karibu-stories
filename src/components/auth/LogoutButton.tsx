'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Loader2 } from 'lucide-react'

interface LogoutButtonProps {
  variant?: 'icon' | 'text'
}

export function LogoutButton({ variant = 'icon' }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    // Hard redirect to clear all client state and force a fresh session read
    window.location.href = '/'
  }

  if (variant === 'text') {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--text-muted)] hover:text-karibu-red transition disabled:opacity-50"
      >
        {loading ? 'Signing out...' : 'Log out'}
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Log out"
      aria-label="Log out"
      className="p-2 rounded-full text-[var(--text-muted)] hover:text-karibu-red hover:bg-[var(--bg-muted)] transition disabled:opacity-50 flex items-center justify-center"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <LogOut size={18} />
      )}
    </button>
  )
}