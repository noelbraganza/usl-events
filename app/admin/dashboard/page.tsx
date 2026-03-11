import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = createClient()

  const [{ data: events }, { data: recentRsvps }, { count: confirmedCount }, { count: waitlistCount }] =
    await Promise.all([
      supabase
        .from('events')
        .select('id, title, slug, start_date, status, published')
        .order('start_date', { ascending: true }),
      supabase
        .from('rsvps')
        .select('id, name, email, status, created_at, events(title)')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed'),
      supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waitlist'),
    ])

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <Link
          href="/admin/events/new"
          className="bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Confirmed RSVPs</p>
          <p className="text-3xl font-bold text-zinc-900">{confirmedCount ?? 0}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Waitlist</p>
          <p className="text-3xl font-bold text-zinc-900">{waitlistCount ?? 0}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Events</p>
          <p className="text-3xl font-bold text-zinc-900">{events?.length ?? 0}</p>
        </div>
      </div>

      {/* Events */}
      <div className="mb-10">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Events</h2>
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {events && events.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Event</th>
                  <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Date</th>
                  <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {events.map((event: any) => (
                  <tr key={event.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-zinc-900 text-sm">{event.title}</td>
                    <td className="px-5 py-4 text-sm text-zinc-500">
                      {format(new Date(event.start_date), 'd MMM yyyy')}
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
            <div className="px-5 py-10 text-center text-zinc-400 text-sm">
              No events yet.{' '}
              <Link href="/admin/events/new" className="text-zinc-900 underline">
                Create one
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent RSVPs */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Recent RSVPs
        </h2>
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {recentRsvps && recentRsvps.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Name</th>
                  <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Email</th>
                  <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3 hidden sm:table-cell">Event</th>
                  <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Status</th>
                  <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRsvps.map((rsvp: any) => (
                  <tr key={rsvp.id} className="border-b border-zinc-50 last:border-0">
                    <td className="px-5 py-3 text-sm text-zinc-900">{rsvp.name ?? '—'}</td>
                    <td className="px-5 py-3 text-sm text-zinc-500">{rsvp.email}</td>
                    <td className="px-5 py-3 text-sm text-zinc-500 hidden sm:table-cell">
                      {(rsvp.events as any)?.title ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          rsvp.status === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : rsvp.status === 'waitlist'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {rsvp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-zinc-400 hidden md:table-cell">
                      {format(new Date(rsvp.created_at), 'd MMM, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-10 text-center text-zinc-400 text-sm">No RSVPs yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
