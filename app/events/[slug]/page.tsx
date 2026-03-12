import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MapPin, Calendar, Clock, Users } from 'lucide-react'
import type { Speaker } from '@/lib/types'
import RSVPForm from './RSVPForm'
import EventPageClient from './EventPageClient'
import AttendeesList from './AttendeesList'
import BrandAnimals from '@/app/components/admin/BrandAnimals'

function formatEventDate(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso))
}

function formatEventTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso))
}

function getTimezoneAbbr(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, timeZoneName: 'short',
  }).formatToParts(new Date(iso)).find((p) => p.type === 'timeZoneName')?.value ?? tz
}

interface Props {
  params: { slug: string }
  searchParams: { rsvp?: string }
}

export default async function EventPage({ params, searchParams }: Props) {
  const supabase = createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single()

  if (!event) notFound()

  const { data: speakers } = await supabase
    .from('event_speakers')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order')

  const { count: rsvpCount } = await supabase
    .from('rsvps')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .eq('status', 'confirmed')

  const isFull = event.capacity ? (rsvpCount ?? 0) >= event.capacity : false
  const spotsLeft = event.capacity ? event.capacity - (rsvpCount ?? 0) : null

  return (
    <main className="min-h-screen bg-white">
      {/* RSVP status banners */}
      {searchParams.rsvp === 'waitlist' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 text-center">
          <p className="text-amber-800 font-medium">
            You&apos;re on the waitlist. We&apos;ll let you know if a spot opens up.
          </p>
        </div>
      )}

      {/* Header with brand accent line */}
      <header className="border-b border-zinc-100 px-6 py-4 relative">
        <div className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(to right, #905AC0, #D03B6E, #6DDEF7)' }} />
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BrandAnimals />
          <a
            href="https://upstrategylab.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            upstrategylab.com
          </a>
        </div>
      </header>

      {/* Hero section */}
      <section
        className="relative overflow-hidden"
        style={{ background: '#0f0f13', minHeight: '420px' }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Ambient colour glows */}
        <div
          className="absolute top-[-80px] left-[-80px] w-[420px] h-[420px] opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #905AC0 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[-60px] right-[-60px] w-[360px] h-[360px] opacity-25 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #D03B6E 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-[30%] right-[25%] w-[260px] h-[260px] opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #6DDEF7 0%, transparent 70%)',
          }}
        />

        {/* Cover image / placeholder — centred in hero */}
        <div className="relative z-10 flex flex-col items-center justify-center py-16 px-6">
          <EventPageClient
            coverImage={event.cover_image ?? null}
            title={event.title}
          />
        </div>
      </section>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-14">
          {/* Left: event info */}
          <div>
            {/* Title block */}
            <div className="mb-8">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: '#905AC0' }}>
                {event.status === 'upcoming' ? 'Upcoming Event' : event.status}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 leading-tight mb-4">
                {event.title}
              </h1>
              {event.tagline && (
                <p className="text-xl text-zinc-500 leading-relaxed">{event.tagline}</p>
              )}
            </div>

            {/* Detail badges */}
            <div className="flex flex-col gap-3 mb-10">
              <div className="flex items-center gap-3 text-zinc-700">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(144,90,192,0.1)' }}>
                  <Calendar className="w-4 h-4" style={{ color: '#905AC0' }} />
                </span>
                <span>{formatEventDate(event.start_date, event.timezone ?? 'Europe/Stockholm')}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-700">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(109,222,247,0.1)' }}>
                  <Clock className="w-4 h-4" style={{ color: '#6DDEF7' }} />
                </span>
                <span>
                  {formatEventTime(event.start_date, event.timezone ?? 'Europe/Stockholm')} – {formatEventTime(event.end_date, event.timezone ?? 'Europe/Stockholm')} {getTimezoneAbbr(event.start_date, event.timezone ?? 'Europe/Stockholm')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-zinc-700">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(208,59,110,0.1)' }}>
                  <MapPin className="w-4 h-4" style={{ color: '#D03B6E' }} />
                </span>
                {event.location_url ? (
                  <a
                    href={event.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: '#D03B6E' }}
                  >
                    {event.location}
                  </a>
                ) : (
                  <span>{event.location}</span>
                )}
              </div>
              {event.capacity && (
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(232,184,64,0.1)' }}>
                    <Users className="w-4 h-4" style={{ color: '#E8B840' }} />
                  </span>
                  <span
                    className="text-sm font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: isFull ? 'rgba(208,59,110,0.1)' : 'rgba(232,184,64,0.12)',
                      color: isFull ? '#D03B6E' : '#c49a20',
                    }}
                  >
                    {isFull
                      ? 'Full — join the waitlist below'
                      : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-12">
                <h2 className="text-base font-semibold text-zinc-900 mb-4">About this event</h2>
                <div className="space-y-4">
                  {event.description.split('\n\n').map((para: string, i: number) => (
                    <p key={i} className="text-zinc-600 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Speakers */}
            {speakers && speakers.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-zinc-900 mb-6">
                  {speakers.length > 1 ? 'Speakers' : 'Speaker'}
                </h2>
                <div className="space-y-8">
                  {speakers.map((speaker: Speaker) => (
                    <div key={speaker.id} className="flex gap-5">
                      <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #905AC0, #D03B6E)' }}>
                        {speaker.avatar_url ? (
                          <img
                            src={speaker.avatar_url}
                            alt={speaker.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-white">
                            {speaker.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-zinc-900">{speaker.name}</p>
                        {speaker.title && (
                          <p className="text-sm mb-3" style={{ color: '#905AC0' }}>{speaker.title}</p>
                        )}
                        {speaker.bio && (
                          <div className="space-y-2">
                            {speaker.bio.split('\n\n').map((para: string, i: number) => (
                              <p key={i} className="text-sm text-zinc-600 leading-relaxed">
                                {para}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: RSVP form (sticky) + attendees */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <RSVPForm
              eventId={event.id}
              eventSlug={event.slug}
              isFull={isFull}
            />
            <AttendeesList eventId={event.id} />
          </div>
        </div>
      </div>
    </main>
  )
}
