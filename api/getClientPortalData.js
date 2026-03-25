import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLE_MAP = {
  files:        { table: 'project_files', order: 'created_at', ascending: false },
  messages:     { table: 'messages',      order: 'created_at', ascending: true  },
  invoices:     { table: 'invoices',      order: 'created_at', ascending: false },
  activities:   { table: 'activities',    order: 'created_at', ascending: false },
  feedback:     { table: 'feedback',      order: 'created_at', ascending: false },
  proposals:    { table: 'proposals',     order: 'created_at', ascending: false },
  deliverables: { table: 'project_files', order: 'created_at', ascending: true, extra: { category: 'deliverables' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { project_id, type } = req.body;
    if (!project_id) return res.status(400).json({ error: 'project_id required' });

    const config = TABLE_MAP[type];
    if (!config) return res.status(400).json({ error: 'Unknown type' });

    let query = supabase
      .from(config.table)
      .select('*')
      .eq('project_id', project_id)
      .order(config.order, { ascending: config.ascending });

    if (config.extra) {
      for (const [k, v] of Object.entries(config.extra)) {
        query = query.eq(k, v);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ data: data || [] });
  } catch (error) {
    console.error('getClientPortalData error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
