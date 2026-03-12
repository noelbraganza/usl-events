import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockEmailsSend = vi.fn()
const mockRsvpSelect = vi.fn()
const mockEventSelect = vi.fn()
const mockUpdate = vi.fn()

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockEmailsSend },
  })),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              single: table === 'rsvps' ? mockRsvpSelect : mockEventSelect,
            }),
            single: mockEventSelect,
          }),
          single: mockEventSelect,
        }),
      }),
      update: () => ({
        eq: () => mockUpdate(),
      }),
    }),
  }),
}))

describe('sendInviteEmail', () => {
  beforeEach(() => {
    mockEmailsSend.mockReset()
    mockRsvpSelect.mockReset()
    mockEventSelect.mockReset()
    mockUpdate.mockReset()
    delete process.env.RESEND_API_KEY
  })

  it('returns early when RESEND_API_KEY is not set', async () => {
    const { sendInviteEmail } = await import('@/lib/sendInvite')
    await sendInviteEmail({ userId: 'u1', eventId: 'e1', origin: 'http://localhost:3000' })
    expect(mockEmailsSend).not.toHaveBeenCalled()
  })

  it('returns early when invite_sent is true', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    mockRsvpSelect.mockResolvedValue({
      data: { id: 'r1', email: 'test@test.com', name: 'Test', invite_sent: true, status: 'confirmed' },
    })

    const { sendInviteEmail } = await import('@/lib/sendInvite')
    await sendInviteEmail({ userId: 'u1', eventId: 'e1', origin: 'http://localhost:3000' })
    expect(mockEmailsSend).not.toHaveBeenCalled()
  })
})
