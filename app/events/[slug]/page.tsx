import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { MapPin, Calendar, Clock, Users } from 'lucide-react'
import type { Speaker } from '@/lib/types'
import RSVPForm from './RSVPForm'

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
      {searchParams.rsvp === 'confirmed' && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-4 text-center">
          <p className="text-green-800 font-medium">
            You&apos;re in! Check your email — we&apos;ve sent a calendar invite.
          </p>
        </div>
      )}
      {searchParams.rsvp === 'waitlist' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 text-center">
          <p className="text-amber-800 font-medium">
            You&apos;re on the waitlist. We&apos;ll let you know if a spot opens up.
          </p>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-500">Up Strategy Lab</span>
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

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-16">
          {/* Left: event info */}
          <div>
            <div className="mb-8">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
                {event.status === 'upcoming' ? 'Upcoming Event' : event.status}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 leading-tight mb-4">
                {event.title}
              </h1>
              {event.tagline && (
                <p className="text-xl text-zinc-500 leading-relaxed">{event.tagline}</p>
              )}
            </div>

            {/* Event details */}
            <div className="flex flex-col gap-3 mb-10 pl-1">
              <div className="flex items-center gap-3 text-zinc-700">
                <Calendar className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                <span>{format(new Date(event.start_date), 'EEEE, d MMMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-700">
                <Clock className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                <span>
                  {format(new Date(event.start_date), 'HH:mm')} – {format(new Date(event.end_date), 'HH:mm')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-zinc-700">
                <MapPin className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                {event.location_url ? (
                  <a
                    href={event.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {event.location}
                  </a>
                ) : (
                  <span>{event.location}</span>
                )}
              </div>
              {event.capacity && (
                <div className="flex items-center gap-3 text-zinc-700">
                  <Users className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  <span>
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
                      <div className="w-14 h-14 rounded-full bg-zinc-100 flex-shrink-0 overflow-hidden">
                        {speaker.avatar_url ? (
                          <img
                            src={speaker.avatar_url}
                            alt={speaker.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-zinc-400">
                            {speaker.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-zinc-900">{speaker.name}</p>
                        {speaker.title && (
                          <p className="text-sm text-zinc-500 mb-3">{speaker.title}</p>
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

          {/* Right: RSVP form */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <RSVPForm
              eventId={event.id}
              eventSlug={event.slug}
              isFull={isFull}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
