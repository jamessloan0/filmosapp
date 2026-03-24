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
    const { token } = JSON.parse(event.body);
    if (!token) return { statusCode: 400, body: JSON.stringify({ error: 'Token required' }) };

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('access_token', token);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ project: projects?.[0] || null }),
    };
  } catch (error) {
    console.error('getProjectByToken error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
