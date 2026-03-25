import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data: { user: authUser } } = await supabase.auth.getUser(token);
    if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

    const { returnUrl } = req.body || {};

    const customers = await stripe.customers.list({ email: authUser.email, limit: 1 });
    if (!customers.data.length) {
      return res.status(404).json({ error: 'No billing account found. Please subscribe first.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: returnUrl || `${process.env.APP_URL || 'https://filmos.co'}/Dashboard`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Billing portal error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
