'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/lib/types'

interface Props {
  event?: Event
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// UTC ISO → wall clock string for datetime-local input
function isoToWallClock(iso: string, tz: string): string {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
  const hour = p.hour === '24' ? '00' : p.hour
  return `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}`
}

// Wall clock string in tz → UTC ISO (for saving)
function wallClockToISO(local: string, tz: string): string {
  const asUTC = new Date(local + ':00.000Z')
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(asUTC)
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
  const hour = p.hour === '24' ? '00' : p.hour
  const displayedMs = new Date(`${p.year}-${p.month}-${p.day}T${hour}:${p.minute}:00.000Z`).getTime()
  const diff = asUTC.getTime() - displayedMs
  return new Date(asUTC.getTime() + diff).toISOString()
}

const TIMEZONES = [
  'Europe/Stockholm',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
]

export default function EventForm({ event }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!event

  const [title, setTitle] = useState(event?.title ?? '')
  const [slug, setSlug] = useState(event?.slug ?? '')
  const [tagline, setTagline] = useState(event?.tagline ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [timezone, setTimezone] = useState(event?.timezone ?? 'Europe/Stockholm')
  const [startDate, setStartDate] = useState(
    event ? isoToWallClock(event.start_date, event.timezone ?? 'Europe/Stockholm') : ''
  )
  const [endDate, setEndDate] = useState(
    event ? isoToWallClock(event.end_date, event.timezone ?? 'Europe/Stockholm') : ''
  )
  const [location, setLocation] = useState(event?.location ?? '')
  const [locationUrl, setLocationUrl] = useState(event?.location_url ?? '')
  const [capacity, setCapacity] = useState(event?.capacity ? String(event.capacity) : '')
  const [coverImage, setCoverImage] = useState(event?.cover_image ?? '')
  const [status, setStatus] = useState<Event['status']>(event?.status ?? 'upcoming')
  const [published, setPublished] = useState(event?.published ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!isEdit) setSlug(slugify(val))
  }

  function handleTimezoneChange(newTz: string) {
    if (startDate) setStartDate(isoToWallClock(wallClockToISO(startDate, timezone), newTz))
    if (endDate) setEndDate(isoToWallClock(wallClockToISO(endDate, timezone), newTz))
    setTimezone(newTz)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      title,
      slug,
      tagline: tagline || null,
      description: description || null,
      start_date: wallClockToISO(startDate, timezone),
      end_date: wallClockToISO(endDate, timezone),
      timezone,
      location,
      location_url: locationUrl || null,
      cover_image: coverImage || null,
      capacity: capacity ? parseInt(capacity) : null,
      status,
      published,
      updated_at: new Date().toISOString(),
    }

    let saveError

    if (isEdit) {
      const { error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', event.id)
      saveError = error
    } else {
      const { error } = await supabase.from('events').insert(payload)
      saveError = error
    }

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    router.push('/admin/events')
    router.refresh()
  }

  async function handleDelete() {
    if (!event || !confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    await supabase.from('events').delete().eq('id', event.id)
    router.push('/admin/events')
    router.refresh()
  }

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition text-sm'
  const labelClass = 'block text-sm font-medium text-zinc-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <label className={labelClass}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          placeholder="AI for Non-Dummies"
          className={inputClass}
        />
      </div>

      {/* Slug */}
      <div>
        <label className={labelClass}>Slug</label>
        <div className="flex items-center">
          <span className="px-3 py-2.5 text-sm text-zinc-400 bg-zinc-50 border border-r-0 border-zinc-300 rounded-l-lg">
            /events/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            placeholder="ai-for-non-dummies"
            className="flex-1 px-3 py-2.5 rounded-l-none rounded-r-lg border border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition text-sm"
          />
        </div>
      </div>

      {/* Tagline */}
      <div>
        <label className={labelClass}>Tagline <span className="text-zinc-400 font-normal">(optional)</span></label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="A short description shown in listings"
          className={inputClass}
        />
      </div>

      {/* Cover image */}
      <div>
        <label className={labelClass}>Cover image URL <span className="text-zinc-400 font-normal">(optional)</span></label>
        <input
          type="url"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className={inputClass}
        />
        <p className="text-xs text-zinc-400 mt-1.5">
          Paste a direct image URL. Recommended: square, at least 800×800px.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description <span className="text-zinc-400 font-normal">(optional)</span></label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          placeholder="Full event description. Separate paragraphs with a blank line."
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start date & time</label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>End date & time</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label className={labelClass}>Timezone</label>
        <select
          value={timezone}
          onChange={(e) => handleTimezoneChange(e.target.value)}
          className={inputClass}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
        <p className="text-xs text-zinc-400 mt-1.5">
          All times are stored and displayed in this timezone.
        </p>
      </div>

      {/* Location */}
      <div>
        <label className={labelClass}>Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          placeholder="Nordhemsgatan 56, Göteborg"
          className={inputClass}
        />
      </div>

      {/* Location URL */}
      <div>
        <label className={labelClass}>Location URL <span className="text-zinc-400 font-normal">(optional — Google Maps link)</span></label>
        <input
          type="url"
          value={locationUrl}
          onChange={(e) => setLocationUrl(e.target.value)}
          placeholder="https://maps.google.com/?q=..."
          className={inputClass}
        />
      </div>

      {/* Capacity */}
      <div>
        <label className={labelClass}>Capacity <span className="text-zinc-400 font-normal">(optional — leave blank for unlimited)</span></label>
        <input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          min={1}
          placeholder="50"
          className={inputClass}
        />
      </div>

      {/* Status + Published */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Event['status'])}
            className={inputClass}
          >
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="past">Past</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex flex-col justify-end pb-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            <span className="text-sm font-medium text-zinc-700">Published</span>
          </label>
          <p className="text-xs text-zinc-400 mt-1 ml-7">Visible on the public site</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create event'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors px-3 py-2.5"
        >
          Cancel
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Delete event
          </button>
        )}
      </div>
    </form>
  )
}
