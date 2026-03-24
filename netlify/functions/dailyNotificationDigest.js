import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  // Allow POST (manual trigger) or scheduled invocation
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Require a shared secret for direct HTTP calls to prevent unauthorized triggers
    const secret = event.headers['x-cron-secret'];
    if (secret !== process.env.CRON_SECRET) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    const { data: unread, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('read', false);

    if (error) throw error;
    if (!unread?.length) return { statusCode: 200, body: JSON.stringify({ sent: 0 }) };

    // Group by recipient
    const byRecipient = {};
    for (const n of unread) {
      if (!n.recipient_email) continue;
      if (!byRecipient[n.recipient_email]) byRecipient[n.recipient_email] = [];
      byRecipient[n.recipient_email].push(n);
    }

    const appUrl = process.env.APP_URL || 'https://filmos.co';

    const results = await Promise.all(
      Object.entries(byRecipient).map(async ([email, notifs]) => {
        const count = notifs.length;
        const rows = notifs.map(n =>
          `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
            <strong style="color:#18181b;font-size:13px;">${n.title}</strong>
            ${n.body ? `<br/><span style="color:#71717a;font-size:12px;">${n.body.substring(0, 100)}${n.body.length > 100 ? '…' : ''}</span>` : ''}
            ${n.project_name ? `<br/><span style="color:#a1a1aa;font-size:11px;">📁 ${n.project_name}</span>` : ''}
          </td></tr>`
        ).join('');

        const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#18181b;">
          <div style="padding:32px 0 16px;"><span style="font-size:20px;font-weight:700;">FilmOS</span></div>
          <h2 style="font-size:20px;font-weight:700;margin:0 0 6px;">You have ${count} unread notification${count !== 1 ? 's' : ''}</h2>
          <p style="color:#71717a;font-size:14px;margin:0 0 24px;">Here's a summary of what you missed today.</p>
          <table style="width:100%;border-collapse:collapse;">${rows}</table>
          <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e4e4e7;">
            <a href="${appUrl}" style="display:inline-block;background:#18181b;color:white;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:600;">Open FilmOS</a>
          </div>
          <p style="color:#a1a1aa;font-size:11px;margin-top:24px;">You're receiving this because you have unread notifications in FilmOS.</p>
        </div>`;

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'FilmOS <notifications@filmos.co>',
            to: email,
            subject: `FilmOS: ${count} unread notification${count !== 1 ? 's' : ''} today`,
            html,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error(`Resend error for ${email}:`, JSON.stringify(data));
          return { email, error: data };
        }
        return { email, id: data.id };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ sent: results.filter(r => !r.error).length, results }),
    };
  } catch (error) {
    console.error('dailyNotificationDigest error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
