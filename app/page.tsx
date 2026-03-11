import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { MapPin, Calendar } from 'lucide-react'
import type { Event } from '@/lib/types'

export default async function HomePage() {
  const supabase = createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('published', true)
    .order('start_date', { ascending: true })

  if (!events || events.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-400">No upcoming events.</p>
      </main>
    )
  }

  if (events.length === 1) {
    redirect(`/events/${events[0].slug}`)
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-sm text-zinc-400 mb-2">Up Strategy Lab</p>
        <h1 className="text-3xl font-bold text-zinc-900 mb-12">Events</h1>
        <div className="space-y-4">
          {events.map((event: Event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="block p-6 border border-zinc-200 rounded-xl hover:border-zinc-400 transition-colors"
            >
              <h2 className="text-xl font-semibold text-zinc-900 mb-1">{event.title}</h2>
              {event.tagline && (
                <p className="text-zinc-500 text-sm mb-4">{event.tagline}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(event.start_date), 'EEE d MMM yyyy')}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
