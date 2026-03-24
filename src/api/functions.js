/**
 * Functions layer — replaces base44.functions.invoke().
 * Calls Netlify serverless functions, passing the Supabase session token
 * in the Authorization header so functions can authenticate the user.
 */
import { supabase } from './supabaseClient';

export async function invoke(functionName, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`/.netlify/functions/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Function ${functionName} failed`);
  // Wrap in { data } to match base44 response shape used throughout the app
  return { data };
}
