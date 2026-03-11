import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EventForm from '../EventForm'
import RSVPList from './RSVPList'

interface Props {
  params: { id: string }
}

export default async function EditEventPage({ params }: Props) {
  const supabase = createClient()

  const [{ data: event }, { data: rsvps }] = await Promise.all([
    supabase.from('events').select('*').eq('id', params.id).single(),
    supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  if (!event) notFound()

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <Link href="/admin/events" className="hover:text-zinc-700 transition-colors">
          Events
        </Link>
        <span>/</span>
        <span className="text-zinc-700">{event.title}</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Edit event</h1>
        <a
          href={`/events/${event.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          View public page ↗
        </a>
      </div>

      <EventForm event={event} />

      <div className="mt-16 pt-10 border-t border-zinc-200">
        <RSVPList rsvps={rsvps ?? []} eventTitle={event.title} />
      </div>
    </div>
  )
}
