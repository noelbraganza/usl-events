import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { MapPin, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import BrandAnimals from '@/app/components/admin/BrandAnimals'

interface Props {
  params: { slug: string }
}

export default async function ConfirmedPage({ params }: Props) {
  const supabase = createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', params.slug)
    .eq('published', true)
    .single()

  if (!event) notFound()

  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)

  const gcalUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(event.title)}` +
    `&dates=${formatGcalDate(startDate)}/${formatGcalDate(endDate)}` +
    `&details=${encodeURIComponent(event.description ?? '')}` +
    `&location=${encodeURIComponent(event.location)}`

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-zinc-100 px-6 py-4 relative">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900" />
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

      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        {/* Checkmark */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 bg-zinc-900">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-zinc-900">
          You&apos;re confirmed!
        </h1>
        <p className="text-lg text-zinc-500 mb-12">
          Your spot at <strong className="text-zinc-800">{event.title}</strong> is reserved.
        </p>

        {/* Event summary card */}
        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-8 mb-8 text-left">
          <h2 className="text-base font-semibold text-zinc-900 mb-5">{event.title}</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-zinc-700">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-100">
                <Calendar className="w-4 h-4 text-zinc-500" />
              </span>
              <span>{format(startDate, 'EEEE, d MMMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-700">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-100">
                <Clock className="w-4 h-4 text-zinc-500" />
              </span>
              <span>
                {format(startDate, 'HH:mm')} – {format(endDate, 'HH:mm')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-zinc-700">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-zinc-100">
                <MapPin className="w-4 h-4 text-zinc-500" />
              </span>
              {event.location_url ? (
                <a
                  href={event.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-zinc-700"
                >
                  {event.location}
                </a>
              ) : (
                <span>{event.location}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white bg-zinc-900 hover:bg-zinc-700 transition-colors"
          >
            Add to Google Calendar
          </a>
          <Link
            href={`/events/${params.slug}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            View event page
          </Link>
        </div>

        <p className="text-sm text-zinc-400">
          Check your email — we&apos;ve sent a calendar invite with everything you need.
        </p>
      </div>
    </main>
  )
}

function formatGcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}
