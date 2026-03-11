import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function AdminEventsPage() {
  const supabase = createClient()

  const { data: events } = await supabase
    .from('events')
    .select('id, title, slug, start_date, status, published, capacity')
    .order('start_date', { ascending: false })

  // Get RSVP counts for all events
  const rsvpCounts: Record<string, number> = {}
  if (events) {
    for (const event of events) {
      const { count } = await supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('status', 'confirmed')
      rsvpCounts[event.id] = count ?? 0
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Events</h1>
        <Link
          href="/admin/events/new"
          className="bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New event
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {events && events.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Event</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3 hidden sm:table-cell">Date</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">RSVPs</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {events.map((event: any) => (
                <tr
                  key={event.id}
                  className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-5 py-4 text-sm font-medium text-zinc-900">
                    <div>{event.title}</div>
                    <div className="text-xs text-zinc-400 font-normal mt-0.5">/events/{event.slug}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500 hidden sm:table-cell">
                    {format(new Date(event.start_date), 'd MMM yyyy')}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-700">
                    {rsvpCounts[event.id]}
                    {event.capacity ? (
                      <span className="text-zinc-400"> / {event.capacity}</span>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        event.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {event.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-16 text-center text-zinc-400 text-sm">
            No events yet.{' '}
            <Link href="/admin/events/new" className="text-zinc-900 underline">
              Create your first event
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
