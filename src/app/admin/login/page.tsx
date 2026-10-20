'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock, Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Sign in
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 2. Instead of checking roles here, just route to the dashboard.
    // The dashboard is server-side and will instantly kick them out if they aren't an admin.
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-karibu-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-karibu-surface p-8 rounded-lg border border-karibu-red/30 shadow-[0_0_50px_-12px_rgba(204,0,0,0.3)]">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-karibu-red/10 mb-4">
            <Lock className="text-karibu-red" size={24} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mb-1">Admin Portal</h1>
          <p className="text-sm text-karibu-muted">Restricted access. Authorized personnel only.</p>
        </div>

        {error && (
          <div className="bg-karibu-red/10 border border-karibu-red text-karibu-red p-3 rounded mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-karibu-dark border border-neutral-700 rounded-md p-3 text-white focus:outline-none focus:border-karibu-red transition"
              placeholder="admin@karibustories.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-karibu-dark border border-neutral-700 rounded-md p-3 text-white focus:outline-none focus:border-karibu-red transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-karibu-red hover:bg-red-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 mt-6"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? 'Authenticating...' : 'Log In as Admin'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-karibu-muted">
          <Link href="/" className="hover:text-white transition">
            ← Return to Public Site
          </Link>
        </div>

      </div>
    </div>
  )
}