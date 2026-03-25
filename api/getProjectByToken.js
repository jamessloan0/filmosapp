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
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('access_token', token);

    if (error) throw error;

    return res.status(200).json({ project: projects?.[0] || null });
  } catch (error) {
    console.error('getProjectByToken error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
