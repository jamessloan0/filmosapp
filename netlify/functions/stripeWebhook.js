import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const signature = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: 'Webhook Error' };
  }

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;
      const customerEmail = session.metadata?.user_email || session.customer_email || session.customer_details?.email;
      console.log(`checkout.session.completed — email: ${customerEmail}`);

      if (customerEmail) {
        const { data: users } = await supabase.from('users').select('*').eq('email', customerEmail);
        if (users?.length) {
          await supabase.from('users').update({ plan: 'pro' }).eq('id', users[0].id);
          console.log(`Upgraded ${customerEmail} to pro`);
        } else {
          console.error(`No user found for email ${customerEmail}`);
        }
      }
    }

    if (stripeEvent.type === 'customer.subscription.deleted') {
      const subscription = stripeEvent.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);
      const customerEmail = customer.email;

      if (customerEmail) {
        const { data: users } = await supabase.from('users').select('*').eq('email', customerEmail);
        if (users?.length) {
          await supabase.from('users').update({ plan: 'free' }).eq('id', users[0].id);
          console.log(`Downgraded ${customerEmail} to free`);
        }
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
