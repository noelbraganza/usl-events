'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { RSVP } from '@/lib/types'

interface Props {
  rsvps: RSVP[]
  eventTitle: string
  eventId: string
}

export default function RSVPList({ rsvps: initialRsvps, eventTitle, eventId }: Props) {
  const [rsvps, setRsvps] = useState<RSVP[]>(initialRsvps)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [formError, setFormError] = useState('')

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

  async function handleStatusChange(id: string, status: string) {
    setRsvps((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as RSVP['status'] } : r)))
    await fetch(`/api/admin/rsvp/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  async function handleDelete(id: string) {
    setRsvps((prev) => prev.filter((r) => r.id !== id))
    await fetch(`/api/admin/rsvp/${id}`, { method: 'DELETE' })
  }

  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid email address.')
      return
    }
    setAdding(true)
    const res = await fetch('/api/admin/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, name: name.trim() || null, email: email.trim() }),
    })
    if (res.ok) {
      const newRsvp = await res.json()
      setRsvps((prev) => [...prev, newRsvp])
      setName('')
      setEmail('')
    } else {
      const { error } = await res.json()
      setFormError(error ?? 'Failed to add guest.')
    }
    setAdding(false)
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
                <th className="text-right text-xs text-zinc-500 font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((rsvp) => (
                <tr key={rsvp.id} className="border-b border-zinc-50 last:border-0">
                  <td className="px-5 py-3 text-sm text-zinc-900">{rsvp.name ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-zinc-500">{rsvp.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={rsvp.status}
                      onChange={(e) => handleStatusChange(rsvp.id, e.target.value)}
                      className={`text-xs font-medium rounded px-2 py-0.5 border-0 cursor-pointer focus:ring-1 focus:ring-zinc-300 ${
                        rsvp.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : rsvp.status === 'waitlist'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      <option value="confirmed">confirmed</option>
                      <option value="waitlist">waitlist</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-400 hidden sm:table-cell">
                    {rsvp.invite_sent ? '✓ sent' : '—'}
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-400 hidden md:table-cell">
                    {format(new Date(rsvp.created_at), 'd MMM, HH:mm')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(rsvp.id)}
                      className="text-xs text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-10 text-center text-zinc-400 text-sm">No RSVPs yet.</div>
        )}
      </div>

      {/* Add guest form */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-zinc-700 mb-3">Add guest manually</h3>
        <form onSubmit={handleAddGuest} className="flex items-start gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 w-44"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 w-56"
          />
          <button
            type="submit"
            disabled={adding}
            className="text-sm bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add guest'}
          </button>
          {formError && <p className="w-full text-xs text-red-600 mt-1">{formError}</p>}
        </form>
      </div>
    </div>
  )
}
