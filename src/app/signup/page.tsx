'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // We pass the username in the metadata so our database trigger creates the profile
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          display_name: username,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is off, we get a session immediately
    if (data.session) {
      router.push('/')
      router.refresh()
    } else {
      // If email confirmation is on, tell them to check their email
      setError('Success! Please check your email to confirm your account.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-karibu-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-karibu-surface p-8 rounded-lg border border-neutral-800 shadow-xl">
        
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-serif font-bold text-white mb-2 block">
            Karibu Stories
          </Link>
          <p className="text-karibu-muted">Create an account to start reading and writing.</p>
        </div>

        {error && (
          <div className={`p-3 rounded mb-4 text-sm text-center ${error.includes('Success') ? 'bg-green-900/50 text-green-200 border border-green-800' : 'bg-karibu-red/10 border border-karibu-red text-karibu-red'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-karibu-dark border border-neutral-700 rounded-md p-3 text-white focus:outline-none focus:border-karibu-red"
              placeholder="e.g. amara_okoye"
              required
            />
          </div>

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
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-karibu-red hover:bg-red-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-karibu-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-karibu-red hover:underline font-medium">
            Log in
          </Link>
        </div>

      </div>
    </div>
  )
}