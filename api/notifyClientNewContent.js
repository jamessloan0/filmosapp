import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const { event: evt, data } = body;

    if (!data?.project_id) {
      return res.status(200).json({ skipped: 'no project_id' });
    }
    if (data.category !== 'deliverables') {
      return res.status(200).json({ skipped: 'not a deliverable' });
    }

    const { data: projects } = await supabase.from('projects').select('*').eq('id', data.project_id);
    const project = projects?.[0];
    if (!project) return res.status(200).json({ skipped: 'project not found' });

    if (data.created_by && data.created_by !== project.owner_email) {
      return res.status(200).json({ skipped: 'uploaded by client, not filmmaker' });
    }

    const clientEmail = project.client_email;
    if (!clientEmail) return res.status(200).json({ skipped: 'no client email' });

    const clientPortalUrl = `${process.env.APP_URL || 'https://filmos.co'}/ClientPortal?token=${project.access_token}`;
    const versionNote = data.version_note
      ? `<p style="color:#52525b;font-size:14px;margin:0 0 20px;padding:12px 16px;background:#f4f4f5;border-radius:8px;border-left:3px solid #18181b;"><em>${data.version_note}</em></p>`
      : '';

    const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;color:#18181b;">
      <div style="padding:32px 0 20px;">
        <span style="font-size:20px;font-weight:700;">FilmOS</span>
      </div>
      <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">New deliverable ready for you</h2>
      <p style="color:#71717a;font-size:14px;margin:0 0 6px;">A new file has been uploaded to <strong style="color:#18181b;">${project.name}</strong> for your review.</p>
      <p style="color:#71717a;font-size:14px;margin:0 0 20px;">📎 <strong style="color:#18181b;">${data.file_name}</strong></p>
      ${versionNote}
      <a href="${clientPortalUrl}" style="display:inline-block;background:#18181b;color:white;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;">View &amp; Download</a>
      <p style="color:#a1a1aa;font-size:11px;margin-top:32px;border-top:1px solid #f4f4f5;padding-top:16px;">You're receiving this because you have an active project in FilmOS.</p>
    </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FilmOS <notifications@filmos.co>',
        to: clientEmail,
        subject: `New deliverable ready: ${project.name}`,
        html,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error('Resend error:', JSON.stringify(result));
      return res.status(500).json({ error: result });
    }

    return res.status(200).json({ sent: true });
  } catch (error) {
    console.error('notifyClientNewContent error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
