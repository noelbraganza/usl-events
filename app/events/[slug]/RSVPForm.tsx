'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  eventId: string
  eventSlug: string
  isFull: boolean
}

export default function RSVPForm({ eventId, eventSlug, isFull }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/events/${eventSlug}&rsvp=true`

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          data: { full_name: name },
          shouldCreateUser: true,
        },
      })

      if (error) throw error
      setStatus('sent')
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Check your email</h3>
        <p className="text-zinc-500 text-sm">
          We sent a magic link to <strong>{email}</strong>. Click it to confirm your RSVP.
        </p>
        <p className="text-zinc-400 text-xs mt-3">Check your spam folder if you don&apos;t see it within a minute.</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8">
      <h2 className="text-xl font-bold text-zinc-900 mb-1">
        {isFull ? 'Join the waitlist' : 'Reserve your spot'}
      </h2>
      <p className="text-sm text-zinc-500 mb-6">
        {isFull
          ? "This event is full. Add your name below and we'll reach out if a spot opens."
          : 'Free. Just show up. RSVP so we know to expect you.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Your name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Noel Braganza"
            className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
          />
        </div>

        {status === 'error' && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-zinc-900 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {status === 'loading' ? 'Sending…' : isFull ? 'Join waitlist' : 'Get my free spot →'}
        </button>
      </form>

      <p className="text-xs text-zinc-400 mt-4 text-center">
        We&apos;ll email you a magic link to confirm. No password, no account.
      </p>
    </div>
  )
}
