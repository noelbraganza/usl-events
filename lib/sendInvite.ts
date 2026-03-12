import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { createEvent } from 'ics'

interface SendInviteOptions {
  userId: string
  eventId: string
  origin: string
}

function formatEmailDate(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso))
}

function formatEmailTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso))
}

function getTimezoneAbbr(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, timeZoneName: 'short',
  }).formatToParts(new Date(iso)).find((p) => p.type === 'timeZoneName')?.value ?? tz
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
      startDate.getUTCFullYear(),
      startDate.getUTCMonth() + 1,
      startDate.getUTCDate(),
      startDate.getUTCHours(),
      startDate.getUTCMinutes(),
    ],
    startInputType: 'utc',
    end: [
      endDate.getUTCFullYear(),
      endDate.getUTCMonth() + 1,
      endDate.getUTCDate(),
      endDate.getUTCHours(),
      endDate.getUTCMinutes(),
    ],
    endInputType: 'utc',
    url: `${baseUrl}/events/${event.slug}`,
    organizer: { name: 'Up Strategy Lab', email: 'events@events.upstrategylab.com' },
  })

  const gcalUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(event.title)}` +
    `&dates=${formatGcalDate(startDate)}/${formatGcalDate(endDate)}` +
    `&details=${encodeURIComponent(event.description ?? '')}` +
    `&location=${encodeURIComponent(event.location)}`

  try {
    await resend.emails.send({
      from: 'events@events.upstrategylab.com',
      to: rsvp.email,
      subject: `You're on the list — ${event.title}`,
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
  const tz = event.timezone ?? 'Europe/Stockholm'
  const dateStr = formatEmailDate(event.start_date, tz)
  const timeStr = `${formatEmailTime(event.start_date, tz)} – ${formatEmailTime(event.end_date, tz)} ${getTimezoneAbbr(event.start_date, tz)}`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#111827;background:#ffffff">

  <p style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;margin:0 0 40px">Up Strategy Lab</p>

  <h1 style="font-size:22px;font-weight:700;margin:0 0 10px;color:#111827;line-height:1.3">
    You're on the list, ${rsvp.name?.split(' ')[0] ?? 'there'}.
  </h1>
  <p style="font-size:15px;color:#6b7280;margin:0 0 32px;line-height:1.6">
    Your spot at <strong style="color:#111827">${event.title}</strong> is confirmed. We'll see you there.
  </p>

  <div style="border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:32px">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#9ca3af;width:20px;vertical-align:top">📅</td>
        <td style="padding:5px 0 5px 10px;font-size:14px;color:#111827">${dateStr}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#9ca3af;vertical-align:top">🕐</td>
        <td style="padding:5px 0 5px 10px;font-size:14px;color:#111827">${timeStr}</td>
      </tr>
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#9ca3af;vertical-align:top">📍</td>
        <td style="padding:5px 0 5px 10px;font-size:14px;color:#111827">${event.location}</td>
      </tr>
    </table>
  </div>

  <table style="margin-bottom:12px">
    <tr>
      <td style="padding-right:12px">
        <a href="${gcalUrl}"
           style="display:inline-block;background:#111827;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
          Add to Google Calendar
        </a>
      </td>
      <td>
        <a href="${baseUrl}/events/${event.slug}"
           style="display:inline-block;color:#6b7280;padding:12px 0;text-decoration:none;font-size:14px">
          View event →
        </a>
      </td>
    </tr>
  </table>

  <p style="font-size:12px;color:#9ca3af;margin:0 0 4px;line-height:1.6">
    A calendar file (.ics) is attached — works with Apple Calendar and Outlook.
  </p>

  <hr style="border:none;border-top:1px solid #f3f4f6;margin:32px 0">
  <p style="font-size:12px;color:#9ca3af;margin:0">Up Strategy Lab · Gothenburg, Sweden</p>

</body>
</html>`
}
