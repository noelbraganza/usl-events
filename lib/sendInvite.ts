import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { createEvent } from 'ics'
import { format } from 'date-fns'

interface SendInviteOptions {
  userId: string
  eventId: string
  origin: string
}

export async function sendInviteEmail({ userId, eventId, origin }: SendInviteOptions) {
  if (!process.env.RESEND_API_KEY) return

  const supabase = createClient()

  const { data: rsvp } = await supabase
    .from('rsvps')
    .select('*')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .eq('status', 'confirmed')
    .single()

  if (!rsvp || rsvp.invite_sent) return

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin

  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)

  const { value: icsContent } = createEvent({
    title: event.title,
    description: event.description ?? '',
    location: event.location,
    start: [
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      startDate.getDate(),
      startDate.getHours(),
      startDate.getMinutes(),
    ],
    end: [
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      endDate.getDate(),
      endDate.getHours(),
      endDate.getMinutes(),
    ],
    url: `${baseUrl}/events/${event.slug}`,
    organizer: { name: 'Up Strategy Lab', email: 'events@upstrategylab.com' },
  })

  const gcalUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(event.title)}` +
    `&dates=${formatGcalDate(startDate)}/${formatGcalDate(endDate)}` +
    `&details=${encodeURIComponent(event.description ?? '')}` +
    `&location=${encodeURIComponent(event.location)}`

  try {
    await resend.emails.send({
      from: 'events@upstrategylab.com',
      to: rsvp.email,
      subject: `You're going to ${event.title} 🎉`,
      html: buildEmailHtml({ event, rsvp, gcalUrl, baseUrl }),
      attachments: icsContent
        ? [{ filename: 'event.ics', content: Buffer.from(icsContent).toString('base64') }]
        : [],
    })

    await supabase
      .from('rsvps')
      .update({ invite_sent: true })
      .eq('id', rsvp.id)
  } catch (err) {
    console.error('Failed to send invite email:', err)
  }
}

function formatGcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function buildEmailHtml({
  event,
  rsvp,
  gcalUrl,
  baseUrl,
}: {
  event: any
  rsvp: any
  gcalUrl: string
  baseUrl: string
}) {
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #111827; background: #ffffff;">
  <p style="color: #9ca3af; font-size: 13px; margin: 0 0 32px; letter-spacing: 0.05em; text-transform: uppercase;">Up Strategy Lab</p>

  <h1 style="font-size: 26px; font-weight: 700; margin: 0 0 8px; color: #111827;">
    You're in, ${rsvp.name ?? 'friend'}! 🎉
  </h1>
  <p style="color: #6b7280; margin: 0 0 32px; font-size: 16px;">
    Your spot at <strong style="color: #111827;">${event.title}</strong> is confirmed.
  </p>

  <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #6b7280; width: 24px;">📅</td>
        <td style="padding: 6px 0; font-size: 14px; color: #111827;">${format(startDate, 'EEEE, d MMMM yyyy')}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">🕐</td>
        <td style="padding: 6px 0; font-size: 14px; color: #111827;">${format(startDate, 'HH:mm')} – ${format(endDate, 'HH:mm')}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">📍</td>
        <td style="padding: 6px 0; font-size: 14px; color: #111827;">${event.location}</td>
      </tr>
    </table>
  </div>

  <table style="margin-bottom: 32px;">
    <tr>
      <td style="padding-right: 12px;">
        <a href="${gcalUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
          Add to Google Calendar
        </a>
      </td>
      <td>
        <a href="${baseUrl}/events/${event.slug}" style="display: inline-block; border: 1px solid #d1d5db; color: #374151; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
          View event
        </a>
      </td>
    </tr>
  </table>

  <p style="color: #9ca3af; font-size: 13px; margin: 0 0 8px;">
    A calendar file (.ics) is attached — works with Apple Calendar and Outlook.
  </p>

  <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 32px 0;">
  <p style="color: #9ca3af; font-size: 12px; margin: 0;">Up Strategy Lab · Gothenburg, Sweden</p>
</body>
</html>`
}
