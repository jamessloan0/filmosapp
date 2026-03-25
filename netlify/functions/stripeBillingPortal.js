import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

    const { data: { user: authUser } } = await supabase.auth.getUser(token);
    if (!authUser) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

    const { returnUrl } = JSON.parse(event.body || '{}');

    const customers = await stripe.customers.list({ email: authUser.email, limit: 1 });
    if (!customers.data.length) {
      return { statusCode: 404, body: JSON.stringify({ error: 'No billing account found. Please subscribe first.' }) };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: returnUrl || `${process.env.APP_URL || 'https://filmos.co'}/Dashboard`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (error) {
    console.error('Billing portal error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
