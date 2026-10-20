'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Get the 'next' destination from the URL, default to '/'
  const nextDestination = searchParams.get('next') || '/'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // Redirect to where they were trying to go
    router.push(nextDestination)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-karibu-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-karibu-surface p-8 rounded-lg border border-neutral-800 shadow-xl">
        
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-serif font-bold text-white mb-2 block">
            Karibu Stories
          </Link>
          <p className="text-karibu-muted">Welcome back to your reading universe.</p>
        </div>

        {error && (
          <div className="bg-karibu-red/10 border border-karibu-red text-karibu-red p-3 rounded mb-4 text-sm text-center">
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
              className="w-full bg-karibu-dark border border-neutral-700 rounded-md p-3 text-white focus:outline-none focus:border-karibu-red"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-karibu-dark border border-neutral-700 rounded-md p-3 text-white focus:outline-none focus:border-karibu-red"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-karibu-red hover:bg-red-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-karibu-muted">
          Don't have an account?{' '}
          <Link href="/signup" className="text-karibu-red hover:underline font-medium">
            Sign up
          </Link>
        </div>

      </div>
    </div>
  )
}
// Wrap in Suspense because useSearchParams() requires it in Next.js
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-karibu-dark flex items-center justify-center text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}