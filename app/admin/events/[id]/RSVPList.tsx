'use client'

import { format } from 'date-fns'
import type { RSVP } from '@/lib/types'

interface Props {
  rsvps: RSVP[]
  eventTitle: string
}

export default function RSVPList({ rsvps, eventTitle }: Props) {
  function downloadCSV() {
    const headers = ['Name', 'Email', 'Status', 'Invite sent', 'Date']
    const rows = rsvps.map((r) => [
      r.name ?? '',
      r.email,
      r.status,
      r.invite_sent ? 'Yes' : 'No',
      format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rsvps-${eventTitle.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const confirmed = rsvps.filter((r) => r.status === 'confirmed')
  const waitlist = rsvps.filter((r) => r.status === 'waitlist')
  const cancelled = rsvps.filter((r) => r.status === 'cancelled')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-semibold text-zinc-900">RSVPs</h2>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span className="text-green-700 font-medium">{confirmed.length} confirmed</span>
            {waitlist.length > 0 && (
              <span className="text-amber-700 font-medium">· {waitlist.length} waitlist</span>
            )}
            {cancelled.length > 0 && (
              <span className="text-zinc-400">· {cancelled.length} cancelled</span>
            )}
          </div>
        </div>
        {rsvps.length > 0 && (
          <button
            onClick={downloadCSV}
            className="text-sm text-zinc-500 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            Export CSV
          </button>
        )}
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {rsvps.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Name</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Email</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3">Status</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3 hidden sm:table-cell">Invite</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-5 py-3 hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((rsvp) => (
                <tr key={rsvp.id} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-3 text-sm text-zinc-900">{rsvp.name ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-zinc-500">{rsvp.email}</td>
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
                  <td className="px-5 py-3 text-sm text-zinc-400 hidden sm:table-cell">
                    {rsvp.invite_sent ? '✓ sent' : '—'}
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
  )
}
