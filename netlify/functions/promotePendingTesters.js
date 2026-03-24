import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Require admin auth
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

    const { data: { user: authUser } } = await supabase.auth.getUser(token);
    if (!authUser) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

    const { data: callerProfile } = await supabase.from('users').select('role').eq('email', authUser.email).single();
    if (callerProfile?.role !== 'admin') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden: Admin access required' }) };
    }

    const { data: pending } = await supabase.from('pending_testers').select('*');
    if (!pending?.length) {
      return { statusCode: 200, body: JSON.stringify({ promoted: [], message: 'No pending testers' }) };
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

    return { statusCode: 200, body: JSON.stringify({ promoted, total: promoted.length }) };
  } catch (error) {
    console.error('promotePendingTesters error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
