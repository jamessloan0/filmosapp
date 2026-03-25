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
    // Require admin auth
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data: { user: authUser } } = await supabase.auth.getUser(token);
    if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

    const { data: callerProfile } = await supabase.from('users').select('role').eq('email', authUser.email).single();
    if (callerProfile?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { data: pending } = await supabase.from('pending_testers').select('*');
    if (!pending?.length) {
      return res.status(200).json({ promoted: [], message: 'No pending testers' });
    }

    const pendingEmails = pending.map(p => p.email.toLowerCase());

    const { data: allUsers } = await supabase.from('users').select('*');
    const toPromote = allUsers.filter(u =>
      pendingEmails.includes(u.email?.toLowerCase()) && u.role !== 'tester' && u.role !== 'admin'
    );

    const promoted = [];
    for (const u of toPromote) {
      await supabase.from('users').update({ role: 'tester' }).eq('id', u.id);
      promoted.push(u.email);
    }

    return res.status(200).json({ promoted, total: promoted.length });
  } catch (error) {
    console.error('promotePendingTesters error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
