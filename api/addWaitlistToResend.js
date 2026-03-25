export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    const email = payload?.data?.email || payload?.email;

    if (!email) return res.status(400).json({ error: 'No email in payload' });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

    // Add to Resend audience
    const contactRes = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false }),
    });
    const contactData = await contactRes.json();
    if (contactData.error) console.error('Resend audience error:', JSON.stringify(contactData));

    // Send thank-you email
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FilmOS <no-reply@filmos.co>',
        to: [email],
        subject: "You're on the FilmOS waitlist 🎬",
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;color:#18181b;">
            <h1 style="font-size:24px;font-weight:700;margin:0 0 12px;">You're on the list.</h1>
            <p style="font-size:16px;color:#52525b;line-height:1.6;margin:0 0 24px;">
              Thanks for joining the FilmOS waitlist! We're building the platform we always wished existed — proposals, video feedback, invoicing, and file delivery, all in one place for filmmakers.
            </p>
            <p style="font-size:16px;color:#52525b;line-height:1.6;margin:0 0 32px;">
              We'll reach out as soon as early access is ready.
            </p>
            <div style="border-top:1px solid #e4e4e7;padding-top:24px;">
              <p style="font-size:13px;color:#a1a1aa;margin:0;">
                You're receiving this because you signed up at <a href="https://filmos.co" style="color:#0ea5e9;text-decoration:none;">filmos.co</a>.
              </p>
            </div>
          </div>
        `,
      }),
    });
    const emailData = await emailRes.json();
    if (emailData.error) console.error('Resend email error:', JSON.stringify(emailData));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('addWaitlistToResend error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
