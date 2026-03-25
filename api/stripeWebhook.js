import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Vercel must NOT parse the body — Stripe needs the raw bytes to verify the signature
export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send('Webhook Error');
  }

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;
      const customerEmail = session.metadata?.user_email || session.customer_email || session.customer_details?.email;
      if (customerEmail) {
        const { data: users } = await supabase.from('users').select('*').eq('email', customerEmail);
        if (users?.length) {
          await supabase.from('users').update({ plan: 'pro' }).eq('id', users[0].id);
          console.log(`Upgraded ${customerEmail} to pro`);
        }
      }
    }

    if (stripeEvent.type === 'customer.subscription.deleted') {
      const subscription = stripeEvent.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);
      if (customer.email) {
        const { data: users } = await supabase.from('users').select('*').eq('email', customer.email);
        if (users?.length) {
          await supabase.from('users').update({ plan: 'free' }).eq('id', users[0].id);
          console.log(`Downgraded ${customer.email} to free`);
        }
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message);
  }

  return res.status(200).json({ received: true });
}
