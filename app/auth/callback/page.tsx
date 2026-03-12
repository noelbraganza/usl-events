'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let handled = false

    const timeout = setTimeout(() => {
      if (!handled) setError(true)
    }, 10_000)

    async function handleSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await processSession()
        return
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session && !handled) {
            subscription.unsubscribe()
            await processSession()
          }
        }
      )
    }

    async function processSession() {
      handled = true
      clearTimeout(timeout)

      const next = searchParams.get('next') ?? '/'
      const isRsvp = searchParams.get('rsvp') === 'true'

      if (isRsvp) {
        try {
          const res = await fetch('/api/auth/rsvp-callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ next }),
          })
          const json = await res.json()
          router.replace(json.redirect ?? next)
        } catch {
          router.replace(next)
        }
      } else {
        router.replace(next)
      }
    }

    handleSession()

    return () => clearTimeout(timeout)
  }, [router, searchParams])

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 bg-white">
        <p className="text-zinc-700 text-lg font-medium">Something went wrong confirming your session.</p>
        <a href="/events" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          Back to events
        </a>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-zinc-500 text-lg animate-pulse">Confirming your spot…</p>
    </main>
  )
}
