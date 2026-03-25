import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvitation({
  to,
  guestName,
  eventTitle,
  eventType,
  eventSlug,
  hostName,
}: {
  to: string
  guestName: string
  eventTitle: string
  eventType: string
  eventSlug: string
  hostName: string
}) {
  const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/e/${eventSlug}`

  return resend.emails.send({
    from: 'Joyabl <hello@joyabl.com>',
    to,
    subject: `You're invited to ${eventTitle}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #2C2B26;">
        <h1 style="font-size: 28px; font-weight: 600; margin-bottom: 8px;">You're invited</h1>
        <p style="font-size: 16px; color: #8B8670; margin-bottom: 32px;">Hi ${guestName},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #2C2B26;">
          ${hostName} has invited you to celebrate <strong>${eventTitle}</strong>.
        </p>
        <a href="${eventUrl}" style="display: inline-block; margin-top: 32px; padding: 14px 28px; background: #2C2B26; color: #F5F0E8; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 500;">
          View the event →
        </a>
        <p style="margin-top: 48px; font-size: 13px; color: #B5A98A;">
          Sent with <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color: #8B8670; text-decoration: none;">Joyabl</a>
        </p>
      </div>
    `,
  })
}
