import { NextResponse, type NextRequest } from 'next/server'
import { sendInviteEmail } from '@/lib/sendInvite'

export async function POST(request: NextRequest) {
  const { userId, eventId } = await request.json()
  const origin = new URL(request.url).origin

  if (!userId || !eventId) {
    return NextResponse.json({ error: 'Missing userId or eventId' }, { status: 400 })
  }

  await sendInviteEmail({ userId, eventId, origin })
  return NextResponse.json({ ok: true })
}
